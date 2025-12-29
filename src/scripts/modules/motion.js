export function initMotion() {
  const doc = document;
  const body = document.body;
  
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerFineQuery = window.matchMedia('(pointer: fine)');
  const supportsIntersectionObserver = 'IntersectionObserver' in window;
  
  let parallaxCleanup = null;
  let tiltCleanup = null;
  let revealObserver = null;
  let revealElements = Array.from(doc.querySelectorAll('[data-reveal]'));

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

  // Expose refresh for hydration events
  window.refreshMotionBehaviors = refreshMotionBehaviors;

  refreshMotionBehaviors();
}