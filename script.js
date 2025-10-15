const DEFAULT_CARD_SIZES = '(min-width: 900px) 33vw, 100vw';
const DEFAULT_GALLERY_SIZES = '(min-width: 960px) 600px, (min-width: 720px) 48vw, 92vw';
const DEFAULT_FOCUS = '50% 50%';

const queryParams = new URLSearchParams(window.location.search);
const storedLang = localStorage.getItem('lang');
const queryLang = queryParams.get('lang');
const normalizedLang = queryLang && ['en', 'fr'].includes(queryLang) ? queryLang : null;
const initialLang = normalizedLang || storedLang || 'en';
if (normalizedLang && normalizedLang !== storedLang) {
  localStorage.setItem('lang', normalizedLang);
}

const state = {
  projects: [],
  activeTag: 'all',
  lang: initialLang,
  i18n: { ui: {} },
  revealObserver: null,
  devMode: queryParams.get('dev') === '1'
};

const translationsCache = {};
const focusDrafts = new Map();

function dntEnabled() {
  return (
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    navigator.msDoNotTrack === '1'
  );
}

function trackEvent(name, props = {}) {
  if (dntEnabled()) return;
  if (typeof window.plausible === 'function') {
    window.plausible(name, { props });
  }
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function loadJSON(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('Failed to load', url, err);
    return null;
  }
}

function optimizedBasePath(path) {
  if (!path) return '';
  const cleaned = String(path).replace(/^\.?\//, '');
  const withoutExt = cleaned.replace(/\.(avif|webp|jpe?g|png)$/i, '');
  const normalized = withoutExt.replace(/-(320|640|960|1280|1600)$/i, '');
  if (normalized.startsWith('assets/optimized/')) {
    return normalized;
  }
  const name = normalized.split('/').pop();
  return name ? `assets/optimized/${name}` : '';
}

function buildSrcset(base, ext) {
  if (!base) return '';
  const sizes = [320, 640, 960];
  return sizes.map(size => `${base}-${size}.${ext} ${size}w`).join(', ');
}

function imgBlock(path, alt = '', focus = DEFAULT_FOCUS, options = {}) {
  const opts = typeof options === 'object' && options !== null ? options : {};
  const focusValue = focus || DEFAULT_FOCUS;
  const slugAttr = opts.slug ? ` data-slug="${escapeAttr(opts.slug)}"` : '';
  const indexAttr =
    opts.index !== undefined ? ` data-index="${escapeAttr(String(opts.index))}"` : '';
  const dataFocusAttr = ` data-focus="${escapeAttr(focusValue)}"`;
  const styleAttr = ` style="--focus:${escapeAttr(focusValue)}"`;
  const optimizedBase = optimizedBasePath(path);
  const avifSet = buildSrcset(optimizedBase, 'avif');
  const webpSet = buildSrcset(optimizedBase, 'webp');
  const sizes = opts.sizes || (opts.context === 'gallery' ? DEFAULT_GALLERY_SIZES : DEFAULT_CARD_SIZES);
  const loading = opts.loading === 'eager' ? 'eager' : 'lazy';
  const decoding = opts.decoding || 'async';
  const fetchPriority = opts.fetchPriority
    ? ` fetchpriority="${escapeAttr(opts.fetchPriority)}"`
    : '';

  const sources = [];
  if (avifSet) {
    sources.push(`<source srcset="${escapeAttr(avifSet)}" type="image/avif">`);
  }
  if (webpSet) {
    sources.push(`<source srcset="${escapeAttr(webpSet)}" type="image/webp">`);
  } else {
    const fallbackWebp = path.replace(/\.(jpe?g|png)$/i, '.webp');
    if (fallbackWebp !== path) {
      sources.push(`<source srcset="${escapeAttr(fallbackWebp)}" type="image/webp">`);
    }
  }

  return `<picture class="focus-img"${slugAttr}${indexAttr}${dataFocusAttr}${styleAttr}>
    ${sources.join('\n    ')}
    <img src="${escapeAttr(path)}" alt="${escapeAttr(alt)}" loading="${loading}" decoding="${escapeAttr(
    decoding
  )}" sizes="${escapeAttr(sizes)}"${fetchPriority}>
  </picture>`;
}

function localizeValue(base, key) {
  if (state.lang === 'fr' && base[`${key}_fr`]) return base[`${key}_fr`];
  return base[key];
}

function localizeDetails(details, key) {
  if (!details) return undefined;
  if (state.lang === 'fr' && details[`${key}_fr`]) return details[`${key}_fr`];
  return details[key];
}

function cardHTML(project) {
  const title = localizeValue(project, 'title') || project.title;
  const summary =
    localizeDetails(project.details, 'overview') ||
    localizeValue(project, 'summary') ||
    project.summary ||
    '';
  const bullets =
    localizeValue(project, 'bullets') ||
    (Array.isArray(project.bullets) ? project.bullets : []);
  const focus = localizeDetails(project.details, 'focus') || project.focus || DEFAULT_FOCUS;
  const tags = project.tags || [];
  const bulletItems = (bullets || []).slice(0, 2).map(item => `<li>${escapeHTML(item)}</li>`).join('');

  return `<a class="card reveal" href="project.html?p=${encodeURIComponent(
    project.slug
  )}" data-project="${escapeAttr(project.slug)}" data-tags="${escapeAttr(tags.join(','))}">
    ${imgBlock(project.image, title, focus, { slug: project.slug })}
    <h4>${escapeHTML(title)}</h4>
    <p>${escapeHTML(summary)}</p>
    ${bulletItems ? `<ul>${bulletItems}</ul>` : ''}
  </a>`;
}

function renderProjects() {
  const grid = document.getElementById('project-grid');
  if (!grid) return;
  if (!state.projects.length) {
    console.warn('Using SSR fallback cards.');
    return;
  }
  grid.innerHTML = state.projects.map(cardHTML).join('');
  grid.removeAttribute('data-ssr');
  refreshImageEnhancements(grid);
  applyFilters(state.activeTag);
  updateFilterStatus(state.activeTag, getVisibleCount());
}

function initRevealObserver() {
  if (state.revealObserver) return;
  state.revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          state.revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );
}

