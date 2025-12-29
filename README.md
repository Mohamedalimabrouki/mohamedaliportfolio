# Project Overview

This is a high-performance portfolio website built with **Astro**, prioritizing speed, accessibility, and developer experience.

- **Framework:** [Astro 5](https://astro.build) (Zero-JS by default)
- **Styling:** CSS Variables & Scoped Styles
- **Content:** Type-safe JSON (Content Collections)
- **Testing:** Playwright E2E
- **Deployment:** Static Build (`dist/`)

# Development

## Setup
```bash
npm install
```

## Running Locally
```bash
npm run dev
# Visit http://localhost:4173
```

## Building for Production
```bash
npm run build
# Output is in /dist
```

## Testing
```bash
npm run test
```

# Architecture

- **`src/pages`**: Route definitions.Localized routes (`/`, `/fr/`) use shared Astro layouts.
- **`src/components`**: Reusable UI blocks (`Hero.astro`, `ProjectCard.astro`).
- **`src/content`**: Type-safe JSON data schemas.
- **`src/layouts`**: `Layout.astro` handles the HTML shell, metadata, and global UI (nav, footer).
- **`public`**: Static assets (images, fonts, CV).

# Key Decisions

- **Why Astro?** It replaces a custom Node.js SSG script with a standard, maintained framework while preserving the exact HTML output structure.
- **Legacy CSS:** Global CSS files were preserved in `src/styles` to ensure 100% visual fidelity during migration.
- **Image Handling:** Uses Astro's native `<Picture />` component (via `astro:assets`) for automatic AVIF/WebP optimization and responsive sizing. Source images live in `src/assets/`.