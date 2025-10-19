# Mohamed Ali Mabrouki — Portfolio

A lightweight, static portfolio for Mohamed Ali Mabrouki showcasing Euro 7 braking, WVTA dossier leadership, and wheel-end industrialisation programmes.

## Getting started

1. Clone the repository and open it in VS Code.
2. Run the site with the built-in **Live Server** extension (right-click `index.html` → *Open with Live Server*). Any static file server works; no build step is required.

## Project structure

```
assets/
  css/          # base typography, layout, components, theme tokens, cv layout
  img/          # avatar, favicons, social banner, responsive imagery
  js/           # site enhancements (theme toggle, scroll spy, contact form)
  cv/           # downloadable DOCX resume
cv.html         # printer-friendly CV
index.html      # main landing page
project.html    # detailed K9 WVTA recovery case study
robots.txt      # crawl directives
sitemap.xml     # search discoverability
site.webmanifest# PWA metadata for icons & colours
```

### Updating imagery

* Hero portrait and about section use `/assets/img/avatar.jpg`. For new photos, export 400 px and 800 px squares and update the `srcset`.
* Project tiles sit in `/assets/optimized`. Add 320/640/960/1280/1600 px JPEGs to keep responsive loading efficient.
* The open-graph banner lives at `/assets/img/og-banner.jpg` (1200×630). Regenerate it if the brand colours or headshot change.

### Editing content

* Skills, projects, and experience copy reside directly in `index.html` for easy updates.
* Update CV content both in `cv.html` and the downloadable `/assets/cv/Mohamed_Ali_Mabrouki_CV.docx` to keep them in sync.
* Adjust the sitemap whenever you add or remove public pages.

## Quality checklist

Run these quick checks before shipping:

| Check | Command / Tool | Target |
| --- | --- | --- |
| Lighthouse | Chrome DevTools → Lighthouse (desktop) | ≥95 Performance, 100 SEO, Best Practices, Accessibility |
| Axe DevTools | Browser extension | 0 serious violations |
| W3C HTML | https://validator.w3.org/nu/ | No errors |

## Notes

* Theme toggle persists via `localStorage` and honours `prefers-color-scheme` by default.
* Contact form opens a `mailto:` draft and surfaces direct links for phone/email/LinkedIn.
* Styles respect `prefers-reduced-motion` to minimise animation for sensitive users.
