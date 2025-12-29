document.addEventListener('DOMContentLoaded', () => {
  const dynamicTextSpan = document.querySelector('.dynamic-text');
  const dynamicTextContainer = document.querySelector('.dynamic-text-container');

  if (!dynamicTextSpan || !dynamicTextContainer) return;

  // Reserve horizontal space based on the initial phrase so the hero layout
  // does not jump up/down while text is typed or deleted.
  const initialWidth = dynamicTextSpan.offsetWidth;
  if (initialWidth > 0) {
    dynamicTextContainer.style.minWidth = `${initialWidth}px`;
  }

  const phrases = {
    en: ['homologation.', 'braking systems.', 'chassis parts.'],
    fr: ["l'homologation.", 'le freinage.', 'le châssis.']
  };

  const lang = document.documentElement.lang || 'en';
  const currentPhrases = phrases[lang] || phrases.en;
  let phraseIndex = 0;

  const typingSpeed = 100;
  const deletingSpeed = 60;
  const pauseAfterTyping = 3000;
  const pauseAfterDeleting = 500;
  const underlineAnimationTime = 500;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = reduceMotionQuery.matches;
  let shouldAnimate = !prefersReducedMotion;
  let animationActive = false;

  const attachMediaQueryListener = (query, handler) => {
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', handler);
    } else if (typeof query.addListener === 'function') {
      query.addListener(handler);
    }
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const resetToStaticState = () => {
    phraseIndex = 0;
    dynamicTextSpan.textContent = currentPhrases[phraseIndex];
    dynamicTextSpan.classList.remove('is-underlined', 'is-retracting');
    dynamicTextContainer.classList.add('is-paused');
  };

  const type = async (phrase) => {
    dynamicTextContainer.classList.remove('is-paused');
    for (let i = 0; i <= phrase.length; i++) {
      if (!shouldAnimate) return;
      dynamicTextSpan.textContent = phrase.substring(0, i);
      await sleep(typingSpeed);
    }
  };

  const backspace = async () => {
    dynamicTextContainer.classList.remove('is-paused');
    const text = dynamicTextSpan.textContent;
    for (let i = text.length; i >= 0; i--) {
      if (!shouldAnimate) return;
      dynamicTextSpan.textContent = text.substring(0, i);
      await sleep(deletingSpeed);
    }
  };

  const animateOnce = async () => {
    if (!shouldAnimate) return;
    dynamicTextSpan.textContent = currentPhrases[phraseIndex];
    dynamicTextSpan.classList.remove('is-retracting');
    dynamicTextSpan.classList.add('is-underlined');
    dynamicTextContainer.classList.add('is-paused');
    await sleep(pauseAfterTyping);
    if (!shouldAnimate) return;
    dynamicTextSpan.classList.remove('is-underlined');
    dynamicTextSpan.classList.add('is-retracting');
    await sleep(underlineAnimationTime);
    if (!shouldAnimate) return;
    dynamicTextSpan.classList.remove('is-retracting');
    await backspace();
    if (!shouldAnimate) return;
    await sleep(pauseAfterDeleting);
    phraseIndex = (phraseIndex + 1) % currentPhrases.length;
    if (!shouldAnimate) return;
    await type(currentPhrases[phraseIndex]);
  };

  const startAnimation = () => {
    if (animationActive || !shouldAnimate) return;
    animationActive = true;
    const loop = async () => {
      while (shouldAnimate) {
        await animateOnce();
      }
      animationActive = false;
    };
    setTimeout(loop, 800);
  };

  attachMediaQueryListener(reduceMotionQuery, (event) => {
    prefersReducedMotion = event.matches;
    shouldAnimate = !prefersReducedMotion;
    if (prefersReducedMotion) {
      resetToStaticState();
    } else if (!animationActive) {
      resetToStaticState();
      startAnimation();
    }
  });

  if (prefersReducedMotion) {
    resetToStaticState();
    return;
  }

  startAnimation();
});
