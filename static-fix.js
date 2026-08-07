/**
 * Static site fixes: hero slider, layer visibility, smooth scroll tuning.
 */
(function () {
  'use strict';

  var SLIDE_MS = 9000;
  var FADE_MS = 800;

  /* ---- Hero slider ---- */
  function slideHasContent(slide) {
    if (slide.querySelector('sr7-bg')) return true;
    if (slide.querySelector('[style*="background"]')) return true;
    if (slide.querySelector('sr7-txt, a.sr7-layer')) return true;
    return (slide.textContent || '').trim().length > 0;
  }

  function initHeroSlider(module) {
    var content = module.querySelector('sr7-content');
    if (!content) return;

    var allSlides = Array.prototype.slice.call(content.querySelectorAll('sr7-slide'));
    var slides = allSlides.filter(slideHasContent);
    allSlides.forEach(function (slide) {
      if (slides.indexOf(slide) === -1) slide.classList.add('sr7-static-empty');
    });
    if (slides.length === 0) return;

    var current = 0;
    var timer = null;
    var transitioning = false;
    var touchStartX = 0;

    var nav = document.createElement('div');
    nav.className = 'sr7-static-nav';
    nav.setAttribute('aria-label', 'Slider navigation');
    module.appendChild(nav);

    var bullets = slides.map(function (_, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sr7-static-bullet';
      btn.setAttribute('aria-label', 'Slide ' + (i + 1));
      btn.addEventListener('click', function () {
        goTo(i, true);
        restartAutoplay();
      });
      nav.appendChild(btn);
      return btn;
    });

    function updateBullets(index) {
      bullets.forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === index);
        btn.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    function resetTextMotion(slide) {
      var layers = slide.querySelectorAll('sr7-txt, a.sr7-layer');
      layers.forEach(function (el) {
        el.style.transition = 'none';
        void el.offsetWidth;
        el.style.transition = '';
      });
    }

    function showSlide(index) {
      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.classList.toggle('sr7-static-active', active);
        if (active) resetTextMotion(slide);
      });
      updateBullets(index);
    }

    function goTo(index, userTriggered) {
      if (transitioning && !userTriggered) return;
      if (index === current && !userTriggered) return;
      transitioning = true;
      current = (index + slides.length) % slides.length;
      showSlide(current);
      window.setTimeout(function () {
        transitioning = false;
      }, FADE_MS);
    }

    function next() {
      goTo(current + 1, false);
    }

    function restartAutoplay() {
      if (timer) window.clearInterval(timer);
      if (slides.length < 2) return;
      timer = window.setInterval(next, SLIDE_MS);
    }

    module.addEventListener(
      'touchstart',
      function (e) {
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );

    module.addEventListener(
      'touchend',
      function (e) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 40) return;
        if (dx < 0) goTo(current + 1, true);
        else goTo(current - 1, true);
        restartAutoplay();
      },
      { passive: true }
    );

    showSlide(0);
    restartAutoplay();
  }

  function initAllHeroSliders() {
    document.querySelectorAll('sr7-module').forEach(initHeroSlider);
  }

  function disableJarallax() {
    document.querySelectorAll('[data-jarallax], [data-jarallax-element], .jarallax').forEach(function (el) {
      el.removeAttribute('data-jarallax');
      el.removeAttribute('data-jarallax-element');
      el.style.transform = 'none';
    });
    if (window.jarallax && typeof window.jarallax === 'function') {
      try {
        window.jarallax(document.querySelectorAll('.jarallax'), 'destroy');
      } catch (e) {
        /* ignore */
      }
    }
  }

  /* ---- SR7 path patches ---- */
  if (window.SR7 && SR7.E) {
    SR7.E.plugin_url = 'wp-content/plugins/revslider/';
    SR7.E.wp_plugin_url = 'wp-content/plugins/';
    SR7.E.ajaxurl = '';
    SR7.E.resturl = '';
  }

  function init() {
    initAllHeroSliders();
    disableJarallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
