# Mohamed Ali Mabrouki — Portfolio

Production-ready, bilingual (EN/FR) portfolio for Mohamed Ali Mabrouki covering Euro 7 braking, WVTA dossiers, and wheel-end industrialisation programmes.

## Quick start

```bash
npm install   # first run only (installs Playwright + Lighthouse tooling)
node tools/generate-pages.js
npx serve .   # or use VS Code Live Server / any static server
```

Pages are generated from JSON content so copy updates stay centralised. Any time you edit content, rerun `node tools/generate-pages.js` to refresh the HTML outputs.

## Project structure

```
assets/
  css/          # base tokens, layout, components, themed + CV styles
  img/          # avatar, favicons, social banner, project imagery
    projects/   # project hero + gallery assets (JPG + WebP pairs)
  js/           # i18n + UI enhancements (parallax, filters, contact form)
  cv/           # downloadable DOCX résumé
content/
  site_en.json  # English UI copy & metadata
  site_fr.json  # French UI copy & metadata
  projects.json # Case study data shared by generator & front-end JS
tools/
  generate-pages.js   # builds all HTML from the content layer
scripts/
  generate-sitemap.mjs # emits sitemap.xml with hreflang alternates
index.html            # generated EN home page (do not hand-edit)
fr/index.html         # generated FR home page
projects/*.html       # generated EN project listing + detail pages
fr/projets/*.html     # generated FR equivalents
cv.html, fr/cv.html   # generated résumé pages
robots.txt, sitemap.xml
```

## Editing content & translations

1. **Projects** — update `content/projects.json`. Each object includes bilingual titles/summaries, role/period/client metadata, highlights/metrics arrays, and image references. Store 1600 × 900 JPG + WebP pairs in `/assets/img/projects/`.
2. **UI copy** — edit `content/site_en.json` and `content/site_fr.json` in tandem. Keep keys identical; the page generator expects matching structure.
3. Run `node tools/generate-pages.js` to rebuild every HTML page.
4. Regenerate the sitemap (updates timestamps + hreflang) with `node scripts/generate-sitemap.mjs` after adding or removing public pages.
5. Keep `/assets/cv/Mohamed_Ali_Mabrouki_CV.docx` aligned with `cv.html` / `fr/cv.html`.

### Imagery guidelines

- Hero & about portrait: `/assets/img/avatar.jpg` (800 px square) + `/assets/img/avatar-circle.png` (transparent circle variant).
- Project covers: `/assets/img/projects/{slug}.jpg` + `.webp` (1600 × 900). Names must match the `cover` field in `projects.json`.
- Social preview: `/assets/img/og-banner.jpg` (1200 × 630). Update whenever brand palette or photography changes.

## UI behaviour

- **Language switcher** persists preference in `localStorage`, auto-detects browser language on first visit, and keeps the user on the equivalent route.
- **Motion system** (parallax, tilt, reveals) respects `prefers-reduced-motion`; touch devices fall back to subtle scale/shadow interactions.
- **Projects filters** operate client-side for capability, role, and year.
- **Contact form** opens a `mailto:` draft with prefilled body fields—no data is stored server-side.

## Quality checklist

| Audit | Command / Tool | Target |
| --- | --- | --- |
| Lighthouse (desktop) | `npm run lighthouse` | ≥95 Performance · 100 SEO/Best Practices/Accessibility |
| Accessibility | Axe DevTools / Lighthouse A11y | 0 serious issues |
| HTML validation | https://validator.w3.org/nu/ | No errors |

## Deployment notes

- All output is static-friendly—deploy via Netlify, Vercel, GitHub Pages, or any CDN.
- Rerun `generate-pages` and `generate-sitemap` before publishing content edits.
- `robots.txt` already references the sitemap and allows all crawlers; update only if crawl strategy changes.