function observeReveals(context = document) {
  initRevealObserver();
  context.querySelectorAll('.reveal').forEach(el => {
    if (el.dataset.revealBound) return;
    state.revealObserver.observe(el);
    el.dataset.revealBound = '1';
  });
}

function updateFocusHandlePosition(picture, focus) {
  const handle = picture.querySelector('.focus-handle');
  if (!handle) return;
  const [x = 50, y = 50] = (focus || '50% 50%')
    .split(' ')
    .map(part => parseFloat(part.replace('%', '')));
  handle.style.left = `${x}%`;
  handle.style.top = `${y}%`;
}

function recordFocusDraft(picture, focus) {
  const slug = picture.dataset.slug || picture.closest('[data-project]')?.dataset.project;
  const src = picture.dataset.src;
  if (!slug || !src) return;
  focusDrafts.set(`${slug}|${src}`, { slug, image: src, focus });
  updateFocusDraftList();
  console.info('Focus draft', { slug, image: src, focus });
}

function updateFocusDraftList() {
  const list = document.getElementById('focusDraftList');
  if (!list) return;
  if (!focusDrafts.size) {
    list.innerHTML = '<li>No adjustments captured yet.</li>';
    return;
  }
  list.innerHTML = Array.from(focusDrafts.values())
    .map(
      entry =>
        `<li><code>${escapeHTML(entry.slug)}</code> → <code>${escapeHTML(
          entry.image
        )}</code> = <strong>${escapeHTML(entry.focus)}</strong></li>`
    )
    .join('');
}

function copyFocusDrafts() {
  const data = Array.from(focusDrafts.values());
  const payload = JSON.stringify(data, null, 2);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(payload).then(
      () => {
        console.log('Focus drafts copied to clipboard');
      },
      err => {
        console.warn('Clipboard copy failed', err);
      }
    );
  }
  console.log('Focus drafts\n', payload);
}

function attachFocusHandle(picture) {
  if (!state.devMode) return;
  if (picture.dataset.focusBound) return;
  picture.dataset.focusBound = '1';
  picture.style.position = picture.style.position || 'relative';

  const handle = document.createElement('span');
  handle.className = 'focus-handle';
  handle.setAttribute('role', 'presentation');
  picture.appendChild(handle);
  updateFocusHandlePosition(picture, picture.dataset.focus);

  let dragging = false;

  const updateFromEvent = evt => {
    const rect = picture.getBoundingClientRect();
    const x = Math.min(Math.max(((evt.clientX - rect.left) / rect.width) * 100, 0), 100);
    const y = Math.min(Math.max(((evt.clientY - rect.top) / rect.height) * 100, 0), 100);
    const focusValue = `${x.toFixed(1)}% ${y.toFixed(1)}%`;
    picture.dataset.focus = focusValue;
    picture.style.setProperty('--focus', focusValue);
    updateFocusHandlePosition(picture, focusValue);
    recordFocusDraft(picture, focusValue);
  };

  picture.addEventListener('pointerdown', evt => {
    if (evt.button !== 0) return;
    dragging = true;
    picture.setPointerCapture(evt.pointerId);
    updateFromEvent(evt);
  });

  picture.addEventListener('pointermove', evt => {
    if (!dragging) return;
    updateFromEvent(evt);
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
    picture.addEventListener(type, evt => {
      if (!dragging) return;
      dragging = false;
      picture.releasePointerCapture(evt.pointerId);
    });
  });
}

