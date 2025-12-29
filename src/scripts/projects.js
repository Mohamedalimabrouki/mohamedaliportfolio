(() => {
  const doc = document;
  const body = doc.body;
  const html = document.documentElement;
  const projectsEndpoint = '/content/projects.json';
  const lang = body.dataset.lang || html.lang || 'en';
  const pageKey = html.dataset.page || '';
  const isProjectsIndex = pageKey === 'projects';
  const isProjectDetail = pageKey.startsWith('project:');

  // Projects are now injected via window.PROJECTS_DATA in the Astro template
  function getProjects() {
    return Array.isArray(window.PROJECTS_DATA) ? window.PROJECTS_DATA : [];
  }

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const escapeAttr = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  function normalizeToken(value) {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function deriveYear(period) {
    const match = String(period || '').match(/\d{4}/g);
    if (!match || !match.length) return 'n-a';
    return match[match.length - 1];
  }

  function localized(project, key) {
    const localizedKey = `${key}_${lang}`;
    const fallbackKey = `${key}_en`;
    return project[localizedKey] ?? project[fallbackKey] ?? '';
  }

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.length) return [value];
    return [];
  }

  function resolveRole(projectRole) {
    if (!projectRole) return '';
    const parts = projectRole.split('·').map((part) => part.trim());
    if (lang === 'fr' && parts[1]) return parts[1];
    return parts[0] || projectRole;
  }

  function resolveHref(projectId) {
    const encoded = encodeURIComponent(projectId);
    return lang === 'fr' ? `/fr/projets/${encoded}.html` : `/projects/${encoded}.html`;
  }

  function resolveImagePath(pathValue) {
    if (!pathValue) return '';
    return pathValue.startsWith('/') ? pathValue : `/${pathValue}`;
  }

  function renderProjectCard(project) {
    const title = localized(project, 'title');
    const summary = localized(project, 'summary');
    const highlights = toArray(localized(project, 'highlights'));
    const coverAlt = localized(project, 'cover_alt');
    const period = project.period || '';
    const role = resolveRole(project.role);
    const href = resolveHref(project.id);
    const coverSrc = resolveImagePath(project.cover);
    const stackTokens = (project.stack || []).map(normalizeToken).filter(Boolean).join(',');
    const tagTokens = (project.tags || []).map(normalizeToken).filter(Boolean).join(',');
    const year = deriveYear(period);
    const highlightMarkup = highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const stackBadges = (project.stack || [])
      .map((item) => `<span class="badge">${escapeHtml(item)}</span>`)
      .join('');

    return `<article class="project-card tilt-card" data-reveal data-stack="${stackTokens}" data-tags="${tagTokens}" data-year="${year}">
    <a class="project-card__link" href="${href}">
      <div class="project-card__media">
        <picture>
          <img src="${coverSrc}" alt="${escapeAttr(coverAlt)}" width="1600" height="900" loading="lazy" decoding="async">
        </picture>
      </div>
      <div class="project-card__body">
        <div class="project-card__header">
          <h3>${escapeHtml(title)}</h3>
          <p class="project-card__summary">${escapeHtml(summary)}</p>
        </div>
        <ul class="project-card__highlights">${highlightMarkup}</ul>
        <div class="project-card__meta">
          <span class="project-card__period">${escapeHtml(period)}</span>
          <span class="project-card__role">${escapeHtml(role)}</span>
        </div>
        <div class="project-card__tags">${stackBadges}</div>
      </div>
    </a>
  </article>`;
  }

  function updateCountBadge(root, total) {
    const badge = root.querySelector('[data-project-count]');
    if (!badge) return;
    const label = badge.dataset.countLabel || badge.querySelector('span')?.textContent || '';
    const strongEl = badge.querySelector('strong');
    if (strongEl) {
      strongEl.textContent = String(total);
    }
    const labelEl = badge.querySelector('span');
    if (labelEl && label) {
      labelEl.textContent = label;
    }
    if (label) {
      badge.setAttribute('aria-label', `${total} ${label}`.trim());
    }
  }

  function buildOptionMarkup(items, defaultLabel) {
    const sorted = items.sort((a, b) => a.label.localeCompare(b.label));
    const options = sorted.map((item) => `<option value="${item.value}">${escapeHtml(item.label)}</option>`).join('');
    return `<option value="all" selected>${escapeHtml(defaultLabel)}</option>${options}`;
  }

  function populateFilters(projects, root) {
    const stackSelect = root.querySelector('select[data-filter="stack"]');
    const tagSelect = root.querySelector('select[data-filter="tag"]');
    const yearSelect = root.querySelector('select[data-filter="year"]');

    if (stackSelect) {
      const map = new Map();
      projects.forEach((project) => {
        (project.stack || []).forEach((token) => {
          const value = normalizeToken(token);
          if (!value || map.has(value)) return;
          map.set(value, token);
        });
      });
      const defaultLabel = stackSelect.dataset.defaultLabel || stackSelect.querySelector('option')?.textContent || 'All';
      const items = Array.from(map.entries()).map(([value, label]) => ({ value, label }));
      stackSelect.innerHTML = buildOptionMarkup(items, defaultLabel);
    }

    if (tagSelect) {
      const map = new Map();
      projects.forEach((project) => {
        (project.tags || []).forEach((token) => {
          const value = normalizeToken(token);
          if (!value || map.has(value)) return;
          map.set(value, token);
        });
      });
      const defaultLabel = tagSelect.dataset.defaultLabel || tagSelect.querySelector('option')?.textContent || 'All';
      const items = Array.from(map.entries()).map(([value, label]) => ({ value, label }));
      tagSelect.innerHTML = buildOptionMarkup(items, defaultLabel);
    }

    if (yearSelect) {
      const set = new Set();
      projects.forEach((project) => {
        const period = project.period || '';
        const match = period.match(/\d{4}/g);
        if (match) {
          match.forEach((year) => set.add(year));
        }
      });
      const defaultLabel = yearSelect.dataset.defaultLabel || yearSelect.querySelector('option')?.textContent || 'All';
      const items = Array.from(set)
        .sort((a, b) => Number(b) - Number(a))
        .map((year) => ({ value: year, label: year }));
      yearSelect.innerHTML = buildOptionMarkup(items, defaultLabel);
    }
  }

  function setupFilters(root) {
    const container = root.querySelector('[data-project-list]');
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.project-card'));
    const selectStack = root.querySelector('select[data-filter="stack"]');
    const selectTag = root.querySelector('select[data-filter="tag"]');
    const selectYear = root.querySelector('select[data-filter="year"]');
    const status = root.querySelector('[data-status]');

    if (!status) return;
    const total = cards.length;

    function formatStatus(template, count) {
      if (!template) return '';
      return template.replace(/\{count\}/g, String(count)).replace(/\{total\}/g, String(total));
    }

    function updateStatus(visibleCount) {
      if (!status) return;
      if (visibleCount === 0) {
        status.textContent = formatStatus(status.dataset.statusEmpty, visibleCount) || 'No projects to display.';
      } else if (visibleCount === total) {
        status.textContent = formatStatus(status.dataset.statusAll, visibleCount);
      } else {
        status.textContent = formatStatus(status.dataset.statusFiltered, visibleCount);
      }
    }

    function applyFilters() {
      const stackValue = selectStack ? selectStack.value : 'all';
      const tagValue = selectTag ? selectTag.value : 'all';
      const yearValue = selectYear ? selectYear.value : 'all';
      let visibleCount = 0;
      cards.forEach((card) => {
        const stackTokens = (card.dataset.stack || '').split(',').filter(Boolean);
        const tagTokens = (card.dataset.tags || '').split(',').filter(Boolean);
        const yearToken = card.dataset.year || '';
        const matchesStack = stackValue === 'all' || stackTokens.includes(stackValue);
        const matchesTag = tagValue === 'all' || tagTokens.includes(tagValue);
        const matchesYear = yearValue === 'all' || yearToken === yearValue;
        const isVisible = matchesStack && matchesTag && matchesYear;
        card.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount += 1;
      });
      updateStatus(visibleCount);
    }

    if (selectStack) selectStack.addEventListener('change', applyFilters);
    if (selectTag) selectTag.addEventListener('change', applyFilters);
    if (selectYear) selectYear.addEventListener('change', applyFilters);

    if (status.dataset.statusAll) {
      status.textContent = formatStatus(status.dataset.statusAll, total);
    }

    applyFilters();
  }

  function hydrateProjectsIndex(projects) {
    const root = doc.querySelector('[data-projects-root]');
    if (!root) return;
    const list = root.querySelector('[data-project-list]');
    if (!list) return;
    const hasStaticMarkup = root.dataset.renderSource === 'static';
    if (!hasStaticMarkup) {
      const cardsMarkup = projects.map((project) => renderProjectCard(project)).join('');
      list.innerHTML = cardsMarkup;
    }
    const cards = list.querySelectorAll('.project-card');
    updateCountBadge(root, cards.length);
    populateFilters(projects, root);
    setupFilters(root);
    doc.dispatchEvent(new CustomEvent('projects:hydrated'));
  }

  function renderBadgeList(items = []) {
    return items.map((item) => `<span class="badge">${escapeHtml(item)}</span>`).join('');
  }

  function renderList(items = []) {
    return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function hydrateProjectDetail(projects) {
    const detailRoot = doc.querySelector('[data-project-detail]');
    if (!detailRoot) return;
    if (detailRoot.dataset.renderSource === 'static') {
      doc.dispatchEvent(new CustomEvent('projects:hydrated'));
      return;
    }
    const projectId = detailRoot.dataset.projectId || pageKey.replace('project:', '');
    if (!projectId) return;
    const project = projects.find((item) => item.id === projectId);
    const hero = detailRoot.querySelector('[data-project-hero]');
    const highlightsCard = detailRoot.querySelector('[data-project-highlights]');
    const metricsCard = detailRoot.querySelector('[data-project-metrics]');
    const galleryRoot = detailRoot.querySelector('[data-project-gallery]');
    const loadingMessage = detailRoot.dataset.loadingMessage || 'Loading project…';

    if (!project) {
      if (hero) {
        hero.innerHTML = `<div class="project-hero__copy"><p>${escapeHtml(
          detailRoot.dataset.errorMessage || 'Project not found.'
        )}</p></div>`;
      }
      return;
    }

    const title = localized(project, 'title');
    const summary = localized(project, 'summary');
    const highlights = toArray(localized(project, 'highlights'));
    const metrics = toArray(localized(project, 'metrics'));
    const coverAlt = localized(project, 'cover_alt');
    const coverSrc = resolveImagePath(project.cover);
    const galleryImages = project.gallery || [];
    const role = resolveRole(project.role);
    const labels = {
      overview: detailRoot.dataset.labelOverview || 'Overview',
      period: detailRoot.dataset.labelPeriod || 'Period',
      role: detailRoot.dataset.labelRole || 'Role',
      client: detailRoot.dataset.labelClient || 'Client',
      stack: detailRoot.dataset.labelStack || 'Focus',
      highlights: detailRoot.dataset.labelHighlights || 'Highlights',
      metrics: detailRoot.dataset.labelMetrics || 'Metrics'
    };
    const ctas = {
      contact: detailRoot.dataset.ctaContact || 'Contact',
      projects: detailRoot.dataset.ctaProjects || 'All projects',
      projectsHref: detailRoot.dataset.projectsHref || (lang === 'fr' ? '/fr/projets/index.html' : '/projects/index.html'),
      contactEmail: detailRoot.dataset.contactEmail || 'contact@mohamedalimabrouki.com'
    };

    if (hero) {
      hero.innerHTML = `<div class="project-hero__copy">
        <p class="eyebrow">${escapeHtml(labels.overview)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(summary)}</p>
        <div class="project-hero__meta">
          <dl>
            <div><dt>${escapeHtml(labels.period)}</dt><dd>${escapeHtml(project.period || '')}</dd></div>
            <div><dt>${escapeHtml(labels.role)}</dt><dd>${escapeHtml(role)}</dd></div>
            <div><dt>${escapeHtml(labels.client)}</dt><dd>${escapeHtml(project.client_or_brand || '')}</dd></div>
            <div><dt>${escapeHtml(labels.stack)}</dt><dd>${renderBadgeList(project.stack || [])}</dd></div>
          </dl>
          <div class="project-hero__actions">
            <a class="btn btn--primary" href="mailto:${escapeAttr(ctas.contactEmail)}">${escapeHtml(ctas.contact)}</a>
            <a class="btn btn--ghost" href="${escapeAttr(ctas.projectsHref)}">${escapeHtml(ctas.projects)}</a>
          </div>
        </div>
      </div>
      <div class="project-hero__media">
        <picture>
          <img src="${coverSrc}" alt="${escapeAttr(coverAlt)}" width="1600" height="900" loading="eager" decoding="async" fetchpriority="high">
        </picture>
      </div>`;
    }

    if (highlightsCard) {
      const content = highlights.length ? `<ul>${renderList(highlights)}</ul>` : `<p>${escapeHtml(loadingMessage)}</p>`;
      highlightsCard.innerHTML = `<h2>${escapeHtml(labels.highlights)}</h2>${content}`;
    }

    if (metricsCard) {
      const content = metrics.length ? `<ul>${renderList(metrics)}</ul>` : `<p>${escapeHtml(loadingMessage)}</p>`;
      metricsCard.innerHTML = `<h2>${escapeHtml(labels.metrics)}</h2>${content}`;
    }

    if (galleryRoot) {
      const galleryMarkup = galleryImages
        .map((img) => {
          const src = resolveImagePath(img);
          return `<figure class="gallery__item">
            <picture>
              <img src="${src}" alt="${escapeAttr(coverAlt)}" width="1600" height="900" loading="lazy" decoding="async">
            </picture>
          </figure>`;
        })
        .join('');
      galleryRoot.innerHTML = galleryMarkup;
    }

    doc.dispatchEvent(new CustomEvent('projects:hydrated'));
  }

  function showStatusError(error) {
    const root = doc.querySelector('[data-projects-root]');
    const status = root?.querySelector('[data-status]');
    if (status) {
      status.textContent = status.dataset.statusError || 'Unable to load projects.';
    }
    const detailRoot = doc.querySelector('[data-project-detail]');
    if (detailRoot) {
      const message = detailRoot.dataset.errorMessage || 'Unable to load this project.';
      const hero = detailRoot.querySelector('[data-project-hero]');
      if (hero) {
        hero.innerHTML = `<div class="project-hero__copy"><p>${escapeHtml(message)}</p></div>`;
      }
    }
    console.error(error);
  }

  function init() {
    const projectsRoot = doc.querySelector('[data-projects-root]');
    const detailRoot = doc.querySelector('[data-project-detail]');
    const shouldHydrateProjects = Boolean(projectsRoot);
    const shouldHydrateDetail = detailRoot && detailRoot.dataset.renderSource !== 'static';
    
    if (!shouldHydrateProjects && !shouldHydrateDetail) {
      if (detailRoot && detailRoot.dataset.renderSource === 'static') {
        doc.dispatchEvent(new CustomEvent('projects:hydrated'));
      }
      return;
    }

    try {
      const projects = getProjects();
      if (shouldHydrateProjects) {
        hydrateProjectsIndex(projects);
      }
      if (shouldHydrateDetail) {
        hydrateProjectDetail(projects);
      }
    } catch (error) {
      showStatusError(error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
