document.addEventListener('DOMContentLoaded', () => {
  const supportsIntersectionObserver = 'IntersectionObserver' in window;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = reduceMotionQuery.matches;

  let statObserver = null;
  let timelineObserver = null;
  let statElements = [];
  const statTimers = new WeakMap();
  let timelineElement = null;
  let timelineItems = [];

  const attachMediaQueryListener = (query, handler) => {
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', handler);
    } else if (typeof query.addListener === 'function') {
      query.addListener(handler);
    }
  };

  const parseStat = (text = '') => {
    const trimmed = text.trim();
    const match = trimmed.match(/^(\d+)(.*)$/);
    if (!match) {
      return null;
    }
    return {
      value: Number(match[1]),
      suffix: match[2] || ''
    };
  };

  const stopStatAnimations = () => {
    statElements.forEach((element) => {
      const timerId = statTimers.get(element);
      if (timerId) {
        clearInterval(timerId);
        statTimers.delete(element);
      }
      const finalValue = element.dataset.statValue;
      const suffix = element.dataset.statSuffix || '';
      if (finalValue) {
        element.textContent = `${finalValue}${suffix}`;
      }
    });
    if (statObserver) {
      statObserver.disconnect();
      statObserver = null;
    }
  };

  const showTimelineImmediately = () => {
    if (!timelineElement) return;
    timelineElement.classList.add('is-drawing');
    timelineItems.forEach((item) => item.classList.add('is-visible'));
    if (timelineObserver) {
      timelineObserver.disconnect();
      timelineObserver = null;
    }
  };

  const animateCountUp = (element) => {
    const finalValue = Number(element.dataset.statValue);
    if (!Number.isFinite(finalValue) || finalValue <= 0) return;
    const suffix = element.dataset.statSuffix || '';
    const duration = 1500;
    const frameRate = 60;
    const totalFrames = Math.round((duration / 1000) * frameRate);
    let frame = 0;

    element.textContent = `0${suffix}`;
    const intervalId = setInterval(() => {
      frame += 1;
      const progress = frame / totalFrames;
      const currentVal = Math.round(finalValue * progress);
      element.textContent = `${currentVal}${suffix}`;
      if (frame >= totalFrames) {
        clearInterval(intervalId);
        statTimers.delete(element);
        element.textContent = `${finalValue}${suffix}`;
      }
    }, 1000 / frameRate);

    statTimers.set(element, intervalId);
  };

  const initStats = () => {
    const aboutSection = document.querySelector('#about');
    if (!aboutSection) return;
    const statNodes = Array.from(aboutSection.querySelectorAll('.stat__value'));
    statElements = statNodes
      .map((element) => {
        const parts = parseStat(element.textContent);
        if (!parts) return null;
        if (!Number.isFinite(parts.value)) return null;
        element.dataset.statValue = String(parts.value);
        element.dataset.statSuffix = parts.suffix;
        return element;
      })
      .filter(Boolean);

    if (!statElements.length) return;

    if (prefersReducedMotion || !supportsIntersectionObserver) {
      stopStatAnimations();
      return;
    }

    statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          statElements.forEach((element, index) => {
            setTimeout(() => animateCountUp(element), index * 120);
          });
          if (statObserver) {
            statObserver.disconnect();
            statObserver = null;
          }
        });
      },
      { threshold: 0.5 }
    );

    statObserver.observe(aboutSection);
  };

  const initTimeline = () => {
    timelineElement = document.querySelector('.timeline');
    if (!timelineElement) return;
    timelineItems = Array.from(timelineElement.querySelectorAll('.timeline__item'));
    if (!timelineItems.length) return;

    timelineElement.classList.add('timeline--animated');

    if (prefersReducedMotion || !supportsIntersectionObserver) {
      showTimelineImmediately();
      return;
    }

    timelineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          timelineElement.classList.add('is-drawing');
          timelineItems.forEach((item, index) => {
            setTimeout(() => item.classList.add('is-visible'), index * 160);
          });
          if (timelineObserver) {
            timelineObserver.disconnect();
            timelineObserver = null;
          }
        });
      },
      { threshold: 0.2 }
    );

    timelineObserver.observe(timelineElement);
  };

  attachMediaQueryListener(reduceMotionQuery, (event) => {
    prefersReducedMotion = event.matches;
    if (prefersReducedMotion) {
      stopStatAnimations();
      showTimelineImmediately();
    }
  });

  initStats();
  initTimeline();
});
