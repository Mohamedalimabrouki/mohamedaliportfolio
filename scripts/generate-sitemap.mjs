import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'sitemap.xml');
const CONTENT_PATH = path.join(ROOT, 'content', 'projects.json');
const BASE_URL = 'https://mohamedalimabrouki.com';

const readProjects = async () => {
  const buffer = await fs.readFile(CONTENT_PATH, 'utf8');
  return JSON.parse(buffer);
};

const formatUrl = (pathSuffix) => {
  if (pathSuffix === '/' || pathSuffix === '') return `${BASE_URL}/`;
  const cleaned = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;
  return `${BASE_URL}${cleaned}`;
};

const today = new Date().toISOString().split('T')[0];

const buildEntries = (projects) => {
  const basePages = [
    { en: '/index.html', fr: '/fr/index.html', priority: '1.0' },
    { en: '/projects/index.html', fr: '/fr/projets/index.html', priority: '0.8' },
    { en: '/cv.html', fr: '/fr/cv.html', priority: '0.7' }
  ];

  const projectPages = projects.map((project) => ({
    en: `/projects/${project.id}.html`,
    fr: `/fr/projets/${project.id}.html`,
    priority: '0.7'
  }));

  return [...basePages, ...projectPages];
};

const renderUrlEntry = ({ en, fr, priority }) => {
  const url = formatUrl(en);
  const alt = formatUrl(fr);
  return [
    '  <url>',
    `    <loc>${url}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    priority ? `    <priority>${priority}</priority>` : null,
    `    <xhtml:link rel="alternate" hreflang="en" href="${url}" />`,
    `    <xhtml:link rel="alternate" hreflang="fr" href="${alt}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${formatUrl('/index.html')}" />`,
    '  </url>'
  ]
    .filter(Boolean)
    .join('\n');
};

const buildSitemap = async () => {
  const projects = await readProjects();
  const entries = buildEntries(projects).map(renderUrlEntry).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${entries}\n` +
    `</urlset>\n`;
  await fs.writeFile(OUTPUT_PATH, sitemap, 'utf8');
  console.log(`Sitemap written to ${path.relative(ROOT, OUTPUT_PATH)}`);
};

buildSitemap().catch((error) => {
  console.error('Failed to build sitemap', error);
  process.exit(1);
});
