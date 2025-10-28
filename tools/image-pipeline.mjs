import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');
const OPTIMIZED_DIR = path.join(ASSETS_DIR, 'optimized');
const MANIFEST_PATH = path.join(ROOT, 'content', 'assets-manifest.json');
const PROJECTS_PATH = path.join(ROOT, 'content', 'projects.json');

const WIDTHS = [320, 640, 960, 1280, 1600];
const FORMATS = [
  { ext: 'avif', options: { quality: 55, effort: 6 } },
  { ext: 'webp', options: { quality: 78 } },
  { ext: 'jpg', options: { quality: 80, progressive: true, chromaSubsampling: '4:4:4' } }
];

const DEFAULT_FOCUS = '50% 50%';
const usedBases = new Set();

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJSON(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (fallback !== null) return fallback;
    throw err;
  }
}

function slugifySegment(segment) {
  return segment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const toPosixPath = (input) => input.split(path.sep).join('/');

async function collectSourceImages() {
  const files = [];
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'optimized') continue;
        await walk(fullPath);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
      const relative = toPosixPath(path.relative(ROOT, fullPath));
      files.push(relative);
    }
  }
  await walk(ASSETS_DIR);
  files.sort();
  return files;
}

async function collectFocusOverrides() {
  const focusMap = new Map();
  const projects = await readJSON(PROJECTS_PATH, []);
  if (!Array.isArray(projects)) return focusMap;

  projects.forEach(project => {
    const focus = project?.details?.focus || project?.focus;
    const image = project?.image;
    const normalizedFocus = focus || DEFAULT_FOCUS;
    const setFocus = (key) => {
      if (!key) return;
      const normalizedKey = key.replace(/^[./]+/, '').replace(/\\/g, '/');
      focusMap.set(normalizedKey.startsWith('assets/') ? normalizedKey : `assets/${normalizedKey}`, normalizedFocus);
    };
    if (image) {
      setFocus(image);
    }
    const gallery = project?.details?.gallery;
    if (Array.isArray(gallery)) {
      gallery.forEach((item) => {
        setFocus(item);
      });
    }
  });

  return focusMap;
}

async function generatePlaceholder(sharpInstance) {
  const buffer = await sharpInstance
    .clone()
    .resize(32, 32, { fit: 'inside', withoutEnlargement: true })
    .toFormat('jpeg', { quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function processImage(relPath, focusMap) {
  const absolutePath = path.join(ROOT, relPath);
  const withoutExt = relPath.replace(/\.[^/.]+$/, '');
  const segments = toPosixPath(withoutExt)
    .split('/')
    .filter(Boolean)
    .slice(relPath.startsWith('assets/') ? 1 : 0)
    .map((segment) => slugifySegment(segment))
    .filter(Boolean);
  const baseCandidate = segments.join('-') || 'image';
  const safeBase = ensureUniqueBase(baseCandidate);
  const outputRecords = {};

  const source = sharp(absolutePath).trim();
  const metadata = await source.clone().metadata();
  const aspectRatio =
    metadata.width && metadata.height
      ? Number((metadata.width / metadata.height).toFixed(4))
      : null;
  const placeholder = await generatePlaceholder(source);
  const focus = focusMap.get(relPath) || DEFAULT_FOCUS;

  for (const format of FORMATS) {
    const variants = [];
    for (const width of WIDTHS) {
      if (metadata.width && width > metadata.width) {
        continue;
      }
      const filename = `${safeBase}-${width}.${format.ext}`;
      const destPath = path.join(OPTIMIZED_DIR, filename);
      await source
        .clone()
        .resize(width, null, {
          fit: sharp.fit.cover,
          position: sharp.strategy.attention,
          withoutEnlargement: true
        })
        .toFormat(format.ext, format.options)
        .toFile(destPath);
      variants.push({
        width,
        path: toPosixPath(path.join('assets', 'optimized', filename))
      });
    }

    if (!variants.length && metadata.width) {
      const width = metadata.width;
      const filename = `${safeBase}-${width}.${format.ext}`;
      const destPath = path.join(OPTIMIZED_DIR, filename);
      await source
        .clone()
        .resize(width, null, {
          fit: sharp.fit.cover,
          position: sharp.strategy.attention
        })
        .toFormat(format.ext, format.options)
        .toFile(destPath);
      variants.push({
        width,
        path: toPosixPath(path.join('assets', 'optimized', filename))
      });
    }

    if (variants.length) {
      outputRecords[format.ext] = {
        srcset: variants.map((v) => `/${v.path} ${v.width}w`).join(', '),
        sources: variants
      };
    }
  }

  const fallbackPath =
    outputRecords.jpg?.sources?.[outputRecords.jpg.sources.length - 1]?.path ||
    outputRecords.webp?.sources?.[outputRecords.webp.sources.length - 1]?.path ||
    outputRecords.avif?.sources?.[outputRecords.avif.sources.length - 1]?.path ||
    relPath;
  const fallback = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;

  return {
    original: relPath,
    focus,
    width: metadata.width || null,
    height: metadata.height || null,
    aspectRatio,
    placeholder,
    formats: outputRecords,
    fallback
  };
}

function ensureUniqueBase(base) {
  let candidate = base;
  let suffix = 1;
  while (usedBases.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  usedBases.add(candidate);
  return candidate;
}

async function run() {
  await fs.rm(OPTIMIZED_DIR, { recursive: true, force: true });
  await ensureDir(OPTIMIZED_DIR);
  usedBases.clear();
  const focusMap = await collectFocusOverrides();
  const sources = await collectSourceImages();
  const manifestEntries = {};

  for (const relPath of sources) {
    console.log(`Optimizing ${relPath}`);
    const record = await processImage(relPath, focusMap);
    manifestEntries[relPath] = record;
  }

  await fs.writeFile(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        widths: WIDTHS,
        formats: FORMATS.map(f => f.ext),
        images: manifestEntries
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`Manifest written to ${path.relative(ROOT, MANIFEST_PATH)}`);
}

run().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