function enableFocusDev(context = document) {
  if (!state.devMode) return;
  context.querySelectorAll('picture.focus-img').forEach(attachFocusHandle);
}

function refreshImageEnhancements(context = document) {
  observeReveals(context);
  enableFocusDev(context);
  context.querySelectorAll('picture.focus-img').forEach(pic => {
    if (!pic.dataset.optimized) {
      pic.dataset.optimized = '1';
    }
  });
}

function initFocusPanel() {
  if (!state.devMode || document.getElementById('focusDevPanel')) return;
  const panel = document.createElement('aside');
  panel.id = 'focusDevPanel';
  panel.innerHTML = `
    <header>
      <strong>Focus Tuner</strong>
      <button type="button" id="focusCopyBtn">Copy JSON</button>
    </header>
    <p>Drag focal point overlays to adjust crop focus. Patches log to the console.</p>
    <ul id="focusDraftList"><li>No adjustments captured yet.</li></ul>
  `;
  document.body.appendChild(panel);
  document.getElementById('focusCopyBtn')?.addEventListener('click', copyFocusDrafts);
}

function tagLabel(tag) {
  if (tag === 'all') {
    return state.i18n.ui?.filter_all || 'All';
  }
  const chip = document.querySelector(`.filters .chip[data-tag="${CSS.escape(tag)}"]`);
  return chip ? chip.textContent.trim() : tag;
}

function getVisibleCount() {
  return Array.from(document.querySelectorAll('#project-grid .card')).filter(
    el => el.style.display !== 'none'
  ).length;
}

function updateFilterStatus(tag, visible) {
  const status = document.getElementById('filterStatus');
  if (!status) return;
  const total = state.projects.length;
  const ui = state.i18n.ui || {};
  if (!total) {
    status.textContent = ui.filter_status_default || 'Loading projects…';
    return;
  }
  if (!visible) {
    const tpl = ui.filter_status_none || 'No case studies for {tag} yet.';
    status.textContent = tpl.replace('{tag}', tagLabel(tag));
    return;
  }
  if (tag === 'all') {
    const tpl = ui.filter_status_all || 'Showing {count} of {total} case studies.';
    status.textContent = tpl.replace('{count}', visible).replace('{total}', total);
    return;
  }
  const tpl = ui.filter_status_tag || 'Showing {count} of {total} case studies — {tag}.';
  status.textContent = tpl
    .replace('{count}', visible)
    .replace('{total}', total)
    .replace('{tag}', tagLabel(tag));
}

function applyFilters(tag) {
  state.activeTag = tag || 'all';
  const chips = document.querySelectorAll('.filters .chip');
  chips.forEach(chip => {
    const isActive = chip.dataset.tag === state.activeTag;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-selected', String(isActive));
  });
  let visible = 0;
  document.querySelectorAll('#project-grid .card').forEach(card => {
    const tags = (card.getAttribute('data-tags') || '').split(',');
    const match = state.activeTag === 'all' || tags.includes(state.activeTag);
    card.style.display = match ? '' : 'none';
    if (match) visible += 1;
  });
  updateFilterStatus(state.activeTag, visible);
}

function setupFilters() {
  const chips = document.querySelectorAll('.filters .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => applyFilters(chip.dataset.tag || 'all'));
    chip.addEventListener('keydown', evt => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        applyFilters(chip.dataset.tag || 'all');
      }
    });
  });
}

function setupTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const root = document.documentElement;
  if (!root.dataset.theme) {
    root.dataset.theme = localStorage.getItem('theme') || 'dark';
  }
  const sync = () => btn.setAttribute('aria-pressed', String(root.dataset.theme === 'light'));
  sync();
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
    sync();
  });
}

