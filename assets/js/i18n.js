(() => {
  const docEl = document.documentElement;
  const languageMapEl = document.getElementById('language-map');
  if (!languageMapEl) return;

  let languageMap = {};
  try {
    languageMap = JSON.parse(languageMapEl.textContent || '{}');
  } catch (error) {
    console.error('Unable to parse language map', error);
  }

  const pageKey = docEl.dataset.page || 'home';
  const buttons = Array.from(document.querySelectorAll('[data-lang-switch]'));
  const storageKey = 'preferredLanguage';

  function getStoredLanguage() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function setStoredLanguage(value) {
    try {
      localStorage.setItem(storageKey, value);
    } catch (error) {
      /* no-op */
    }
  }

  function detectLanguage() {
    const stored = getStoredLanguage();
    if (stored && (stored === 'en' || stored === 'fr')) {
      return stored;
    }
    const browser = navigator.language || navigator.userLanguage || 'en';
    return browser.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }

  function resolvePath(lang) {
    const entry = languageMap[pageKey] || languageMap.home;
    if (!entry) return null;
    return entry[lang] || entry.en || '/index.html';
  }

  function syncButtons(targetLang) {
    buttons.forEach((button) => {
      const isActive = button.dataset.langSwitch === targetLang;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function switchLanguage(targetLang, persist = true) {
    if (!targetLang || targetLang === docEl.lang) {
      if (persist) setStoredLanguage(docEl.lang);
      syncButtons(docEl.lang);
      return;
    }
    const destination = resolvePath(targetLang);
    if (!destination) {
      syncButtons(docEl.lang);
      return;
    }
    if (persist) setStoredLanguage(targetLang);
    if (window.location.pathname !== destination) {
      const hash = window.location.hash || '';
      window.location.href = `${destination}${hash}`;
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.langSwitch;
      switchLanguage(target);
    });
  });

  const preferred = detectLanguage();
  if (preferred !== docEl.lang) {
    const destination = resolvePath(preferred);
    if (destination && window.location.pathname !== destination) {
      setStoredLanguage(preferred);
      window.location.replace(destination + (window.location.hash || ''));
      return;
    }
  }

  syncButtons(docEl.lang);
})();
