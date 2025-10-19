const THEME_KEY = 'preferred-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function detectPreferredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function initThemeToggle() {
  const toggle = document.querySelector('.js-theme-toggle');
  if (!toggle) return;

  const syncLabel = theme => {
    toggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    toggle.querySelector('.js-theme-label').textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
  };

  let currentTheme = detectPreferredTheme();
  applyTheme(currentTheme);
  syncLabel(currentTheme);

  toggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    syncLabel(currentTheme);
  });

  const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
  const handleChange = event => {
    if (!localStorage.getItem(THEME_KEY)) {
      const next = event.matches ? 'light' : 'dark';
      applyTheme(next);
      syncLabel(next);
    }
  };
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleChange);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handleChange);
  }
}

function initReducedMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.dataset.reducedMotion = 'true';
  }
}

function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const update = () => {
    header.classList.toggle('is-compact', window.scrollY > 16);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initScrollSpy() {
  const navLinks = Array.from(document.querySelectorAll('[data-nav-target]'));
  if (!navLinks.length) return;
  const sections = navLinks
    .map(link => document.getElementById(link.dataset.navTarget))
    .filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = navLinks.find(item => item.dataset.navTarget === id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(item => item.setAttribute('data-active', 'false'));
          link.setAttribute('data-active', 'true');
        }
      });
    },
    {
      rootMargin: '-50% 0px -45% 0px',
      threshold: 0.25
    }
  );

  sections.forEach(section => observer.observe(section));
}

function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open', !expanded);
    if (!expanded) {
      nav.querySelector('.site-nav__link')?.focus();
    }
  });

  nav.addEventListener('click', event => {
    if (event.target.closest('.site-nav__link')) {
      closeNav();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeNav();
    }
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = form.querySelector('[data-status]');

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get('name')?.toString().trim() ?? '';
    const email = data.get('email')?.toString().trim() ?? '';
    const message = data.get('message')?.toString().trim() ?? '';

    const subject = encodeURIComponent(`Portfolio enquiry from ${name || 'website visitor'}`);
    const body = encodeURIComponent(
      `Hi Mohamed,%0D%0A%0D%0A${message || 'I would like to connect regarding your automotive programme leadership experience.'}%0D%0A%0D%0ARegards,%0D%0A${name}${
        email ? ` (%20${email}%20)` : ''
      }`
    );
    window.location.href = `mailto:hello@mohamedalimabrouki.com?subject=${subject}&body=${body}`;
    if (status) {
      status.textContent = 'Opening your email client…';
      status.setAttribute('role', 'status');
    }
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initReducedMotion();
  initStickyHeader();
  initScrollSpy();
  initMobileNav();
  initContactForm();
});
