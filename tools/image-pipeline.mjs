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

async function collectSourceImages() {
  const entries = await fs.readdir(ASSETS_DIR, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (entry.name === 'optimized') continue;
      // Nested directories can be added here if needed.
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
    files.push(path.join('assets', entry.name));
  }
  return files;
}

async function collectFocusOverrides() {
  const focusMap = new Map();
  const projects = await readJSON(PROJECTS_PATH, []);
  if (!Array.isArray(projects)) return focusMap;

  projects.forEach(project => {
    const focus = project?.details?.focus || project?.focus;
    const image = project?.image;
    if (image) {
      focusMap.set(image, focus || DEFAULT_FOCUS);
    }
    const gallery = project?.details?.gallery;
    if (Array.isArray(gallery)) {
      gallery.forEach(item => {
        focusMap.set(item, focus || DEFAULT_FOCUS);
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
  const baseName = path.basename(relPath, path.extname(relPath));
  const safeBase = slugifySegment(baseName) || 'image';
  const outputRecords = {};

  const source = sharp(absolutePath).trim();
  const metadata = await source.clone().metadata();
  const aspectRatio = metadata.width && metadata.height
    ? Number((metadata.width / metadata.height).toFixed(4))
    : null;
  const placeholder = await generatePlaceholder(source);
  const focus = focusMap.get(relPath) || DEFAULT_FOCUS;

  for (const format of FORMATS) {
    const variants = [];
    for (const width of WIDTHS) {
      if (metadata.width && width > metadata.width) {
        // Avoid upscaling
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
        path: path.join('assets', 'optimized', filename)
      });
    }

    // If the original image is smaller than the smallest target width,
    // we still create a single rendition to keep the pipeline consistent.
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
        path: path.join('assets', 'optimized', filename)
      });
    }

    if (variants.length) {
      outputRecords[format.ext] = {
        srcset: variants.map(v => `${v.path} ${v.width}w`).join(', '),
        sources: variants
      };
    }
  }

  const fallback =
    outputRecords.jpg?.sources?.[outputRecords.jpg.sources.length - 1]?.path ||
    relPath;

  return {
    original: relPath,
    focus,
    aspectRatio,
    placeholder,
    formats: outputRecords,
    fallback
  };
}

async function run() {
  await ensureDir(OPTIMIZED_DIR);
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
