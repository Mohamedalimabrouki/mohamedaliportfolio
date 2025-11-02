(() => {
  const doc = document;
  const body = document.body;
  const header = doc.querySelector('.site-header');
  const nav = doc.querySelector('[data-site-nav]');
  const navToggle = doc.querySelector('[data-nav-toggle]');
  const navLinks = Array.from(doc.querySelectorAll('.site-nav__link'));
  const sections = Array.from(doc.querySelectorAll('[data-section]'));
  const currentYearEl = doc.querySelector('[data-current-year]');
  let revealElements = Array.from(doc.querySelectorAll('[data-reveal]'));
  const contactForm = doc.getElementById('contact-form');

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerFineQuery = window.matchMedia('(pointer: fine)');
  const supportsIntersectionObserver = 'IntersectionObserver' in window;
  let parallaxCleanup = null;
  let tiltCleanup = null;
  let revealObserver = null;

  let prefersReducedMotion = reduceMotionQuery.matches;

  function setReducedMotionState(value) {
    prefersReducedMotion = value;
    body.dataset.reducedMotion = value ? 'true' : 'false';
  }

  setReducedMotionState(prefersReducedMotion);
  function attachMediaQueryListener(query, handler) {
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', handler);
    } else if (typeof query.addListener === 'function') {
      query.addListener(handler);
    }
  }

  attachMediaQueryListener(reduceMotionQuery, (event) => {
    setReducedMotionState(event.matches);
    refreshMotionBehaviors();
  });

  attachMediaQueryListener(pointerFineQuery, () => {
    refreshMotionBehaviors();
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

  if (supportsIntersectionObserver) {
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
  }

  function updateHeaderState() {
    if (!header) return;
    const isScrolled = window.scrollY > 24;
    header.classList.toggle('is-scrolled', isScrolled);
  }

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  function setupParallax() {
    if (typeof parallaxCleanup === 'function') {
      parallaxCleanup();
      parallaxCleanup = null;
    }
    if (prefersReducedMotion || !pointerFineQuery.matches) return;
    const root = doc.querySelector('[data-parallax-root]');
    if (!root) return;
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
    function resetLayers() {
      layers.forEach((layer) => {
        layer.style.transform = 'translate3d(0,0,0)';
      });
    }
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('mouseleave', resetLayers);
    parallaxCleanup = () => {
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('mouseleave', resetLayers);
      resetLayers();
    };
  }

  function setupTilt() {
    if (typeof tiltCleanup === 'function') {
      tiltCleanup();
      tiltCleanup = null;
    }
    if (prefersReducedMotion || !pointerFineQuery.matches) return;
    const cards = Array.from(doc.querySelectorAll('.tilt-card'));
    if (!cards.length) return;
    const cleanupFns = [];
    cards.forEach((card) => {
      const onPointerEnter = () => {
        card.style.transition = 'transform 0.35s ease';
      };
      const onPointerMove = (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const rotateX = (y * -6).toFixed(2);
        const rotateY = (x * 6).toFixed(2);
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      };
      const onPointerLeave = () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      };
      card.addEventListener('pointerenter', onPointerEnter);
      card.addEventListener('pointermove', onPointerMove);
      card.addEventListener('pointerleave', onPointerLeave);
      cleanupFns.push(() => {
        card.removeEventListener('pointerenter', onPointerEnter);
        card.removeEventListener('pointermove', onPointerMove);
        card.removeEventListener('pointerleave', onPointerLeave);
        card.style.transform = 'none';
        card.style.transition = '';
      });
    });
    tiltCleanup = () => {
      cleanupFns.forEach((fn) => fn());
      tiltCleanup = null;
    };
  }

  function setupReveals() {
    revealElements = Array.from(doc.querySelectorAll('[data-reveal]'));
    if (!revealElements.length) return;
    if (!supportsIntersectionObserver) {
      revealElements.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (prefersReducedMotion) {
      revealElements.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    revealElements.forEach((el) => {
      if (!el.classList.contains('is-visible')) {
        revealObserver.observe(el);
      }
    });
  }

  function refreshMotionBehaviors() {
    setupParallax();
    setupTilt();
    setupReveals();
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

  function handleMagicLine() {
    const navList = doc.querySelector('.site-nav__list');
    if (!navList) return;
    const magicLine = navList.querySelector('.magic-line');
    if (!magicLine) return;

    function updateMagicLine(target) {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const parentRect = navList.getBoundingClientRect();
      const left = rect.left - parentRect.left;
      const width = rect.width;
      magicLine.style.transform = `translateX(${left}px)`;
      magicLine.style.width = `${width}px`;
    }

    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => updateMagicLine(link));
    });

    navList.addEventListener('mouseleave', () => {
      const activeLink = navList.querySelector('.site-nav__link[data-active="true"]');
      updateMagicLine(activeLink);
    });

    const activeLink = navList.querySelector('.site-nav__link[data-active="true"]');
    if (activeLink) {
      setTimeout(() => updateMagicLine(activeLink), 100);
    }
  }

  function handleMagicLine() {
    const navList = doc.querySelector('.site-nav__list');
    if (!navList) return;
    const magicLine = navList.querySelector('.magic-line');
    if (!magicLine) return;

    function updateMagicLine(target) {
      if (!target) {
        magicLine.style.transform = 'translateX(0)';
        magicLine.style.width = '0px';
        return;
      }
      const rect = target.getBoundingClientRect();
      const parentRect = navList.getBoundingClientRect();
      const left = rect.left - parentRect.left;
      const width = rect.width;
      magicLine.style.transform = `translateX(${left}px)`;
      magicLine.style.width = `${width}px`;
    }

    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => updateMagicLine(link));
    });

    navList.addEventListener('mouseleave', () => {
      const activeLink = navList.querySelector('.site-nav__link[data-active="true"]');
      updateMagicLine(activeLink);
    });

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          const target = link.dataset.navTarget;
          const isActive = target === id;
          link.dataset.active = isActive ? 'true' : 'false';
          if (isActive) {
            updateMagicLine(link);
          }
        });
      });
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));
  }

  function init() {
    refreshMotionBehaviors();
    handleContactForm();
    handleMagicLine();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('projects:hydrated', () => {
    refreshMotionBehaviors();
  });
})();
