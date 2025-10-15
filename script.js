const DEFAULT_CARD_SIZES = '(min-width: 1280px) 360px, (min-width: 900px) 45vw, 92vw';
const DEFAULT_GALLERY_SIZES = '(min-width: 960px) 600px, (min-width: 720px) 48vw, 92vw';
const DEFAULT_FOCUS = '50% 50%';

const state = {
  projects: [],
  activeTag: 'all',
  lang: localStorage.getItem('lang') || 'en',
  i18n: { ui: {} },
  assetManifest: null,
  revealObserver: null,
  devMode: new URLSearchParams(window.location.search).get('dev') === '1'
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

async function loadJSON(url, { cache = 'no-store' } = {}) {
  try {
    const response = await fetch(url, { cache });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('Could not load', url, err);
    return null;
  }
}

async function loadManifest() {
  const manifest = await loadJSON('content/assets-manifest.json');
  if (manifest && manifest.images) {
    state.assetManifest = manifest;
  }
}

function getManifestEntry(path) {
  return state.assetManifest?.images?.[path];
}

function imgBlock(src, opts, legacyFocus) {
  let options = {};
  if (typeof opts === 'string' || opts === undefined) {
    options.alt = opts || '';
    options.focus = legacyFocus;
  } else {
    options = opts || {};
  }

  const entry = getManifestEntry(src);
  const alt = options.alt ?? '';
  const focus = options.focus || entry?.focus || DEFAULT_FOCUS;
  const sizes =
    options.sizes || (options.context === 'gallery' ? DEFAULT_GALLERY_SIZES : DEFAULT_CARD_SIZES);
  const loading = options.loading === 'eager' ? 'eager' : 'lazy';
  const decoding = options.decoding || 'async';
  const className = options.className ? `focus-img ${options.className}` : 'focus-img';
  const fetchPriority = options.fetchPriority;
  const slugAttr = options.slug ? ` data-slug="${escapeAttr(options.slug)}"` : '';
  const indexAttr =
    options.index !== undefined ? ` data-index="${escapeAttr(String(options.index))}"` : '';
  const sizeAttr = sizes ? ` sizes="${escapeAttr(sizes)}"` : '';
  const fetchAttr = fetchPriority ? ` fetchpriority="${escapeAttr(fetchPriority)}"` : '';
  const pictureAttrs = [
    `class="${className}"`,
    `style="--focus:${escapeAttr(focus)}"`,
    `data-src="${escapeAttr(src)}"`,
    `data-focus="${escapeAttr(focus)}"`,
    slugAttr,
    indexAttr
  ]
    .filter(Boolean)
    .join(' ');

  const extraAttrs = [];
  if (entry?.aspectRatio) extraAttrs.push(`data-aspect="${entry.aspectRatio}"`);
  if (entry?.placeholder) extraAttrs.push(`data-placeholder="${entry.placeholder}"`);
  if (entry) extraAttrs.push('data-optimized="1"');

  const sources = [];
  if (entry?.formats?.avif) {
    sources.push(
      `<source type="image/avif" srcset="${escapeAttr(entry.formats.avif.srcset)}"${sizeAttr}>`
    );
  }
  if (entry?.formats?.webp) {
    sources.push(
      `<source type="image/webp" srcset="${escapeAttr(entry.formats.webp.srcset)}"${sizeAttr}>`
    );
  }
  if (entry?.formats?.jpg) {
    sources.push(
      `<source type="image/jpeg" srcset="${escapeAttr(entry.formats.jpg.srcset)}"${sizeAttr}>`
    );
  }
  if (!sources.length) {
    const webp = src.replace(/\.(jpe?g|png)$/i, '.webp');
    if (webp !== src) {
      sources.push(`<source type="image/webp" srcset="${escapeAttr(webp)}"${sizeAttr}>`);
    }
  }

  const fallback = entry?.fallback || src;
  const loadingAttr = ` loading="${loading}"`;
  const decodingAttr = decoding ? ` decoding="${escapeAttr(decoding)}"` : '';
  const placeholderAttr = entry?.placeholder
    ? ` style="background-image:url(${entry.placeholder});"`
    : '';

  const img = `<img src="${escapeAttr(fallback)}" alt="${escapeAttr(alt)}"${loadingAttr}${decodingAttr}${sizeAttr}${fetchAttr}${placeholderAttr}>`;
  return `<picture ${pictureAttrs}${extraAttrs.length ? ' ' + extraAttrs.join(' ') : ''}>${sources.join(
    ''
  )}${img}</picture>`;
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

function renderProjectCard(project) {
  const title = localizeValue(project, 'title') || project.title;
  const summary = localizeValue(project, 'summary') || project.summary || '';
  const bullets =
    localizeValue(project, 'bullets') ||
    (Array.isArray(project.bullets) ? project.bullets : []);
  const tags = project.tags || [];
  const focus = localizeDetails(project.details, 'focus') || project.focus || undefined;

  return `<a class="card reveal" href="project.html?p=${encodeURIComponent(
    project.slug
  )}" data-project="${escapeAttr(project.slug)}" data-tags="${escapeAttr(tags.join(','))}">
    ${imgBlock(project.image, {
      alt: title,
      focus,
      slug: project.slug
    })}
    <div class="card-body">
      <h4>${escapeHTML(title)}</h4>
      <p class="muted">${escapeHTML(summary)}</p>
      ${
        bullets && bullets.length
          ? `<ul>${bullets.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`
          : ''
      }
      ${
        tags.length
          ? `<div class="pill-row">${tags
              .map(tag => `<span class="pill pill--small">${escapeHTML(tag)}</span>`)
              .join('')}</div>`
          : ''
      }
      ${project.credit ? `<small class="muted">${escapeHTML(project.credit)}</small>` : ''}
    </div>
  </a>`;
}

function renderProjects() {
  const grid = document.getElementById('project-grid');
  if (!grid) return;
  if (!state.projects.length) {
    grid.innerHTML =
      '<div class="card muted" role="note">Case studies will appear once content is published.</div>';
    refreshImageEnhancements(grid);
    return;
  }
  grid.innerHTML = state.projects.map(renderProjectCard).join('');
  refreshImageEnhancements(grid);
  applyFilters(state.activeTag);
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
    status.textContent = ui.filter_status_empty || 'Case studies will appear soon.';
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

async function loadProjects() {
  const projects = await loadJSON('content/projects.json');
  if (projects && Array.isArray(projects)) {
    state.projects = projects;
    renderProjects();
  }
}

function setupCtaTracking() {
  document.addEventListener(
    'click',
    evt => {
      const target = evt.target.closest('[data-cta]');
      if (!target) return;
      const label = target.dataset.cta;
      if (!label) return;
      trackEvent('CTA Click', { button: label });
    },
    { capture: true }
  );
}

async function bootstrap() {
  setupTheme();
  setupMenu();
  setupFilters();
  setupLang();
  setupCtaTracking();
  initFocusPanel();
  await loadManifest();
  await loadProjects();
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
