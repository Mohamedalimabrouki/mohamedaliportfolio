import { generate } from 'critical';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function generateCriticalCss() {
  try {
    const { css } = await generate({
      base: root,
      src: 'index.html',
      width: 1300,
      height: 900,
      // Inline the generated critical-path CSS
      // - true generates HTML
      // - false generates CSS
      inline: false,
    });
    writeFileSync(path.join(root, 'assets/css/critical.css'), css, 'utf8');
    console.log('Critical CSS generated successfully.');
  } catch (error) {
    console.error('Error generating critical CSS:', error);
    process.exit(1);
  }
}

generateCriticalCss();
