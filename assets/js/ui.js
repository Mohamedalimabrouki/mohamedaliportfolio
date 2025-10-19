(() => {
  const doc = document;
  const body = document.body;
  const header = doc.querySelector('.site-header');
  const nav = doc.querySelector('[data-site-nav]');
  const navToggle = doc.querySelector('[data-nav-toggle]');
  const navLinks = Array.from(doc.querySelectorAll('.site-nav__link'));
  const sections = Array.from(doc.querySelectorAll('[data-section]'));
  const currentYearEl = doc.querySelector('[data-current-year]');
  const revealElements = Array.from(doc.querySelectorAll('[data-reveal]'));
  const contactForm = doc.getElementById('contact-form');

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerFineQuery = window.matchMedia('(pointer: fine)');

  let prefersReducedMotion = reduceMotionQuery.matches;

  function setReducedMotionState(value) {
    prefersReducedMotion = value;
    body.dataset.reducedMotion = value ? 'true' : 'false';
  }

  setReducedMotionState(prefersReducedMotion);
  reduceMotionQuery.addEventListener('change', (event) => {
    setReducedMotionState(event.matches);
  });

  if (currentYearEl) {
    currentYearEl.textContent = String(new Date().getFullYear());
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open', !expanded);
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      });
    });
  }

  const observerOptions = {
    rootMargin: '-50% 0px -40% 0px',
    threshold: 0
  };

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          const target = link.dataset.navTarget;
          link.dataset.active = target === id ? 'true' : 'false';
        });
      });
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));

    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    if (!prefersReducedMotion) {
      revealElements.forEach((el) => revealObserver.observe(el));
    } else {
      revealElements.forEach((el) => el.classList.add('is-visible'));
    }
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  function updateHeaderState() {
    if (!header) return;
    const isScrolled = window.scrollY > 24;
    header.classList.toggle('is-scrolled', isScrolled);
  }

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  function mountParallax() {
    const root = doc.querySelector('[data-parallax-root]');
    if (!root || prefersReducedMotion || !pointerFineQuery.matches) return;
    const layers = Array.from(root.querySelectorAll('[data-parallax-layer]'));
    if (!layers.length) return;
    let ticking = false;
    function applyParallax(xRatio, yRatio) {
      layers.forEach((layer) => {
        const strength = Number(layer.dataset.parallaxLayer) || 0.15;
        const x = (xRatio - 0.5) * strength * 40;
        const y = (yRatio - 0.5) * strength * 40;
        layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      });
    }
    function onPointerMove(event) {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        const xRatio = (event.clientX - rect.left) / rect.width;
        const yRatio = (event.clientY - rect.top) / rect.height;
        applyParallax(xRatio, yRatio);
        ticking = false;
      });
    }
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('mouseleave', () => {
      layers.forEach((layer) => {
        layer.style.transform = 'translate3d(0,0,0)';
      });
    });
  }

  function mountTilt() {
    if (prefersReducedMotion || !pointerFineQuery.matches) return;
    const cards = Array.from(doc.querySelectorAll('.tilt-card'));
    cards.forEach((card) => {
      let interactive = true;
      card.addEventListener('pointerenter', () => {
        if (!interactive) return;
        card.style.transition = 'transform 0.35s ease, box-shadow 0.35s ease';
      });
      card.addEventListener('pointermove', (event) => {
        if (!interactive) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const rotateX = (y * -6).toFixed(2);
        const rotateY = (x * 6).toFixed(2);
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
      card.addEventListener('click', () => {
        interactive = false;
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  function handleFilters() {
    const container = doc.querySelector('[data-project-list]');
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.project-card'));
    const selectStack = doc.querySelector('select[data-filter="stack"]');
    const selectRole = doc.querySelector('select[data-filter="role"]');
    const selectYear = doc.querySelector('select[data-filter="year"]');
    const status = doc.querySelector('[data-status]');
    if (!selectStack || !selectYear || !status) return;

    function updateStatus(visible) {
      if (!status) return;
      const total = cards.length;
      if (!visible.length) {
        const emptyLabel = status.dataset.statusEmpty || 'No projects match this filter yet.';
        status.textContent = emptyLabel.replace('{count}', visible.length).replace('{total}', total);
      } else if (visible.length === total) {
        const allLabel = status.dataset.statusAll || `Showing ${visible.length} of ${total} projects.`;
        status.textContent = allLabel.replace('{count}', visible.length).replace('{total}', total);
      } else {
        const filteredLabel = status.dataset.statusFiltered || `Showing ${visible.length} of ${total} projects.`;
        status.textContent = filteredLabel.replace('{count}', visible.length).replace('{total}', total);
      }
    }

    function applyFilters() {
      const stackValue = selectStack.value;
      const roleValue = selectRole ? selectRole.value : 'all';
      const yearValue = selectYear.value;
      const visible = [];
      cards.forEach((card) => {
        const stackTokens = (card.dataset.stack || '').split(',').filter(Boolean);
        const year = card.dataset.year || '';
        const roleToken = card.dataset.role || '';
        const matchesStack = stackValue === 'all' || stackTokens.includes(stackValue);
        const matchesRole = roleValue === 'all' || roleToken === roleValue;
        const matchesYear = yearValue === 'all' || year === yearValue;
        const isVisible = matchesStack && matchesRole && matchesYear;
        card.style.display = isVisible ? '' : 'none';
        if (isVisible) visible.push(card);
      });
      updateStatus(visible);
    }

    selectStack.addEventListener('change', applyFilters);
    if (selectRole) {
      selectRole.addEventListener('change', applyFilters);
    }
    selectYear.addEventListener('change', applyFilters);
    const loadingLabel = status.dataset.statusLoading;
    if (loadingLabel) {
      status.textContent = loadingLabel;
    }
    requestAnimationFrame(applyFilters);
  }

  function handleContactForm() {
    if (!contactForm) return;
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(contactForm);
      const name = data.get('name') || '';
      const email = data.get('email') || '';
      const message = data.get('message') || '';
      const base = contactForm.dataset.mailto || 'mailto:hello@mohamedalimabrouki.com?subject=Project%20enquiry';
      const separator = base.includes('?') ? '&' : '?';
      const composed = `${base}${separator}body=${encodeURIComponent(`${name ? `Name: ${name}\n` : ''}${email ? `Email: ${email}\n\n` : ''}${message}`)}`;
      window.location.href = composed;
    });
  }

  function init() {
    mountParallax();
    mountTilt();
    handleFilters();
    handleContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
