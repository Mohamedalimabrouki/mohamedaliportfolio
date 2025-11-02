# Project Overview

This is a production-ready, bilingual (EN/FR) portfolio website for Mohamed Ali Mabrouki. It showcases projects related to Euro 7 braking, WVTA dossiers, and wheel-end industrialisation programmes. The site is built using HTML, CSS, and JavaScript, with Node.js scripts for content generation and other development tasks. Content is managed through JSON files, allowing for centralized updates.

# Building and Running

## Setup
To set up the project, run the following command to install dependencies, including Playwright and Lighthouse tooling:
```bash
npm install
```

## Generating Pages
HTML pages are generated from JSON content. After any content edits, you must regenerate the HTML outputs:
```bash
node tools/generate-pages.js
```

## Running Locally
To serve the site locally, you can use `npx serve` or any static server (e.g., VS Code Live Server):
```bash
npx serve .
```

## Generating Sitemap
After adding or removing public pages, regenerate the sitemap to update timestamps and `hreflang` alternates:
```bash
node scripts/generate-sitemap.mjs
```

# Development Conventions

## Content Editing
*   **Projects:** Update `content/projects.json`. Each project object includes bilingual titles/summaries, metadata, highlights, and image references. Image assets (1600x900 JPG + WebP pairs) should be stored in `/assets/img/projects/`.
*   **UI Copy:** Edit `content/site_en.json` and `content/site_fr.json` in tandem. Ensure keys are identical across both files.
*   Always run `node tools/generate-pages.js` after editing content.

## Imagery Guidelines
*   **Hero & About Portrait:** `/assets/img/avatar.jpg` (800px square) and `/assets/img/avatar-circle.png` (transparent circle variant).
*   **Project Covers:** `/assets/img/projects/{slug}.jpg` and `.webp` (1600x900). Names must match the `cover` field in `projects.json`.
*   **Social Preview:** `/assets/img/og-banner.jpg` (1200x630). Update when brand palette or photography changes.

## UI Behavior
*   **Language Switcher:** Persists preference in `localStorage`, auto-detects browser language, and maintains the equivalent route.
*   **Motion System:** Parallax, tilt, and reveals respect `prefers-reduced-motion`. Touch devices use subtle scale/shadow interactions.
*   **Projects Filters:** Client-side filtering by capability, role, and year.
*   **Contact Form:** Opens a `mailto:` draft with prefilled body fields; no server-side data storage.

## Quality Assurance
The project aims for high quality with the following targets:
*   **Lighthouse (desktop):** ≥95 Performance, 100 SEO/Best Practices/Accessibility (audited via `npm run lighthouse`).
*   **Accessibility:** 0 serious issues (audited via Axe DevTools / Lighthouse A11y).
*   **HTML Validation:** No errors (validated via https://validator.w3.org/nu/).
