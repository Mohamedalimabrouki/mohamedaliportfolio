#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content');

const languages = {
  en: JSON.parse(readFileSync(path.join(contentDir, 'site_en.json'), 'utf8')),
  fr: JSON.parse(readFileSync(path.join(contentDir, 'site_fr.json'), 'utf8'))
};

const projects = JSON.parse(readFileSync(path.join(contentDir, 'projects.json'), 'utf8'));
const projectIndex = new Map(projects.map((p) => [p.id, p]));

const languageMap = {
  home: { en: '/index.html', fr: '/fr/index.html' },
  projects: { en: '/projects/index.html', fr: '/fr/projets/index.html' },
  cv: { en: '/cv.html', fr: '/fr/cv.html' }
};

for (const project of projects) {
  languageMap[`project:${project.id}`] = {
    en: `/projects/${project.id}.html`,
    fr: `/fr/projets/${project.id}.html`
  };
}

const criticalCss = `:root{--header-height:4rem;--max-width:1120px;--radius-base:16px;--radius-pill:999px;--shadow-soft:0 25px 80px rgba(8,15,35,.22);--shadow-card:0 16px 40px rgba(15,23,42,.16);--transition-base:0.35s cubic-bezier(.25,.8,.25,1);--surface-900:#0b1220;--surface-800:#101a2c;--surface-700:#1c273a;--surface-600:#273246;--surface-500:#2f3b53;--surface-100:#f3f6fc;--accent-400:#5ca5ff;--accent-500:#3d8aff;--accent-600:#2b6fcc;--text-primary:#f5f8ff;--text-muted:rgba(245,248,255,.78);--text-inverse:#0b1220;--focus-ring:#8bc4ff;--border-soft:rgba(255,255,255,.08);--gradient-hero:radial-gradient(circle at 20% 20%,rgba(92,165,255,.32),transparent 60%),radial-gradient(circle at 80% 0,rgba(255,120,80,.28),transparent 55%),linear-gradient(140deg,#0b1220 35%,#111c2f 100%);}*{box-sizing:border-box;}html{font-size:100%;scroll-behavior:smooth;background:var(--surface-900);}body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Apple Color Emoji","Segoe UI Emoji";color:var(--text-primary);background:var(--surface-900);min-height:100vh;}img{display:block;max-width:100%;height:auto;}a{color:var(--accent-400);text-decoration:none;}a:hover,a:focus-visible{color:var(--accent-500);}button{font-family:inherit;}main{display:block;}section{padding-block:6rem;}@media (max-width: 768px){section{padding-block:4.5rem;}}.container{width:90%;max-width:var(--max-width);margin:0 auto;}::selection{background:rgba(92,165,255,.3);}body[data-reduced-motion="true"] *{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}
`;

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function writeOutput(relPath, content) {
  const dest = path.join(root, relPath.replace(/^\//, ''));
  ensureDir(dest);
  writeFileSync(dest, content, 'utf8');
}

function fullUrl(base, relPath) {
  const withSlash = relPath.startsWith('/') ? relPath : `/${relPath}`;
  return new URL(withSlash, base).href;
}

function getNavLinks(lang, pageKey) {
  const data = languages[lang];
  const isHome = pageKey === 'home';
  const homeHref = lang === 'fr' ? '/fr/index.html' : '/index.html';
  return data.navigation
    .map((item) => {
      const href = isHome ? `#${item.id}` : `${homeHref}#${item.id}`;
      return `<li><a class="site-nav__link" data-nav-target="${item.id}" href="${href}">${item.label}</a></li>`;
    })
    .join('');
}

function buildLanguageButtons(currentLang) {
  return ['en', 'fr']
    .map((lang) => {
      const isActive = lang === currentLang;
      return `<button type="button" class="lang-switcher__btn${isActive ? ' is-active' : ''}" data-lang-switch="${lang}" aria-pressed="${isActive}">${lang.toUpperCase()}</button>`;
    })
    .join('');
}

function pictureMarkup(basePath, alt, width, height, sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw', loading = 'lazy') {
  const ext = path.extname(basePath);
  const webpPath = basePath.replace(ext, '.webp');
  const hasWebp = existsSync(path.join(root, webpPath.replace(/^\//, '')));
  const jpgPath = basePath.startsWith('/') ? basePath : `/${basePath}`;
  const webpSrc = hasWebp ? `<source srcset="${webpPath.startsWith('/') ? webpPath : '/' + webpPath}" type="image/webp">` : '';
  return `<picture>
    ${webpSrc}
    <source srcset="${jpgPath}" type="image/jpeg">
    <img src="${jpgPath}" alt="${alt}" width="${width}" height="${height}" loading="${loading}" decoding="async">
  </picture>`;
}

function heroPortrait(lang) {
  const alt = lang === 'fr' ? 'Portrait de Mohamed Ali Mabrouki' : 'Portrait of Mohamed Ali Mabrouki';
  return `<picture>
    <source srcset="/assets/img/avatar.jpg" type="image/jpeg">
    <img src="/assets/img/avatar.jpg" alt="${alt}" width="800" height="800" loading="eager" fetchpriority="high" decoding="async">
  </picture>`;
}

function renderHero(lang) {
  const data = languages[lang].hero;
  const stats = data.highlights
    .map((item) => {
      const value = item.href ? `<a href="${item.href}">${item.value}</a>` : item.value;
      return `<div class="hero__meta" data-reveal><dt>${item.label}</dt><dd>${value}</dd></div>`;
    })
    .join('');
  const bullets = data.bullets.map((line) => `<li>${line}</li>`).join('');
  const ctas = data.ctas
    .map((cta) => `<a class="btn btn--${cta.variant} hero__cta" href="${cta.href}">${cta.label}</a>`)
    .join('');
  return `<section id="hero" class="hero" data-section="hero">
    <div class="hero__background" aria-hidden="true">
      <div class="hero__gradient"></div>
      <div class="hero__texture"></div>
    </div>
    <div class="container hero__grid" data-parallax-root>
      <div class="hero__copy" data-parallax-layer="0.15">
        <p class="eyebrow" data-reveal>${data.eyebrow}</p>
        <h1 class="hero__headline" data-reveal>${data.headline}</h1>
        <p class="hero__lead" data-reveal>${data.lead}</p>
        <div class="hero__actions" data-reveal>${ctas}</div>
        <ul class="hero__bullet-list" data-reveal>${bullets}</ul>
        <dl class="hero__meta-grid" data-reveal>${stats}</dl>
      </div>
      <div class="hero__portrait" data-parallax-layer="0.3" data-reveal>
        ${heroPortrait(lang)}
      </div>
    </div>
  </section>`;
}

function renderSkills(lang) {
  const data = languages[lang].skills;
  const cards = data.categories
    .map((cat) => {
      const items = cat.items.map((item) => `<li>${item}</li>`).join('');
      return `<article class="skill-card tilt-card" data-reveal>
        <h3>${cat.title}</h3>
        <p>${cat.description}</p>
        <ul class="pill-list">${items}</ul>
      </article>`;
    })
    .join('');
  return `<section id="skills" class="section section--muted" data-section="skills">
    <div class="container">
      <div class="section__intro" data-reveal>
        <h2>${data.title}</h2>
        <p>${data.intro}</p>
      </div>
      <div class="skills-grid">${cards}</div>
    </div>
  </section>`;
}

function deriveYear(period) {
  const match = period.match(/\d{4}/g);
  if (!match || match.length === 0) return 'n/a';
  return match[match.length - 1];
}

const normalizeToken = (value) =>
  value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function projectCard(project, lang, { compact = false } = {}) {
  const summary = lang === 'fr' ? project.summary_fr : project.summary_en;
  const highlights = lang === 'fr' ? project.highlights_fr : project.highlights_en;
  const alt = lang === 'fr' ? project.cover_alt_fr : project.cover_alt_en;
  const coverPath = project.cover.startsWith('/') ? project.cover : `/${project.cover}`;
  const period = project.period;
  const roleSplit = project.role.split('·').map((part) => part.trim());
  const role = lang === 'fr' && roleSplit[1] ? roleSplit[1] : roleSplit[0];
  const href = lang === 'fr' ? `/fr/projets/${project.id}.html` : `/projects/${project.id}.html`;
  const sizes = compact ? '(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw' : '(max-width: 720px) 100vw, 680px';
  const picture = pictureMarkup(coverPath, alt, 1600, 900, sizes);
  const highlightMarkup = highlights
    .slice(0, compact ? 2 : highlights.length)
    .map((line) => `<li>${line}</li>`)
    .join('');
  const stackLabels = project.stack.map((tag) => `<span class="badge">${tag}</span>`).join('');
  const stackTokens = project.stack.map((tag) => normalizeToken(tag));
  const roleToken = normalizeToken(role);
  const year = deriveYear(project.period);
  return `<article class="project-card tilt-card" data-reveal data-stack="${stackTokens.join(',')}" data-role="${roleToken}" data-year="${year}">
    <a class="project-card__link" href="${href}">
      <div class="project-card__media">${picture}</div>
      <div class="project-card__body">
        <div class="project-card__header">
          <h3>${lang === 'fr' ? project.title_fr : project.title_en}</h3>
          <p class="project-card__summary">${summary}</p>
        </div>
        <ul class="project-card__highlights">${highlightMarkup}</ul>
        <div class="project-card__meta">
          <span class="project-card__period">${period}</span>
          <span class="project-card__role">${role}</span>
        </div>
        <div class="project-card__tags">${stackLabels}</div>
      </div>
    </a>
  </article>`;
}

function renderProjectsHome(lang) {
  const data = languages[lang].projects_section;
  const featuredCards = data.featured_ids
    .map((id) => {
      const project = projectIndex.get(id);
      if (!project) return '';
      return projectCard(project, lang, { compact: true });
    })
    .join('');
  return `<section id="projects" class="section" data-section="projects">
    <div class="container">
      <div class="section__intro" data-reveal>
        <h2>${data.title}</h2>
        <p>${data.intro}</p>
      </div>
      <div class="projects-grid">${featuredCards}</div>
      <div class="section__actions" data-reveal>
        <a class="btn btn--ghost" href="${data.view_all_href}">${data.view_all_label}</a>
      </div>
    </div>
  </section>`;
}

function renderExperience(lang) {
  const data = languages[lang].experience;
  const items = data.items
    .map((item) => {
      const details = item.details.map((line) => `<li>${line}</li>`).join('');
      return `<article class="timeline__item" data-reveal>
        <div class="timeline__meta">
          <span class="timeline__period">${item.period}</span>
          <span class="timeline__location">${item.location}</span>
        </div>
        <div class="timeline__body">
          <h3>${item.role} · ${item.company}</h3>
          <ul>${details}</ul>
        </div>
      </article>`;
    })
    .join('');
  return `<section id="experience" class="section section--muted" data-section="experience">
    <div class="container">
      <div class="section__intro" data-reveal>
        <h2>${data.title}</h2>
        <p>${data.intro}</p>
      </div>
      <div class="timeline">${items}</div>
    </div>
  </section>`;
}

function renderAbout(lang) {
  const data = languages[lang].about;
  const stats = data.stats.map((stat) => `<li><span class="stat__value">${stat.value}</span><span class="stat__label">${stat.label}</span></li>`).join('');
  const portraitAlt = lang === 'fr' ? 'Portrait de Mohamed Ali Mabrouki' : 'Portrait of Mohamed Ali Mabrouki';
  return `<section id="about" class="section" data-section="about">
    <div class="container about__grid">
      <div class="about__copy" data-reveal>
        <h2>${data.title}</h2>
        <p class="about__tagline">${data.tagline}</p>
        <p>${data.body}</p>
        <ul class="stat-list">${stats}</ul>
      </div>
      <div class="about__media" data-reveal>
        <picture>
          <source srcset="/assets/img/avatar-circle.png" type="image/png">
          <img src="/assets/img/avatar-circle.png" alt="${portraitAlt}" width="600" height="600" loading="lazy" decoding="async">
        </picture>
      </div>
    </div>
  </section>`;
}

function renderDownloads(lang) {
  const data = languages[lang].cv_downloads;
  const buttons = data.buttons
    .map((btn) => {
      const attrs = btn.download ? ' download' : '';
      return `<a class="btn btn--primary" href="${btn.href}"${attrs}>${btn.label}</a>`;
    })
    .join('');
  return `<section id="downloads" class="section section--muted" data-section="downloads">
    <div class="container downloads">
      <div class="section__intro" data-reveal>
        <h2>${data.title}</h2>
        <p>${data.intro}</p>
      </div>
      <div class="downloads__actions" data-reveal>${buttons}</div>
    </div>
  </section>`;
}

function renderContact(lang) {
  const data = languages[lang].contact;
  const channels = data.channels
    .map((channel) => `<li><span class="channel__label">${channel.label}</span><a href="${channel.href}">${channel.value}</a></li>`)
    .join('');
  const fields = data.form.fields
    .map((field) => {
      if (field.type === 'textarea') {
        return `<label class="form-field"><span>${field.label}</span><textarea name="${field.id}" id="contact-${field.id}" placeholder="${field.placeholder}"></textarea></label>`;
      }
      return `<label class="form-field"><span>${field.label}</span><input type="${field.type}" name="${field.id}" id="contact-${field.id}" placeholder="${field.placeholder}"></label>`;
    })
    .join('');
  return `<section id="contact" class="section" data-section="contact">
    <div class="container contact">
      <div class="contact__intro" data-reveal>
        <h2>${data.title}</h2>
        <p>${data.intro}</p>
        <ul class="contact__channels">${channels}</ul>
      </div>
      <div class="contact__form" data-reveal>
        <h3>${data.form.title}</h3>
        <p>${data.form.description}</p>
        <form id="contact-form" data-mailto="${data.form.mailto}">
          ${fields}
          <p class="form-privacy">${data.form.privacy}</p>
          <button type="submit" class="btn btn--primary">${data.form.cta_label}</button>
        </form>
      </div>
    </div>
  </section>`;
}

function renderHomePage(lang) {
  const data = languages[lang];
  const seo = lang === 'fr' ? data.seo.home : languages.en.seo.home;
  const altSeo = lang === 'fr' ? languages.en.seo.home : data.seo.home;
  const canonical = lang === 'fr' ? data.seo.home.path : data.seo.home.path;
  const alternate = lang === 'fr' ? altSeo.path : data.seo.home_fr.path;
  const content = `
<main id="main">
  ${renderHero(lang)}
  ${renderSkills(lang)}
  ${renderProjectsHome(lang)}
  ${renderExperience(lang)}
  ${renderAbout(lang)}
  ${renderDownloads(lang)}
  ${renderContact(lang)}
</main>`;
  const structured = lang === 'fr' ? languages.fr.structured_data : languages.en.structured_data;
  return layout({
    lang,
    pageKey: 'home',
    title: data.seo.home.title,
    description: data.seo.home.description,
    canonicalPath: data.seo.home.path,
    alternatePath: lang === 'fr' ? languages.en.seo.home.path : languages.fr.seo.home.path,
    content,
    structuredData: JSON.stringify(structured.person, null, 2),
    includeWebsiteSchema: true
  });
}

function layout({ lang, pageKey, title, description, canonicalPath, alternatePath, content, structuredData = '', includeWebsiteSchema = false, extraHead = '' }) {
  const data = languages[lang];
  const site = data.site;
  const locale = lang === 'fr' ? 'fr_FR' : 'en_GB';
  const canonicalUrl = fullUrl(site.url, canonicalPath);
  const alternateUrl = fullUrl(site.url, alternatePath);
  const ogImage = fullUrl(site.url, data.seo.home.og_image);
  const navLinks = getNavLinks(lang, pageKey);
  const langButtons = buildLanguageButtons(lang);
  const mapJson = JSON.stringify(languageMap);
  const yearSpan = '${new Date().getFullYear()}';
  const websiteSchema = includeWebsiteSchema ? `<script type="application/ld+json">${JSON.stringify(data.structured_data.website, null, 2)}</script>` : '';
  const personSchema = structuredData ? `<script type="application/ld+json">${structuredData}</script>` : '';
  return `<!doctype html>
<html lang="${lang}" data-page="${pageKey}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="en" href="${lang === 'en' ? canonicalUrl : alternateUrl}">
  <link rel="alternate" hreflang="fr" href="${lang === 'fr' ? canonicalUrl : alternateUrl}">
  <link rel="alternate" hreflang="x-default" href="${fullUrl(site.url, languages.en.seo.home.path)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:locale" content="${locale}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
  <meta name="theme-color" content="#0b1220">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-512.png">
  <link rel="icon" type="image/x-icon" href="/assets/img/favicon.ico">
  <link rel="apple-touch-icon" href="/assets/img/favicon-512.png">
  <style>${criticalCss}</style>
  <link rel="preload" href="/assets/css/base.css" as="style">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="preload" href="/assets/css/themes.css" as="style">
  <link rel="stylesheet" href="/assets/css/themes.css">
  <link rel="preload" href="/assets/css/layout.css" as="style">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="preload" href="/assets/css/components.css" as="style">
  <link rel="stylesheet" href="/assets/css/components.css">
  ${extraHead}
  ${websiteSchema}
  ${personSchema}
  <script id="language-map" type="application/json">${mapJson}</script>
  <script defer src="/assets/js/i18n.js"></script>
  <script defer src="/assets/js/ui.js"></script>
</head>
<body data-lang="${lang}">
  <a class="skip-link" href="#main">${data.shared.skip_to_content}</a>
  <header class="site-header" data-reveal>
    <div class="container site-header__inner">
      <a class="brand" href="${lang === 'fr' ? '/fr/index.html#hero' : '/#hero'}">
        <span class="brand__mark" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 44 44" role="img" aria-hidden="true"><rect x="2" y="2" width="40" height="40" rx="12" fill="url(#grad)"/><path d="M12 30V14h4l6 7 6-7h4v16h-4V21l-6 7-6-7v9h-4Z" fill="#fff"/><defs><linearGradient id="grad" x1="6" y1="6" x2="38" y2="38" gradientUnits="userSpaceOnUse"><stop stop-color="#3d8aff"/><stop offset="1" stop-color="#5ca5ff"/></linearGradient></defs></svg>
        </span>
        <span class="brand__text">
          <span class="brand__name">${site.name}</span>
          <span class="brand__tagline">${site.tagline}</span>
        </span>
      </a>
      <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="primary-navigation">
        <span class="sr-only">Menu</span>
        <span class="nav-toggle__bar"></span>
      </button>
      <nav class="site-nav" id="primary-navigation" data-site-nav aria-label="Primary">
        <ul class="site-nav__list">${navLinks}</ul>
        <div class="lang-switcher" role="group" aria-label="${data.language_switcher.label}">${langButtons}</div>
      </nav>
    </div>
  </header>
  ${content}
  <footer class="site-footer">
    <div class="container site-footer__inner">
      <p>© <span data-current-year></span> ${site.name}. ${site.tagline}.</p>
      <a class="btn btn--ghost" href="${lang === 'fr' ? '/fr/index.html#hero' : '/#hero'}">${data.shared.back_to_top}</a>
    </div>
  </footer>
</body>
</html>`;
}

function renderProjectsPage(lang) {
  const data = languages[lang].projects_page;
  const cards = projects.map((project) => projectCard(project, lang, { compact: false })).join('');
  const filters = data.filters;
  const groupLabels = data.filter_group_labels;
  const filterControls = `
    <div class="filters" data-reveal>
      <label>${groupLabels.stack}
        <select data-filter="stack">
          ${buildFilterOptions(filters, 'all')}
        </select>
      </label>
      <label>${groupLabels.role}
        <select data-filter="role">
          ${buildRoleOptions(lang, filters.all)}
        </select>
      </label>
      <label>${groupLabels.year}
        <select data-filter="year">
          ${buildYearOptions(filters.all)}
        </select>
      </label>
    </div>`;
  const content = `
  <main id="main">
    <section class="section projects-index">
      <div class="container">
        <div class="section__intro" data-reveal>
          <h1>${data.title}</h1>
          <p>${data.intro}</p>
        </div>
        ${filterControls}
        <p class="projects-status" data-reveal data-status data-status-loading="${data.status_messages.loading}" data-status-empty="${data.status_messages.empty}" data-status-all="${data.status_messages.count}" data-status-filtered="${data.status_messages.filtered}">${data.status_messages.loading}</p>
        <div class="projects-grid" data-project-list>${cards}</div>
        <div class="section__actions" data-reveal>
          <a class="btn btn--ghost" href="${lang === 'fr' ? '/fr/index.html' : '/index.html'}">${data.view_home_label}</a>
        </div>
      </div>
    </section>
  </main>`;
  const seo = lang === 'fr' ? languages.fr.seo.projects_index : languages.en.seo.projects_index;
  return layout({
    lang,
    pageKey: 'projects',
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.path,
    alternatePath: lang === 'fr' ? languages.en.seo.projects_index.path : languages.fr.seo.projects_index.path,
    content
  });
}

function buildFilterOptions(filters, defaultKey) {
  return Object.entries(filters)
    .map(([key, label]) => `<option value="${key}"${key === defaultKey ? ' selected' : ''}>${label}</option>`)
    .join('');
}

function buildYearOptions(defaultLabel = 'All') {
  const years = new Set();
  projects.forEach((project) => {
    const match = project.period.match(/\d{4}/g);
    if (match) {
      match.forEach((year) => years.add(year));
    }
  });
  const sorted = Array.from(years).sort((a, b) => Number(b) - Number(a));
  return [`<option value="all" selected>${defaultLabel}</option>`, ...sorted.map((year) => `<option value="${year}">${year}</option>`)].join('');
}

function buildRoleOptions(lang, defaultLabel = 'All') {
  const roles = new Set();
  projects.forEach((project) => {
    const roleSplit = project.role.split('·').map((part) => part.trim());
    const roleValue = lang === 'fr' && roleSplit[1] ? roleSplit[1] : roleSplit[0];
    roles.add(roleValue);
  });
  const sorted = Array.from(roles).sort((a, b) => a.localeCompare(b));
  return [
    `<option value="all" selected>${defaultLabel}</option>`,
    ...sorted.map((role) => {
      const token = normalizeToken(role);
      return `<option value="${token}">${role}</option>`;
    })
  ].join('');
}

function renderProjectDetail(lang, project) {
  const data = languages[lang].project_detail;
  const seo = lang === 'fr' ? languages.fr.seo.project_detail : languages.en.seo.project_detail;
  const title = lang === 'fr' ? project.title_fr : project.title_en;
  const summary = lang === 'fr' ? project.summary_fr : project.summary_en;
  const highlights = lang === 'fr' ? project.highlights_fr : project.highlights_en;
  const metrics = lang === 'fr' ? project.metrics_fr : project.metrics_en;
  const roleSplit = project.role.split('·').map((part) => part.trim());
  const role = lang === 'fr' && roleSplit[1] ? roleSplit[1] : roleSplit[0];
  const stackList = project.stack.map((tag) => `<span class="badge">${tag}</span>`).join('');
  const coverAlt = lang === 'fr' ? project.cover_alt_fr : project.cover_alt_en;
  const picture = pictureMarkup(project.cover.startsWith('/') ? project.cover : `/${project.cover}`, coverAlt, 1600, 900, '(max-width: 768px) 100vw, 960px', 'eager');
  const highlightsMarkup = highlights.map((line) => `<li>${line}</li>`).join('');
  const metricsMarkup = metrics.map((line) => `<li>${line}</li>`).join('');
  const gallery = project.gallery
    .map((img) => {
      const alt = coverAlt;
      return `<figure class="gallery__item">${pictureMarkup(img.startsWith('/') ? img : `/${img}`, alt, 1600, 900)}</figure>`;
    })
    .join('');
  const intro = `
    <header class="project-hero" data-reveal>
      <div class="project-hero__copy">
        <p class="eyebrow">${data.overview_label}</p>
        <h1>${title}</h1>
        <p>${summary}</p>
        <div class="project-hero__meta">
          <dl>
            <div><dt>${data.period_label}</dt><dd>${project.period}</dd></div>
            <div><dt>${data.role_label}</dt><dd>${role}</dd></div>
            <div><dt>${data.client_label}</dt><dd>${project.client_or_brand}</dd></div>
            <div><dt>${data.stack_label}</dt><dd>${stackList}</dd></div>
          </dl>
          <div class="project-hero__actions">
            <a class="btn btn--primary" href="mailto:hello@mohamedalimabrouki.com">${data.cta_contact}</a>
            <a class="btn btn--ghost" href="${lang === 'fr' ? '/fr/projets/index.html' : '/projects/index.html'}">${data.cta_projects}</a>
          </div>
        </div>
      </div>
      <div class="project-hero__media">${picture}</div>
    </header>`;
  const content = `
  <main id="main">
    <section class="section project-detail">
      <div class="container">
        ${intro}
        <div class="project-detail__grid">
          <article class="card" data-reveal>
            <h2>${data.highlights_label}</h2>
            <ul>${highlightsMarkup}</ul>
          </article>
          <article class="card" data-reveal>
            <h2>${data.metrics_label}</h2>
            <ul>${metricsMarkup}</ul>
          </article>
        </div>
        <div class="gallery" data-reveal>${gallery}</div>
      </div>
    </section>
  </main>`;
  return layout({
    lang,
    pageKey: `project:${project.id}`,
    title: seo.title_template.replace('{projectTitle}', title),
    description: seo.description_template.replace('{projectSummary}', summary),
    canonicalPath: lang === 'fr' ? `/fr/projets/${project.id}.html` : `/projects/${project.id}.html`,
    alternatePath: lang === 'fr' ? `/projects/${project.id}.html` : `/fr/projets/${project.id}.html`,
    content
  });
}

function renderCvPage(lang) {
  const data = languages[lang].cv_page;
  const siteData = languages[lang].site;
  const seo = lang === 'fr' ? languages.fr.seo.cv : languages.en.seo.cv;
  const competencies = data.competencies.map((item) => `<li><strong>${item.title}</strong><span>${item.body}</span></li>`).join('');
  const experience = data.experience
    .map((item) => {
      const bullets = item.items.map((line) => `<li>${line}</li>`).join('');
      return `<article class="cv-role">
        <h3>${item.title}</h3>
        <span class="cv-role__period">${item.period}</span>
        <ul>${bullets}</ul>
      </article>`;
    })
    .join('');
  const education = data.education.map((item) => `<li><strong>${item.title}</strong><span>${item.subtitle}</span></li>`).join('');
  const certifications = data.certifications.map((item) => `<li>${item}</li>`).join('');
  const languagesList = data.languages.map((item) => `<li><strong>${item.title}</strong><span>${item.level}</span></li>`).join('');
  const tools = data.tools.map((item) => `<li>${item}</li>`).join('');
  const content = `
  <main id="main" class="cv">
    <article class="cv-sheet">
      <header class="cv-header">
        <div class="cv-mark" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-hidden="true"><rect x="6" y="6" width="52" height="52" rx="16" fill="url(#gradCV)"/><path d="M18 42V22h6l8 9 8-9h6v20h-6V30l-8 9-8-9v12h-6Z" fill="#fff"/><defs><linearGradient id="gradCV" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse"><stop stop-color="#3d8aff"/><stop offset="1" stop-color="#5ca5ff"/></linearGradient></defs></svg>
        </div>
        <div class="cv-heading">
          <h1>${siteData.name}</h1>
          <p>${siteData.tagline}</p>
        </div>
        <div class="cv-contact">
          <span>${siteData.location}</span>
          <a href="${siteData.telephone_href}">${siteData.telephone_display}</a>
          <a href="mailto:${siteData.email}">${siteData.email}</a>
          <a href="${siteData.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
        </div>
        <a class="btn btn--ghost" href="/assets/cv/Mohamed_Ali_Mabrouki_CV.docx" download>${data.download_button}</a>
      </header>
      <section>
        <h2>${data.sections.summary}</h2>
        <p>${data.summary}</p>
      </section>
      <section>
        <h2>${data.sections.competencies}</h2>
        <ul class="cv-grid">${competencies}</ul>
      </section>
      <section>
        <h2>${data.sections.experience}</h2>
        <div class="cv-timeline">${experience}</div>
      </section>
      <section class="cv-columns">
        <div>
          <h2>${data.sections.education}</h2>
          <ul>${education}</ul>
          <h2>${data.sections.certifications}</h2>
          <ul>${certifications}</ul>
        </div>
        <div>
          <h2>${data.sections.languages}</h2>
          <ul>${languagesList}</ul>
          <h2>${data.sections.tools}</h2>
          <ul>${tools}</ul>
        </div>
      </section>
    </article>
  </main>`;
  return layout({
    lang,
    pageKey: 'cv',
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.path,
    alternatePath: lang === 'fr' ? languages.en.seo.cv.path : languages.fr.seo.cv.path,
    content,
    extraHead: '<link rel="stylesheet" href="/assets/css/cv.css">'
  });
}

function buildAll() {
  writeOutput('/index.html', renderHomePage('en'));
  writeOutput('/fr/index.html', renderHomePage('fr'));
  writeOutput('/projects/index.html', renderProjectsPage('en'));
  writeOutput('/fr/projets/index.html', renderProjectsPage('fr'));
  for (const project of projects) {
    writeOutput(`/projects/${project.id}.html`, renderProjectDetail('en', project));
    writeOutput(`/fr/projets/${project.id}.html`, renderProjectDetail('fr', project));
  }
  writeOutput('/cv.html', renderCvPage('en'));
  writeOutput('/fr/cv.html', renderCvPage('fr'));
}

buildAll();
