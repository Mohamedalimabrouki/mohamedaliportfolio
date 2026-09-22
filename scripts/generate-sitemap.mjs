import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Builds public/sitemap.xml from the project content files.
// Runs automatically before `astro build` (see package.json).

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'public', 'sitemap.xml');
const PROJECTS_DIR = path.join(ROOT, 'src', 'content', 'projects');
const BASE_URL = 'https://mohamedalimabrouki.com';

const readProjects = async () => {
  const files = (await fs.readdir(PROJECTS_DIR)).filter((f) => f.endsWith('.json'));
  const projects = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(PROJECTS_DIR, file), 'utf8');
    projects.push(JSON.parse(raw));
  }
  return projects.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
};

const formatUrl = (pathSuffix) => {
  if (pathSuffix === '/' || pathSuffix === '') return `${BASE_URL}/`;
  const cleaned = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;
  return `${BASE_URL}${cleaned}${cleaned.endsWith('/') ? '' : '/'}`;
};

const today = new Date().toISOString().split('T')[0];

const buildEntries = (projects) => {
  const basePages = [
    { en: '/', fr: '/fr/', priority: '1.0' },
    { en: '/projects/', fr: '/fr/projets/', priority: '0.8' },
    { en: '/cv/', fr: '/fr/cv/', priority: '0.8' }
  ];
  const projectPages = projects.map((project) => ({
    en: `/projects/${project.id}/`,
    fr: `/fr/projets/${project.id}/`,
    priority: '0.6'
  }));
  return [...basePages, ...projectPages];
};

const renderUrlEntry = ({ en, fr, priority }) => {
  const url = formatUrl(en);
  const alt = formatUrl(fr);
  const entry = (loc, self, other, selfLang, otherLang) => [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <priority>${priority}</priority>`,
    `    <xhtml:link rel="alternate" hreflang="${selfLang}" href="${self}" />`,
    `    <xhtml:link rel="alternate" hreflang="${otherLang}" href="${other}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${url}" />`,
    '  </url>'
  ].join('\n');
  return [entry(url, url, alt, 'en', 'fr'), entry(alt, alt, url, 'fr', 'en')].join('\n');
};

const buildSitemap = async () => {
  const projects = await readProjects();
  const entries = buildEntries(projects).map(renderUrlEntry).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${entries}\n` +
    `</urlset>\n`;
  await fs.writeFile(OUTPUT_PATH, sitemap, 'utf8');
  console.log(`Sitemap written to ${path.relative(ROOT, OUTPUT_PATH)} (${projects.length} projects)`);
};

buildSitemap().catch((error) => {
  console.error('Failed to build sitemap', error);
  process.exit(1);
});
