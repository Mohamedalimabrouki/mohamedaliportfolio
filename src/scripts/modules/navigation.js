export function initNavigation() {
  const doc = document;
  const body = document.body;
  const header = doc.querySelector('.site-header');
  const nav = doc.querySelector('[data-site-nav]');
  const navToggle = doc.querySelector('[data-nav-toggle]');
  const navLinks = Array.from(doc.querySelectorAll('.site-nav__link'));
  const sections = Array.from(doc.querySelectorAll('[data-section]'));
  const currentYearEl = doc.querySelector('[data-current-year]');

  if (currentYearEl) {
    currentYearEl.textContent = String(new Date().getFullYear());
  }

  function setNavOpen(isOpen) {
    if (!nav || !navToggle) return;
    navToggle.setAttribute('aria-expanded', String(isOpen));
    nav.classList.toggle('is-open', isOpen);
    body.classList.toggle('nav-open', isOpen);
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      const nextState = !expanded;
      setNavOpen(nextState);
      if (nextState) {
        const firstLink = nav.querySelector('.site-nav__link');
        if (firstLink) {
          firstLink.focus();
        }
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setNavOpen(false);
      });
    });

    doc.addEventListener('click', (event) => {
      if (navToggle.getAttribute('aria-expanded') !== 'true') return;
      const target = event.target;
      if (!nav.contains(target) && !navToggle.contains(target)) {
        setNavOpen(false);
      }
    });

    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setNavOpen(false);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1200) {
        setNavOpen(false);
      }
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
          const isActive = target === id;
          link.dataset.active = isActive ? 'true' : 'false';
          
          if (isActive) {
             // Dispatch event for magic line to pick up
             const event = new CustomEvent('navigation:active', { detail: { target: link } });
             document.dispatchEvent(event);
          }
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
}