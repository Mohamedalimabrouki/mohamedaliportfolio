import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'sitemap.xml');

const BASE_URL = 'https://mohamedalimabrouki.com';

const pages = [
  { loc: `${BASE_URL}/`, priority: '1.0' },
  { loc: `${BASE_URL}/cv.html`, priority: '0.9' },
  { loc: `${BASE_URL}/project.html`, priority: '0.6' }
];

const today = new Date().toISOString().split('T')[0];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map(page => {
    return [
      '  <url>',
      `    <loc>${page.loc}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      page.priority ? `    <priority>${page.priority}</priority>` : null,
      '  </url>'
    ]
      .filter(Boolean)
      .join('\n');
  }),
  '</urlset>',
  ''
].join('\n');

await fs.writeFile(OUTPUT_PATH, sitemap, 'utf8');
console.log(`Sitemap written to ${path.relative(ROOT, OUTPUT_PATH)}`);
