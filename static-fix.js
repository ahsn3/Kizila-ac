/**
 * Static site fixes: hero slider, layer visibility, smooth scroll tuning.
 */
(function () {
  'use strict';

  /* Block parallax libs on static hosting */
  window.jarallax = function () {
    return { destroy: function () {}, onScroll: function () {} };
  };
  window.jarallaxElement = function () {};

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

  function fixHeroBackgrounds() {
    document.querySelectorAll('sr7-bg').forEach(function (bg) {
      bg.style.setProperty('display', 'block', 'important');
      bg.style.setProperty('visibility', 'visible', 'important');

      var inline = bg.getAttribute('style') || '';
      var match = inline.match(/background\s*:\s*url\(['"]?([^'")]+)['"]?\)/i);
      if (match && match[1]) {
        bg.style.setProperty('background-image', 'url("' + match[1] + '")', 'important');
        bg.style.setProperty('background-size', 'cover', 'important');
        bg.style.setProperty('background-position', 'center', 'important');
        bg.style.setProperty('background-repeat', 'no-repeat', 'important');
      }
    });
  }

  function disableLenisScroll() {
    if (window.lenisInstance && typeof window.lenisInstance.destroy === 'function') {
      window.lenisInstance.destroy();
      window.lenisInstance = null;
    }
    document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  function initScrollReveal() {
    var targets = document.querySelectorAll(
      '.elementor-invisible, .elementor-widget[data-settings*="animation"], .elementor-widget[data-settings*="_animation"]'
    );

    targets.forEach(function (el, index) {
      if (el.closest('#colophon') || el.closest('.elementor-location-header')) return;
      el.classList.remove('elementor-invisible', 'animated', 'animated-slow');
      el.style.animation = 'none';
      el.classList.add('kiz-fade-up');
      el.style.transitionDelay = Math.min(index * 0.04, 0.24) + 's';
    });

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.kiz-fade-up').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
    );

    document.querySelectorAll('.kiz-fade-up').forEach(function (el) {
      observer.observe(el);
    });
  }

  function disableJarallax() {
    document.querySelectorAll('[data-jarallax], [data-jarallax-element], .jarallax').forEach(function (el) {
      el.removeAttribute('data-jarallax');
      el.removeAttribute('data-jarallax-element');
      el.classList.remove('jarallax', 'jarallax-img');
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

  function disableMotionEffects() {
    document.querySelectorAll('.elementor-motion-effects-layer, .elementor-motion-effects-element').forEach(function (el) {
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('will-change', 'auto', 'important');
    });
    document.querySelectorAll('[data-settings*="motion_fx"]').forEach(function (el) {
      el.style.setProperty('transform', 'none', 'important');
    });
  }

  function siteRootPrefix() {
    var parts = window.location.pathname.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length && (parts[parts.length - 1] === 'index.html' || parts[parts.length - 1].indexOf('.') !== -1)) {
      parts.pop();
    }
    return parts.length ? '../'.repeat(parts.length) : './';
  }

  function fixFooter() {
    var footer = document.getElementById('colophon');
    if (!footer) return;

    var root = siteRootPrefix();

    footer.querySelectorAll('a[href*="unilancerlabs"]').forEach(function (link) {
      var title = link.querySelector('.ekit-heading--title');
      if (title) {
        title.textContent = title.textContent
          .replace(/\s*\.?\s*by\s*unilancerlabs\.com/gi, '')
          .replace(/\s*\|\s*$/g, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (!title.textContent) {
          title.textContent = '© 2026 Kızılağaç İnşaat · Tüm Hakları Saklıdır';
        }
      }
      var wrapper = link.closest('.ekit-heading');
      if (wrapper && link.parentNode) {
        while (link.firstChild) {
          wrapper.insertBefore(link.firstChild, link);
        }
        link.remove();
      }
    });

    footer.querySelectorAll('.elementor-element-48d6ff42 a[href="#"]').forEach(function (a) {
      a.setAttribute('href', root + 'index.html');
    });

    footer.querySelectorAll('.elementor-element-7ab684f3 a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('anasayfa') !== -1 || href.indexOf('kizilagacinsaat.com') !== -1) {
        a.setAttribute('href', root + 'index.html');
      }
    });

    document.querySelectorAll('#page > .footer-width-fixer').forEach(function (el) {
      el.remove();
    });
  }

  /* ---- SR7 path patches ---- */
  if (window.SR7 && SR7.E) {
    SR7.E.plugin_url = 'wp-content/plugins/revslider/';
    SR7.E.wp_plugin_url = 'wp-content/plugins/';
    SR7.E.ajaxurl = '';
    SR7.E.resturl = '';
  }

  function fixHeader() {
    document.querySelectorAll('.elementor-10968 .main-navigation .primary-navigation').forEach(function (nav) {
      nav.style.setProperty('display', 'block', 'important');
    });

    document.querySelectorAll('.elementor-10968 .main-navigation .menu').forEach(function (menu) {
      if (window.matchMedia('(min-width: 768px)').matches) {
        menu.style.setProperty('display', 'flex', 'important');
      }
    });
  }

  function init() {
    fixHeroBackgrounds();
    initAllHeroSliders();
    disableJarallax();
    disableMotionEffects();
    disableLenisScroll();
    initScrollReveal();
    fixHeader();
    fixFooter();
  }

  window.addEventListener('load', function () {
    disableLenisScroll();
    disableJarallax();
    disableMotionEffects();
    fixHeroBackgrounds();
    fixHeader();
    fixFooter();
  });

  window.addEventListener('scroll', function () {
    disableMotionEffects();
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
