import { initNavigation } from './modules/navigation.js';
import { initMagicLine } from './modules/magicLine.js';
import { initMotion } from './modules/motion.js';
import { initContactForm } from './modules/contactForm.js';

function init() {
  initNavigation();
  initMagicLine();
  initMotion();
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

document.addEventListener('projects:hydrated', () => {
  if (window.refreshMotionBehaviors) {
      window.refreshMotionBehaviors();
  }
});