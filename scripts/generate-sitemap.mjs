import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const CONFIG_PATH = path.join(CONTENT_DIR, 'config.json');
const PROJECTS_PATH = path.join(CONTENT_DIR, 'projects.json');
const OUTPUT_PATH = path.join(ROOT, 'sitemap.xml');

async function readJSON(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

function ensureAbsoluteUrl(base, value) {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch (error) {
    console.warn('Could not normalise URL', value, error);
    return null;
  }
}

function formatUrlEntry({ loc, lastmod, priority, images = [] }) {
  const parts = [];
  parts.push('  <url>');
  parts.push(`    <loc>${loc}</loc>`);
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  images.forEach(image => {
    parts.push('    <image:image>');
    parts.push(`      <image:loc>${image.loc}</image:loc>`);
    if (image.title) parts.push(`      <image:title>${image.title}</image:title>`);
    parts.push('    </image:image>');
  });
  parts.push('  </url>');
  return parts.join('\n');
}

async function generate() {
  const config = (await readJSON(CONFIG_PATH, {})) ?? {};
  const projects = (await readJSON(PROJECTS_PATH, [])) ?? [];
  const baseUrl = config.portfolio || 'https://mohamedalimabrouki.com/';
  const base = new URL(baseUrl);
  const today = new Date().toISOString().split('T')[0];

  const entries = [
    formatUrlEntry({
      loc: base.origin + '/',
      lastmod: today,
      priority: '1.0'
    })
  ];

  projects.forEach(project => {
    if (!project?.slug) return;
    const loc = `${base.origin}/project.html?p=${encodeURIComponent(project.slug)}`;
    const imageSource =
      (Array.isArray(project.details?.gallery) && project.details.gallery[0]) ||
      project.image;
    const imageUrl = ensureAbsoluteUrl(base.origin + '/', imageSource);
    const images = imageUrl
      ? [
          {
            loc: imageUrl,
            title: project.title
          }
        ]
      : [];

    entries.push(
      formatUrlEntry({
        loc,
        lastmod: today,
        priority: '0.8',
        images
      })
    );
  });

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    entries.join('\n'),
    '</urlset>',
    ''
  ].join('\n');

  await fs.writeFile(OUTPUT_PATH, sitemap, 'utf8');
  console.log(`Sitemap generated at ${path.relative(ROOT, OUTPUT_PATH)}`);
}

generate().catch(error => {
  console.error('Failed to generate sitemap:', error);
  process.exitCode = 1;
});
