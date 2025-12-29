export function initMagicLine() {
  const doc = document;
  const navList = doc.querySelector('.site-nav__list');
  if (!navList) return;
  
  // Create line if not exists (though it is in HTML usually)
  let magicLine = navList.querySelector('.magic-line');
  if (!magicLine) {
      // If it was removed from HTML, we could add it back, but we assume it's there per css
      return;
  }

  const navLinks = Array.from(doc.querySelectorAll('.site-nav__link'));

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
  
  // Listen for intersection observer events from navigation.js
  document.addEventListener('navigation:active', (e) => {
      updateMagicLine(e.detail.target);
  });

  // Initial check
  const activeLink = navList.querySelector('.site-nav__link[data-active="true"]');
  if (activeLink) updateMagicLine(activeLink);
}