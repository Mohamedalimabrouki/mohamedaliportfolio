# Repository Guidelines

## Project Structure & Module Organization
Generated pages (`index.html`, `fr/**`, `projects/**`) are checked in, but the source of truth lives in `content/` (site copy, projects, i18n) and `assets/` (CSS, JS, imagery, downloadable CV). Regenerate HTML via `tools/generate-pages.js` after any content change; do not hand-edit the outputs. Supporting utilities sit in `tools/` and `scripts/`, while Playwright specs live in `tests/` with their run artifacts landing under `test-results/`. Keep new assets in the existing folder conventions (`assets/img/projects`, `assets/optimized`) so the image pipeline can find them.

## Build, Test, and Development Commands
Run `npm install` (Node 18.20+) to pull Playwright, Lighthouse, and Sharp. `node tools/generate-pages.js` rebuilds every HTML surface from the JSON layer. `npm run build:images` will create responsive variants inside `assets/optimized`. Update crawl metadata with `npm run build:sitemap`. Execute the UI smoke suite with `npm test` (alias for `npm run test:ui`); use `npx playwright test tests/smoke.spec.js --headed` when diagnosing a failure. `npm run lighthouse` performs the CI-grade performance audit; expect ≥95 desktop performance scores before shipping.

## Coding Style & Naming Conventions
JavaScript follows modern ES modules with 2-space indentation, `const`/`let` scoped declarations, and late returns for guard clauses. Keep utilities self-contained (see `assets/js/ui.js` IIFE) and export shared helpers explicitly. CSS uses component-prefixed classes and BEM-inspired double-underscore modifiers (`.site-nav__link`); keep new selectors lowercase kebab-case. Store assets with hyphenated lowercase filenames, and mirror existing JSON key casing so generators stay deterministic.

## Testing Guidelines
The Playwright suite (`@playwright/test`) captures regressions across language variants. Add new specs as `*.spec.js` under `tests/`, grouping scenarios with descriptive `test.describe` blocks. When adding UI features, cover at least one headless run plus a viewport that exercises motion preferences. Record any new artifacts or screenshots under `test-results/` so the team can review flaky behaviour. Re-run `npm test` after content changes that affect routing or navigation data.

## Commit & Pull Request Guidelines
Follow the concise, imperative commit style already in the history (`Add French locale scaffolding`, `Improve hero parallax`). Squash minor fix-ups locally before opening a PR. Each PR should include: a short motivation, a checklist of regenerated assets (`generate-pages`, `build:images`, `build:sitemap`), relevant screenshots for visual tweaks, and links to tracking issues or briefs. Request review only after Playwright and Lighthouse runs are green and attach the key metrics in the PR body.

## Content & Localization Workflow
Maintain parity between `content/site_en.json` and `content/site_fr.json`; keys must stay identical for the page generator. Add project imagery as matching JPG/WebP pairs in `assets/img/projects/` and rerun the image pipeline. Update `content/projects.json` for metadata changes, then regenerate HTML and the sitemap so hreflang references stay fresh. When delivering bilingual copy changes, provide reviewers with the English and French strings side by side to simplify verification.
