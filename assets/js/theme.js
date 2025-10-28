(() => {
  const storageKey = 'mam-theme';
  const docEl = document.documentElement;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const switcher = document.querySelector('[data-theme-switcher]');
  if (!switcher) return;

  const buttons = Array.from(switcher.querySelectorAll('[data-theme-set]'));
  const announcer = switcher.querySelector('[data-theme-status]');
  const validModes = new Set(['light', 'dark', 'system']);

  function readStoredPreference() {
    try {
      const stored = localStorage.getItem(storageKey);
      return validModes.has(stored) ? stored : 'system';
    } catch (error) {
      return 'system';
    }
  }

  function persistPreference(mode) {
    try {
      localStorage.setItem(storageKey, mode);
    } catch (error) {
      /* no-op */
    }
  }

  function resolveTheme(mode) {
    if (mode === 'light' || mode === 'dark') return mode;
    return mediaQuery.matches ? 'dark' : 'light';
  }

  function announce(mode) {
    if (!announcer) return;
    const key = mode === 'system' ? 'statusSystem' : `status${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
    const message = announcer.dataset[key];
    if (message) {
      announcer.textContent = message;
    }
  }

  function syncButtons(mode) {
    buttons.forEach((button) => {
      const value = button.dataset.themeSet;
      const isActive = value === mode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function applyTheme(mode, { persist = true, announceChange = false } = {}) {
    const effectiveMode = validModes.has(mode) ? mode : 'system';
    const theme = resolveTheme(effectiveMode);
    docEl.setAttribute('data-theme', theme);
    docEl.dataset.themePreference = effectiveMode;
    syncButtons(effectiveMode);
    if (persist) {
      persistPreference(effectiveMode);
    }
    if (announceChange) {
      announce(effectiveMode);
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.themeSet || 'system';
      applyTheme(mode, { announceChange: true });
    });
  });

  mediaQuery.addEventListener('change', () => {
    if ((docEl.dataset.themePreference || 'system') === 'system') {
      applyTheme('system', { persist: false, announceChange: true });
    }
  });

  applyTheme(readStoredPreference(), { persist: false });
})();
