import { promises as fs } from 'fs';
import path from 'path';

const __dirname = path.resolve();
const projectRoot = __dirname;

async function getHtmlFiles(dir) {
    let files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                continue; // Skip node_modules and hidden directories
            }
            files = files.concat(await getHtmlFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

async function updateHtmlFiles() {
    const htmlFiles = await getHtmlFiles(projectRoot);

    const cssOldPattern = /<link rel="preload" href="\/assets\/css\/(base|themes|layout|components|hero-v2|cv|enhancements|issues)\.css" as="style">\s*<link rel="stylesheet" href="\/assets\/css\/(base|themes|layout|components|hero-v2|cv|enhancements|issues)\.css">/g;
    const cssNewString = '<link rel="preload" href="/assets/css/bundle.min.css" as="style">\n  <link rel="stylesheet" href="/assets/css/bundle.min.css">';

    const jsOldPattern = /(?:\s*<script defer src="\/assets\/js\/(hero-v2|ui|projects)\.js"><\/script>)+/g;
    const jsNewString = '\n  <script defer src="/assets/js/bundle.min.js"></script>';

    for (const file of htmlFiles) {
        const filePath = file;
        let content = await fs.readFile(filePath, 'utf8');

        // Apply CSS replacement
        if (content.match(cssOldPattern)) {
            content = content.replace(cssOldPattern, cssNewString);
            console.log(`Updated CSS links in: ${file}`);
        }

        // Apply JS replacement
        // This is a bit trickier as we need to replace multiple script tags with one,
        // and ensure we don't touch theme.js or i18n.js.
        // A two-step approach: remove individual scripts, then add the bundle if any were removed.
        let jsScriptsRemoved = false;
        const scriptsToRemove = [
            '<script defer src="/assets/js/hero-v2.js"></script>',
            '<script defer src="/assets/js/ui.js"></script>',
            '<script defer src="/assets/js/projects.js"></script>'
        ];

        for (const scriptTag of scriptsToRemove) {
            if (content.includes(scriptTag)) {
                content = content.replace(scriptTag, '');
                jsScriptsRemoved = true;
            }
        }

        // Find the insertion point for the new bundle.min.js
        // This assumes theme.js and i18n.js are always present and in that order.
        const i18nScriptTag = '<script defer src="/assets/js/i18n.js"></script>';
        const themeScriptTag = '<script defer src="/assets/js/theme.js"></script>';
        
        let insertionPoint = -1;
        if (content.includes(i18nScriptTag)) {
            insertionPoint = content.indexOf(i18nScriptTag) + i18nScriptTag.length;
        } else if (content.includes(themeScriptTag)) {
            insertionPoint = content.indexOf(themeScriptTag) + themeScriptTag.length;
        }

        if (jsScriptsRemoved && insertionPoint !== -1) {
            // Insert bundle.min.js after the last remaining defer script (i18n.js or theme.js)
            // or at the end of the head if no other defer scripts are found.
            const bundleScriptTag = '\n  <script defer src="/assets/js/bundle.min.js"></script>';
            content = content.slice(0, insertionPoint) + bundleScriptTag + content.slice(insertionPoint);
            console.log(`Updated JS links in: ${file}`);
        } else if (jsScriptsRemoved && insertionPoint === -1) {
            // Fallback: if no i18n.js or theme.js, insert before </body>
            const closingBodyTag = '</body>';
            const bundleScriptTag = '\n  <script defer src="/assets/js/bundle.min.js"></script>';
            content = content.replace(closingBodyTag, `${bundleScriptTag}\n${closingBodyTag}`);
            console.log(`Updated JS links in: ${file} (fallback insertion)`);
        }


        await fs.writeFile(filePath, content);
    }
    console.log('Finished updating HTML files.');
}

updateHtmlFiles().catch(console.error);
