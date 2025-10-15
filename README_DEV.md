# Developer guide

## Local preview

```bash
npm install
npm run build:images   # regenerate responsive assets & manifest
npx playwright install # first run only, installs browsers
npm run test:ui        # optional check that UI smoke tests pass
```

To review the site locally:

```bash
node tools/dev-server.mjs
# visit http://127.0.0.1:4173
```

## Image pipeline

The Sharp-based pipeline lives in `tools/image-pipeline.mjs` and reads every JPG/PNG in `assets/`. It trims borders, applies attention-based crops, and emits AVIF/WEBP/JPEG renditions (320–1600px width) alongside `content/assets-manifest.json`. Run it whenever raw assets change.

## Internationalisation

Strings live in `content/i18n_en.json` and `content/i18n_fr.json`. Project-specific copy can define `*_fr` keys for titles, summaries, bullets, and KPIs. Use `?lang=fr` for a forced French view.

## Testing & quality

- `npm run test:ui` runs Playwright smoke coverage against the static server.
- `npm run lighthouse` executes Lighthouse CI with ≥0.95 guardrails across Performance, Accessibility, Best Practices, and SEO.

## Deployment

The site is deployable as a static bundle (GitHub Pages/Netlify). `netlify.toml` applies caching and security headers. `CNAME` is set to `mohamedalimabrouki.com`.

## Analytics

Plausible analytics are loaded from `plausible.io` and respect Do Not Track. CTA clicks and project views are instrumented in `script.js`.
