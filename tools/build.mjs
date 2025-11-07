import { promises as fs } from 'fs';
import CleanCSS from 'clean-css';
import { minify } from 'terser';
import path from 'path';

const __dirname = path.resolve();

async function buildCss() {
    const cssDir = path.join(__dirname, 'assets', 'css');
    const outputCssPath = path.join(__dirname, 'assets', 'css', 'bundle.min.css');
    const cssFiles = [
        'base.css',
        'themes.css',
        'layout.css',
        'components.css',
        'hero-v2.css',
        'cv.css', // Include cv.css as it's now harmonized
        'enhancements.css',
        'issues.css'
    ];

    let fullCss = '';
    for (const file of cssFiles) {
        const filePath = path.join(cssDir, file);
        try {
            fullCss += await fs.readFile(filePath, 'utf8');
        } catch (error) {
            console.warn(`Warning: Could not read CSS file ${file}. Skipping.`);
        }
    }

    const minifiedCss = new CleanCSS().minify(fullCss).styles;
    await fs.writeFile(outputCssPath, minifiedCss);
    console.log('CSS bundled and minified to assets/css/bundle.min.css');
}

async function buildJs() {
    const jsDir = path.join(__dirname, 'assets', 'js');
    const outputJsPath = path.join(__dirname, 'assets', 'js', 'bundle.min.js');
    const jsFiles = [
        'projects.js',
        'hero-v2.js',
        'ui.js'
    ]; // Exclude i18n.js and theme.js as they are loaded differently or have inline scripts

    let fullJs = '';
    for (const file of jsFiles) {
        const filePath = path.join(jsDir, file);
        try {
            fullJs += await fs.readFile(filePath, 'utf8');
        } catch (error) {
            console.warn(`Warning: Could not read JS file ${file}. Skipping.`);
        }
    }

    const minifiedJs = await minify(fullJs);
    if (minifiedJs.code) {
        await fs.writeFile(outputJsPath, minifiedJs.code);
        console.log('JavaScript bundled and minified to assets/js/bundle.min.js');
    } else {
        console.error('JavaScript minification failed:', minifiedJs.error);
    }
}

async function build() {
    console.log('Starting build process...');
    await buildCss();
    await buildJs();
    console.log('Build process finished.');
}

build().catch(console.error);