function setupMenu() {
  const btn = document.getElementById('menuToggle');
  const nav = document.getElementById('primaryNav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open', !expanded);
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', evt => {
    if (evt.key === 'Escape') {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function applyI18nFallbacks(dict) {
  if (!dict) return;
  const ui = dict.ui || dict;
  const projectsHeading = document.querySelector('#projects .section-head h3');
  if (ui.projects && projectsHeading) projectsHeading.textContent = ui.projects;
  const contactHeading = document.querySelector('#contact h3');
  if (ui.contact && contactHeading) contactHeading.textContent = ui.contact;
  const contactCards = document.querySelectorAll('#contact .contact-grid > div');
  if (contactCards[0]) {
    const emailLabel = contactCards[0].querySelector('h4');
    if (emailLabel && ui.email) emailLabel.textContent = ui.email;
  }
  if (contactCards[1]) {
    const phoneLabel = contactCards[1].querySelector('h4');
    if (phoneLabel && ui.phone) phoneLabel.textContent = ui.phone;
  }
  if (contactCards[2]) {
    const linkedinLabel = contactCards[2].querySelector('h4');
    if (linkedinLabel && ui.linkedin) linkedinLabel.textContent = ui.linkedin;
  }
  if (contactCards[3]) {
    const websiteLabel = contactCards[3].querySelector('h4');
    if (websiteLabel && ui.website) websiteLabel.textContent = ui.website;
  }
}

function setTranslations(data, lang) {
  state.i18n = data || { ui: {} };
  state.lang = lang;
  document.documentElement.lang = lang;
  const dict = state.i18n.ui || {};
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.dataset.i18nKey;
    if (!key) return;
    const value = dict[key];
    if (typeof value === 'string') {
      el.textContent = value;
    }
  });
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    const next = lang === 'en' ? 'FR' : 'EN';
    langBtn.textContent = next;
    langBtn.setAttribute('aria-label', lang === 'en' ? 'Passer en français' : 'Switch to English');
    langBtn.setAttribute('aria-pressed', String(lang === 'fr'));
  }
  applyI18nFallbacks(state.i18n);
  renderProjects();
  updateFilterStatus(state.activeTag, getVisibleCount());
}

async function applyI18n(lang) {
  if (translationsCache[lang]) {
    setTranslations(translationsCache[lang], lang);
    return;
  }
  const data = await loadJSON(`content/i18n_${lang}.json`);
  if (data) {
    translationsCache[lang] = data;
    setTranslations(data, lang);
  }
}

function setupLang() {
  const btn = document.getElementById('langToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = state.lang === 'en' ? 'fr' : 'en';
    localStorage.setItem('lang', next);
    applyI18n(next);
  });
  applyI18n(state.lang);
}

async function applyHeadMetaHome() {
  if (!document.body || document.body.dataset.page !== 'home') return;
  const cfg = await loadJSON('content/config.json');
  if (!cfg) return;
  const domain = (cfg.portfolio || cfg.website || location.origin).replace(/\/$/, '');
  const can = document.querySelector('#canonical');
  if (can) can.href = `${domain}/`;
  const og = document.querySelector('meta[property="og:image"]');
  if (og) og.setAttribute('content', `${domain}/assets/og-image.jpg`);
  const tw = document.querySelector('meta[name="twitter:image"]');
  if (tw) tw.setAttribute('content', `${domain}/assets/og-image.jpg`);
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', `${domain}/`);
  const twUrl = document.querySelector('meta[property="twitter:url"]');
  if (twUrl) twUrl.setAttribute('content', `${domain}/`);
}

async function mountProjects() {
  const grid = document.getElementById('project-grid');
  const data = await loadJSON('content/projects.json');
  if (data && Array.isArray(data) && data.length) {
    state.projects = data;
    renderProjects();
  } else {
    if (grid) {
      grid.dataset.ssr = grid.dataset.ssr || '1';
    }
    console.warn('Using SSR fallback cards.');
  }
}

function trackCTA(name) {
  try {
    if (window.plausible) window.plausible('CTA Click', { props: { button: name } });
  } catch (err) {
    /* no-op */
  }
}

function wireCTAs() {
  const map = [
    ['a.btn[href$=".docx"]', 'Download CV'],
    ['a[href^="mailto:"]', 'Email'],
    ['a[href^="https://wa.me"], a[href*="whatsapp"]', 'WhatsApp'],
    ['a[href*="linkedin.com"]', 'LinkedIn']
  ];
  map.forEach(([selector, label]) => {
    document.querySelectorAll(selector).forEach(anchor => {
      anchor.addEventListener('click', () => trackCTA(label));
    });
  });
}

async function bootstrap() {
  setupTheme();
  setupMenu();
  setupFilters();
  setupLang();
  initFocusPanel();
  await applyHeadMetaHome();
  await mountProjects();
  wireCTAs();
  refreshImageEnhancements(document);
  updateFilterStatus(state.activeTag, getVisibleCount());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// Expose globals for project detail scripts
window.state = state;
window.loadJSON = loadJSON;
window.imgBlock = imgBlock;
window.observeReveals = observeReveals;
window.applyFilters = applyFilters;
window.setTranslations = setTranslations;
window.refreshImageEnhancements = refreshImageEnhancements;
window.trackEvent = trackEvent;
window.escapeHTML = escapeHTML;
