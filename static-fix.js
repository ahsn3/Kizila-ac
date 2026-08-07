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

  var HERO_BG = {
    living: 'hero-background/hero-living.png',
    kitchen: 'hero-background/hero-kitchen.png',
    bedroom: 'hero-background/hero-bedroom.png'
  };

  var SERVICE_PHOTOS = {
    'mimarlik-hizmetleri': 'architecture-services.png',
    'architecture-services': 'architecture-services.png',
    'ic-mimarlik-dekorasyon': 'interior-architecture-decoration.png',
    'interior-architecture-decoration': 'interior-architecture-decoration.png',
    'uygulama-tadilat': 'application-renovation.png',
    'application-renovation': 'application-renovation.png',
    'proje-yonetimi-danismanlik': 'project-management-consulting.png',
    'project-management-consultancy': 'project-management-consulting.png',
    'ucretsiz-kesif': 'free-discovery.png',
    'free-exploration': 'free-discovery.png',
    'cephe-dis-mekan-tasarimi': 'facade-exterior-design.png',
    'facade-exterior-design': 'facade-exterior-design.png'
  };

  var SERVICE_SLUG_ORDER_TR = [
    'mimarlik-hizmetleri',
    'ic-mimarlik-dekorasyon',
    'uygulama-tadilat',
    'proje-yonetimi-danismanlik',
    'ucretsiz-kesif',
    'cephe-dis-mekan-tasarimi'
  ];

  var SERVICE_SLUG_ORDER_EN = [
    'architecture-services',
    'interior-architecture-decoration',
    'application-renovation',
    'project-management-consultancy',
    'free-exploration',
    'facade-exterior-design'
  ];

  var LEGACY_SERVICE_IMAGES = {
    'Adsiz-tasarim-3.png': 'architecture-services.png',
    'Adsiz-tasarim-4.png': 'interior-architecture-decoration.png',
    'Adsiz-tasarim-2.png': 'project-management-consulting.png',
    'Adsiz-tasarim-5.png': 'free-discovery.png',
    'Adsiz-tasarim-6.png': 'facade-exterior-design.png',
    'Adsiz-tasarim.png': 'application-renovation.png'
  };

  function servicePhotoUrl(slug) {
    var file = SERVICE_PHOTOS[slug];
    if (!file) return '';
    return siteRootPrefix() + 'services-photos/' + file;
  }

  function serviceSlugFromHref(href) {
    if (!href) return '';
    var match = href.match(/service\/([^/?#]+)/);
    return match ? match[1] : '';
  }

  function applyServicePhotoToImg(img, slug) {
    var url = servicePhotoUrl(slug);
    if (!url || !img) return;
    img.setAttribute('src', url);
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.loading = 'lazy';
    img.decoding = 'async';
  }

  function applyServicePhotos() {
    var isEn = (window.location.pathname || '').indexOf('/en/') !== -1;
    var order = isEn ? SERVICE_SLUG_ORDER_EN : SERVICE_SLUG_ORDER_TR;
    var root = siteRootPrefix();
    var pathSlug = serviceSlugFromHref(window.location.pathname);

    document.querySelectorAll('a[href*="service/"]').forEach(function (a) {
      var slug = serviceSlugFromHref(a.getAttribute('href'));
      if (!SERVICE_PHOTOS[slug]) return;

      var img = a.querySelector('img');
      if (img) {
        applyServicePhotoToImg(img, slug);
        return;
      }

      var block = a.closest('.service-block, .antra-item.service, li.service');
      if (block) {
        img = block.querySelector('.service-image img, .post-thumbnail img');
        if (img) applyServicePhotoToImg(img, slug);
      }
    });

    if (SERVICE_PHOTOS[pathSlug]) {
      document.querySelectorAll('.elementor-post-thumbnail img').forEach(function (img) {
        applyServicePhotoToImg(img, pathSlug);
      });
    }

    document
      .querySelectorAll('.elementor-service-style-accordion .antra-item.service, .hizmetler .antra-item.service')
      .forEach(function (item, index) {
        var slug = order[index];
        if (!slug) return;

        var img = item.querySelector('.service-image img, .post-thumbnail img');
        if (img) applyServicePhotoToImg(img, slug);

        var link = item.querySelector('.service-image a, .post-thumbnail a');
        if (link) {
          var href = link.getAttribute('href') || '';
          if (!href || href === '#') {
            link.setAttribute('href', root + (isEn ? 'en/' : '') + 'service/' + slug + '/index.html');
          }
        }
      });

    document.querySelectorAll('.service-image img, .antra-item.service img, .post-thumbnail.service-image img').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (src.indexOf('services-photos/') !== -1) return;

      Object.keys(LEGACY_SERVICE_IMAGES).forEach(function (legacy) {
        if (src.indexOf(legacy) === -1) return;
        img.setAttribute('src', root + 'services-photos/' + LEGACY_SERVICE_IMAGES[legacy]);
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
      });

      if (/placeholder\.jpg/i.test(src)) {
        var card = img.closest('.antra-item.service, .service-block');
        if (!card) return;
        var items = Array.prototype.slice.call(
          document.querySelectorAll('.elementor-service-style-accordion .antra-item.service')
        );
        var idx = items.indexOf(card);
        if (idx >= 0 && order[idx]) applyServicePhotoToImg(img, order[idx]);
      }
    });
  }

  function heroBgUrl(key) {
    return siteRootPrefix() + HERO_BG[key];
  }

  function setBgImage(el, url) {
    if (!el || !url) return;
    el.style.setProperty('background-image', 'url("' + url + '")', 'important');
    el.style.setProperty('background-size', 'cover', 'important');
    el.style.setProperty('background-position', 'center', 'important');
    el.style.setProperty('background-repeat', 'no-repeat', 'important');
  }

  function applyModernHeroBackgrounds() {
    if (!document.body.classList.contains('home')) return;

    var map = {
      'SR7_1_1-3-12': 'living',
      'SR7_1_1-1-15': 'kitchen',
      'SR7_1_1-6-17': 'bedroom'
    };

    Object.keys(map).forEach(function (id) {
      var bg = document.getElementById(id);
      if (bg) {
        setBgImage(bg, heroBgUrl(map[id]));
        bg.querySelectorAll('img').forEach(function (img) {
          img.style.setProperty('display', 'none', 'important');
        });
      }
    });
  }

  function injectHomeHeroCtas() {
    if (!document.body.classList.contains('home')) return;
    var module = document.getElementById('SR7_1_1');
    if (!module || module.querySelector('.kiz-hero-actions')) return;

    var slide = document.getElementById('SR7_1_1-3');
    if (!slide) return;

    var root = siteRootPrefix();
    var isEn = (window.location.pathname || '').indexOf('/en/') !== -1;
    var wrap = document.createElement('div');
    wrap.className = 'kiz-hero-actions';

    var primary = document.createElement('a');
    primary.className = 'kiz-hero-cta kiz-hero-cta--primary';
    primary.href = root + (isEn ? 'projects/index.html' : 'projeler/index.html');
    primary.textContent = isEn ? 'Explore Our Projects' : 'Projelerimizi İnceleyin';

    var ghost = document.createElement('a');
    ghost.className = 'kiz-hero-cta kiz-hero-cta--ghost';
    ghost.href = root + (isEn ? 'contact/index.html' : 'iletisim/index.html');
    ghost.textContent = isEn ? 'Contact Us' : 'Bize Ulaşın';

    wrap.appendChild(primary);
    wrap.appendChild(ghost);
    slide.appendChild(wrap);
  }

  function forceHeroTextWhite() {
    if (!document.body.classList.contains('home')) return;
    var module = document.getElementById('SR7_1_1');
    if (!module) return;

    var content = module.querySelector('sr7-content');
    if (content) {
      content.style.setProperty('z-index', '5', 'important');
    }

    module.querySelectorAll('sr7-txt, sr7-txt *, sr7-slide a.sr7-layer').forEach(function (el) {
      el.style.setProperty('color', '#ffffff', 'important');
      el.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('mix-blend-mode', 'normal', 'important');
    });

    module.querySelectorAll('#SR7_1_1-3-2, #SR7_1_1-3-3').forEach(function (el) {
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('color', '#ffffff', 'important');
      el.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
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

    document.querySelectorAll('.loop-card, .elementor-widget-loop-grid .e-loop-item').forEach(function (el, index) {
      if (el.closest('#colophon') || el.closest('.elementor-location-header')) return;
      if (el.classList.contains('kiz-fade-up')) return;
      el.classList.add('kiz-fade-up');
      el.style.transitionDelay = Math.min((index % 8) * 0.06, 0.36) + 's';
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

  function initHeaderScroll() {
    var ticking = false;

    function updateScrollState() {
      ticking = false;
      var scrolled = window.scrollY > 16;
      document.body.classList.toggle('kiz-scrolled', scrolled);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateScrollState);
      }
    }

    updateScrollState();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href === '#') return;
      if (link.classList.contains('menu-mobile-nav-button') || link.classList.contains('mobile-nav-close')) {
        return;
      }

      link.addEventListener('click', function (e) {
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function initMobileMenu() {
    var html = document.documentElement;
    var isEn = (window.location.pathname || '').indexOf('/en/') !== -1;
    var root = siteRootPrefix();

    if (window.jQuery) {
      window.jQuery('.menu-mobile-nav-button, .antra-overlay, .mobile-nav-close').off('click');
      window.jQuery('.antra-mobile-nav .dropdown-toggle').off('click');
    }

    document.querySelectorAll('.antra-mobile-nav .dropdown-toggle').forEach(function (el) {
      el.remove();
    });

    document.querySelectorAll('.handheld-navigation .menu-item-has-children > a[href="#"]').forEach(function (a) {
      var firstSub = a.parentElement.querySelector('.sub-menu > li > a[href]');
      if (firstSub && firstSub.getAttribute('href') && firstSub.getAttribute('href') !== '#') {
        a.setAttribute('href', firstSub.getAttribute('href'));
        return;
      }
      a.setAttribute('href', root + (isEn ? 'en/hizmetler/index.html' : 'hizmetler/index.html'));
    });

    function closeMobileNav() {
      html.classList.remove('mobile-nav-active');
      document.querySelectorAll('.handheld-navigation .kiz-mobile-submenu-open').forEach(function (li) {
        li.classList.remove('kiz-mobile-submenu-open');
        var btn = li.querySelector('.kiz-mobile-submenu-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }

    function toggleMobileNav() {
      html.classList.toggle('mobile-nav-active');
    }

    document.querySelectorAll('.menu-mobile-nav-button').forEach(function (btn) {
      if (btn.dataset.kizMobileBound) return;
      btn.dataset.kizMobileBound = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggleMobileNav();
      });
    });

    document.querySelectorAll('.antra-overlay, .mobile-nav-close').forEach(function (el) {
      if (el.dataset.kizMobileBound) return;
      el.dataset.kizMobileBound = '1';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        closeMobileNav();
      });
    });

    document.querySelectorAll('.handheld-navigation .menu-item-has-children').forEach(function (li) {
      li.querySelectorAll('.dropdown-toggle').forEach(function (el) {
        el.remove();
      });

      var toggle = li.querySelector('.kiz-mobile-submenu-toggle');
      if (!toggle) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'kiz-mobile-submenu-toggle';
        toggle.setAttribute('aria-label', isEn ? 'Toggle submenu' : 'Alt menüyü aç');
        toggle.setAttribute('aria-expanded', 'false');
        li.appendChild(toggle);
      }

      if (toggle.dataset.kizSubBound) return;
      toggle.dataset.kizSubBound = '1';

      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = li.classList.toggle('kiz-mobile-submenu-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    if (!document.documentElement.dataset.kizMobileResizeBound) {
      document.documentElement.dataset.kizMobileResizeBound = '1';
      window.addEventListener('resize', function () {
        if (window.matchMedia('(min-width: 768px)').matches) {
          html.classList.remove('mobile-nav-active');
        }
      });
    }
  }

  function initDesktopDropdowns() {
    var nav = document.querySelector('.elementor-10968 .main-navigation .menu');
    if (!nav) return;

    var CLOSE_DELAY = 280;
    var items = nav.querySelectorAll(':scope > li.menu-item-has-children');
    if (!items.length) return;

    items.forEach(function (li) {
      if (li.dataset.kizDropdownBound) return;
      li.dataset.kizDropdownBound = '1';

      var closeTimer = null;

      function openSubmenu() {
        if (closeTimer) {
          window.clearTimeout(closeTimer);
          closeTimer = null;
        }
        li.classList.add('kiz-submenu-open');
      }

      function scheduleClose() {
        if (closeTimer) window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(function () {
          li.classList.remove('kiz-submenu-open');
          closeTimer = null;
        }, CLOSE_DELAY);
      }

      li.addEventListener('mouseenter', openSubmenu);
      li.addEventListener('mouseleave', scheduleClose);
      li.addEventListener('focusin', openSubmenu);
      li.addEventListener('focusout', function (e) {
        if (!li.contains(e.relatedTarget)) {
          scheduleClose();
        }
      });
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

  function disableStickySpacers() {
    document.querySelectorAll('.ekit-sticky-spacer').forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll('.ekit-sticky--top').forEach(function (el) {
      if (document.body.classList.contains('home') && el.closest('.elementor-location-header')) {
        el.classList.remove('ekit-sticky-active', 'ekit-sticky-effects');
        return;
      }
      el.classList.remove('ekit-sticky-active', 'ekit-sticky-effects');
      el.style.setProperty('position', 'relative', 'important');
      el.style.setProperty('top', 'auto', 'important');
      el.style.setProperty('bottom', 'auto', 'important');
      el.style.setProperty('width', 'auto', 'important');
    });
  }

  function syncHeaderHeight() {
    var isMobile = window.matchMedia('(max-width: 767px)').matches;
    var bar = isMobile
      ? document.querySelector('.elementor-element-b145162:not([style*="display: none"])')
      : document.querySelector('.elementor-element-bf83e51:not([style*="display: none"])');

    if (!bar) return;

    var style = getComputedStyle(bar);
    if (style.display === 'none' || style.visibility === 'hidden') {
      bar = document.querySelector('.elementor-element-b145162, .elementor-element-bf83e51');
    }
    if (!bar) return;

    var height = bar.getBoundingClientRect().height;
    if (height > 32 && height < 100) {
      document.documentElement.style.setProperty('--kiz-header-h', Math.round(height) + 'px');
    }
  }

  function applySiteHeader() {
    var header = document.querySelector('.elementor-location-header');
    if (!header) return;

    header.style.setProperty('position', 'fixed', 'important');
    header.style.setProperty('top', '0', 'important');
    header.style.setProperty('left', '0', 'important');
    header.style.setProperty('right', '0', 'important');
    header.style.setProperty('width', '100%', 'important');
    header.style.setProperty('z-index', '1000', 'important');
    header.style.setProperty('margin', '0', 'important');
    header.style.setProperty('padding', '0', 'important');
    header.style.setProperty('height', 'auto', 'important');
    header.style.setProperty('min-height', '0', 'important');

    ['bf83e51', 'b145162'].forEach(function (id) {
      var els = header.querySelectorAll('.elementor-element-' + id);
      els.forEach(function (el, index) {
        if (index > 0) {
          el.remove();
          return;
        }
        el.style.setProperty('position', 'relative', 'important');
        el.style.setProperty('top', 'auto', 'important');
        el.style.setProperty('left', 'auto', 'important');
        el.style.setProperty('right', 'auto', 'important');
        el.style.setProperty('width', '100%', 'important');
        el.style.setProperty('margin', '0', 'important');
      });
    });

    var content = document.querySelector('#content.site-content');
    if (content) {
      content.style.setProperty('padding-top', 'var(--kiz-header-h)', 'important');
      content.style.setProperty('margin-top', '0', 'important');
    }

    syncHeaderHeight();
  }

  function fixHomeHeader() {
    applySiteHeader();
  }

  function fixPageScroll() {
    document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
    document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
    document.documentElement.style.setProperty('overflow-y', 'scroll', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('overflow-x', 'hidden', 'important');
    document.body.style.setProperty('overflow-y', 'visible', 'important');
    document.body.style.setProperty('height', 'auto', 'important');

    var scrollRoots = [
      '#page',
      '#content',
      '.site-content',
      '#content .col-full',
      '#primary',
      '.site-main',
      '.entry-content',
      '.elementor-page'
    ];

    scrollRoots.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        if (document.body.classList.contains('home') && el.matches('.col-full, [data-elementor-type="wp-page"], .elementor-page')) {
          return;
        }
        el.style.setProperty('overflow', 'visible', 'important');
        el.style.setProperty('max-height', 'none', 'important');
        el.style.setProperty('height', 'auto', 'important');
      });
    });

    if (document.body.classList.contains('home')) {
      fixHomeFullBleed();
    }

    document.querySelectorAll('.elementor-widget-antra-services-accordion .elementor-widget-container').forEach(function (el) {
      el.style.setProperty('height', 'auto', 'important');
      el.style.setProperty('max-height', 'none', 'important');
      el.style.setProperty('overflow', 'visible', 'important');
    });

    disableStickySpacers();
  }

  function fixHomeFullBleed() {
    document.querySelectorAll('.col-full').forEach(function (el) {
      el.style.setProperty('max-width', 'none', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('margin', '0', 'important');
      el.style.setProperty('padding', '0', 'important');
    });

    document.querySelectorAll('.col-full [data-elementor-type="wp-page"], .col-full .elementor-page').forEach(function (el) {
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', 'none', 'important');
      el.style.setProperty('margin-left', '0', 'important');
      el.style.setProperty('margin-right', '0', 'important');
      el.style.setProperty('transform', 'none', 'important');
    });

    document.querySelectorAll('sr7-module, .wp-block-themepunch-revslider, .elementor-widget-slider_revolution .elementor-widget-container').forEach(function (el) {
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', 'none', 'important');
      el.style.setProperty('margin-left', '0', 'important');
      el.style.setProperty('margin-right', '0', 'important');
    });
  }

  function disableMotionEffects() {
    document.querySelectorAll('.elementor-motion-effects-layer, .elementor-motion-effects-element').forEach(function (el) {
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('will-change', 'auto', 'important');
    });
    document.querySelectorAll('[data-settings*="motion_fx"]').forEach(function (el) {
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('animation', 'none', 'important');
    });
    document.querySelectorAll('.kiz-page-hero, .kiz-page-hero *').forEach(function (el) {
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('animation', 'none', 'important');
      el.style.setProperty('will-change', 'auto', 'important');
    });
  }

  function siteRootPrefix() {
    var parts = window.location.pathname.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length && (parts[parts.length - 1] === 'index.html' || parts[parts.length - 1].indexOf('.') !== -1)) {
      parts.pop();
    }
    return parts.length ? '../'.repeat(parts.length) : './';
  }

  function homePageUrl() {
    var root = siteRootPrefix();
    var isEn = (window.location.pathname || '').indexOf('/en/') !== -1;
    return root + (isEn ? 'en/index.html' : 'index.html');
  }

  function fixLogoLinks() {
    var home = homePageUrl();

    document.querySelectorAll(
      '.elementor-element-9c49ce4 a, .elementor-element-e1771f2 a, .elementor-element-7ab684f3 a'
    ).forEach(function (a) {
      a.setAttribute('href', home);
      a.removeAttribute('target');
    });

    document.querySelectorAll('.elementor-location-header a, #colophon a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var img = a.querySelector('img');
      var isLogo = img && (
        (img.getAttribute('src') || '').indexOf('Adsiz-200') !== -1 ||
        img.classList.contains('wp-image-11877')
      );
      if (isLogo || /kizilagacinsaat\.com/i.test(href)) {
        a.setAttribute('href', home);
        a.removeAttribute('target');
      }
    });
  }

  function injectFooterInstagram() {
    var footer = document.getElementById('colophon');
    if (!footer) return;

    var source = footer.querySelector('.elementor-social-icon-instagram');
    if (!source) return;

    var href = source.getAttribute('href') || 'https://www.instagram.com/kizilagacinsaat/';
    var logoCol = footer.querySelector('.elementor-element-52f1016f');

    if (logoCol && !logoCol.querySelector('.kiz-footer-instagram')) {
      var mainLink = document.createElement('a');
      mainLink.className = 'kiz-footer-instagram';
      mainLink.href = href;
      mainLink.target = '_blank';
      mainLink.rel = 'noopener noreferrer';
      mainLink.setAttribute('aria-label', 'Instagram');
      mainLink.innerHTML =
        '<svg viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>' +
        '<span>Instagram</span>';
      logoCol.appendChild(mainLink);
    }

    var bottomBar = footer.querySelector('.elementor-element-74819730 .e-con-inner');
    if (bottomBar) {
      bottomBar.style.setProperty('display', 'flex', 'important');
      bottomBar.style.setProperty('flex-direction', 'row', 'important');
      bottomBar.style.setProperty('align-items', 'center', 'important');
      bottomBar.style.setProperty('justify-content', 'center', 'important');
      bottomBar.style.setProperty('width', '100%', 'important');
    }
  }

  function fixWhatsAppButton() {
    document.querySelectorAll('.wa__btn_popup_txt, .wa__btn_txt, .wa__btn_title').forEach(function (el) {
      el.remove();
    });
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
      a.setAttribute('href', homePageUrl());
    });

    footer.querySelectorAll('.elementor-element-1ed1b81d a.__cf_email__').forEach(function (a) {
      a.setAttribute('href', 'mailto:info@kizilagacinsaat.com');
      a.textContent = 'info@kizilagacinsaat.com';
    });

    footer.querySelectorAll('.elementor-element-7ab684f3 a').forEach(function (a) {
      a.setAttribute('href', homePageUrl());
      a.removeAttribute('target');
    });

    footer.querySelectorAll('.elementor-element-7ab684f3 img').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (src.indexOf('wp-content/') !== -1 || src.indexOf('../wp-content/') !== -1) {
        img.setAttribute('src', root + src.replace(/^(\.\.\/)+/, ''));
      }
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.loading = 'eager';
      img.style.setProperty('opacity', '1', 'important');
      img.style.setProperty('visibility', 'visible', 'important');
    });

    document.querySelectorAll('#page > .footer-width-fixer').forEach(function (el) {
      el.remove();
    });

    footer.querySelectorAll('.elementskit-infobox, .ekit-wid-con, .elementor-widget-container, .elementskit-box-header, .elementskit-info-box-icon').forEach(function (el) {
      el.style.setProperty('background', 'transparent', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
    });

    injectFooterInstagram();
    fixLogoLinks();

    var showFooterCols = window.matchMedia('(min-width: 768px)').matches;
    footer.querySelectorAll('.elementor-element-48d6ff42, .elementor-element-1ed1b81d').forEach(function (col) {
      if (showFooterCols) {
        col.style.setProperty('display', 'flex', 'important');
        col.style.setProperty('visibility', 'visible', 'important');
      } else {
        col.style.removeProperty('display');
        col.style.removeProperty('visibility');
      }
    });
  }

  function fixMobileHeader() {
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    var bar = document.querySelector('.elementor-element-b145162:not([style*="display: none"])');
    if (!bar) return;

    ['c3fba59', '66dfbc8'].forEach(function (id) {
      var el = bar.querySelector('.elementor-element-' + id);
      if (!el) return;
      el.style.setProperty('padding-top', '0', 'important');
      el.style.setProperty('padding-bottom', '0', 'important');
    });

    var right = bar.querySelector('.elementor-element-66dfbc8');
    if (right) {
      right.style.setProperty('display', 'flex', 'important');
      right.style.setProperty('flex-direction', 'row', 'important');
      right.style.setProperty('align-items', 'center', 'important');
      right.style.setProperty('justify-content', 'flex-end', 'important');
      right.style.setProperty('gap', '10px', 'important');
    }

    if (bar.offsetHeight > 32) {
      syncHeaderHeight();
    }

    fixLogoLinks();

    var root = siteRootPrefix();
    bar.querySelectorAll('.elementor-element-e1771f2 img').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (src.indexOf('wp-content/') !== -1 || src.indexOf('../wp-content/') !== -1) {
        img.setAttribute('src', root + src.replace(/^(\.\.\/)+/, ''));
      }
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
    });
  }

  /* ---- SR7 path patches ---- */
  if (window.SR7 && SR7.E) {
    SR7.E.plugin_url = 'wp-content/plugins/revslider/';
    SR7.E.wp_plugin_url = 'wp-content/plugins/';
    SR7.E.ajaxurl = '';
    SR7.E.resturl = '';
  }

  function fixInnerPageHeroes() {
    if (document.body.classList.contains('home')) return;

    var root = siteRootPrefix();
    syncHeaderHeight();

    var first = document.querySelector('#content .entry-content > .elementor > .e-con.e-parent');
    if (!first) return;

    first.style.setProperty('margin-top', '0', 'important');

    function rewriteBg(el) {
      var bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return false;
      if (/kizilagacinsaat\.com/i.test(bg)) {
        el.style.backgroundImage = bg.replace(/https?:\/\/kizilagacinsaat\.com\//gi, root);
      }
      el.style.backgroundAttachment = 'scroll';
      el.style.transform = 'none';
      el.style.willChange = 'auto';
      return /url\(/i.test(getComputedStyle(el).backgroundImage);
    }

    var hasBg = rewriteBg(first);
    if (!hasBg) {
      var layer = first.querySelector('.elementor-motion-effects-layer');
      if (layer) hasBg = rewriteBg(layer);
    }

    if (hasBg) {
      first.classList.add('kiz-page-hero');
      first.classList.remove('kiz-page-hero-solid');
    } else {
      first.classList.add('kiz-page-hero-solid');
      first.classList.remove('kiz-page-hero');
    }

    document.querySelectorAll('#content .e-con.e-parent').forEach(function (el, index) {
      if (index === 0) return;
      var mt = parseInt(getComputedStyle(el).marginTop, 10);
      if (mt >= 60) {
        el.style.setProperty('margin-top', '0', 'important');
      }
      rewriteBg(el);
      var layer = el.querySelector('.elementor-motion-effects-layer');
      if (layer) rewriteBg(layer);
    });
  }

  function fixHeader() {
    fixLogoLinks();

    document.querySelectorAll('.elementor-10968 .main-navigation .primary-navigation').forEach(function (nav) {
      nav.style.setProperty('display', 'block', 'important');
    });

    document.querySelectorAll('.elementor-10968 .main-navigation .menu').forEach(function (menu) {
      if (window.matchMedia('(min-width: 768px)').matches) {
        menu.style.setProperty('display', 'flex', 'important');
      }
    });
  }

  function removeScrollToTop() {
    document.querySelectorAll('.scrollup, .hfe-scroll-to-top-wrap').forEach(function (el) {
      el.remove();
    });
  }

  var PROJECT_GRID_STORAGE_KEY = 'kiz-project-grid-cols';

  function isProjectGridMobile() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function getSavedProjectGridCols() {
    try {
      return localStorage.getItem(PROJECT_GRID_STORAGE_KEY) === '2' ? '2' : '1';
    } catch (e) {
      return '1';
    }
  }

  function setProjectGridCols(gridWidget, cols) {
    gridWidget.classList.toggle('kiz-grid-cols-2', cols === '2');

    var bar = gridWidget.previousElementSibling;
    if (!bar || !bar.classList.contains('kiz-grid-toggle')) return;

    bar.querySelectorAll('.kiz-grid-toggle-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-cols') === cols;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function syncProjectGridToggle() {
    var mobile = isProjectGridMobile();
    var cols = getSavedProjectGridCols();

    document.querySelectorAll('.elementor-widget-loop-grid').forEach(function (gridWidget) {
      if (!gridWidget.querySelector('.loop-card')) return;

      var bar = gridWidget.previousElementSibling;
      if (bar && bar.classList.contains('kiz-grid-toggle')) {
        bar.style.display = mobile ? 'flex' : 'none';
      }

      if (!mobile) {
        gridWidget.classList.remove('kiz-grid-cols-2');
        return;
      }

      setProjectGridCols(gridWidget, cols);
    });
  }

  function initProjectGridToggle() {
    var isEn = (window.location.pathname || '').indexOf('/en/') !== -1;
    var labels = {
      group: isEn ? 'Project grid layout' : 'Proje görünümü',
      one: isEn ? '1 per row' : '1\'li',
      two: isEn ? '2 per row' : '2\'li'
    };

    document.querySelectorAll('.elementor-widget-loop-grid').forEach(function (gridWidget) {
      if (!gridWidget.querySelector('.loop-card')) return;
      if (gridWidget.dataset.kizGridToggleBound) return;
      gridWidget.dataset.kizGridToggleBound = '1';

      var bar = document.createElement('div');
      bar.className = 'kiz-grid-toggle';
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', labels.group);

      var btn1 = document.createElement('button');
      btn1.type = 'button';
      btn1.className = 'kiz-grid-toggle-btn is-active';
      btn1.setAttribute('data-cols', '1');
      btn1.setAttribute('aria-pressed', 'true');
      btn1.textContent = labels.one;

      var btn2 = document.createElement('button');
      btn2.type = 'button';
      btn2.className = 'kiz-grid-toggle-btn';
      btn2.setAttribute('data-cols', '2');
      btn2.setAttribute('aria-pressed', 'false');
      btn2.textContent = labels.two;

      bar.appendChild(btn1);
      bar.appendChild(btn2);

      var parent = gridWidget.parentElement;
      var filter = parent ? parent.querySelector('.elementor-widget-taxonomy-filter') : null;
      if (filter && filter.parentElement === parent) {
        parent.insertBefore(bar, gridWidget);
      } else {
        gridWidget.parentElement.insertBefore(bar, gridWidget);
      }

      function applyCols(cols) {
        try {
          localStorage.setItem(PROJECT_GRID_STORAGE_KEY, cols);
        } catch (e) {
          /* ignore */
        }
        document.querySelectorAll('.elementor-widget-loop-grid').forEach(function (widget) {
          if (!widget.querySelector('.loop-card')) return;
          setProjectGridCols(widget, cols);
        });
      }

      btn1.addEventListener('click', function () {
        applyCols('1');
      });

      btn2.addEventListener('click', function () {
        applyCols('2');
      });
    });

    syncProjectGridToggle();
  }

  var pageRevealed = false;

  function revealPage() {
    if (pageRevealed) return;
    pageRevealed = true;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.add('kiz-ready');
      });
    });
  }

  function initPageReveal() {
    window.setTimeout(revealPage, 2200);
  }

  function init() {
    disableStickySpacers();
    applySiteHeader();
    fixPageScroll();
    fixHeroBackgrounds();
    applyModernHeroBackgrounds();
    applyServicePhotos();
    injectHomeHeroCtas();
    forceHeroTextWhite();
    initAllHeroSliders();
    disableJarallax();
    disableMotionEffects();
    disableLenisScroll();
    initScrollReveal();
    initHeaderScroll();
    initSmoothAnchors();
    initMobileMenu();
    initDesktopDropdowns();
    initProjectGridToggle();
    fixHeader();
    fixInnerPageHeroes();
    fixFooter();
    fixWhatsAppButton();
    fixMobileHeader();
    removeScrollToTop();
    revealPage();
  }

  initPageReveal();

  window.addEventListener('resize', function () {
    applySiteHeader();
    fixMobileHeader();
    fixFooter();
    initDesktopDropdowns();
    syncProjectGridToggle();
  });

  window.addEventListener('load', function () {
    disableStickySpacers();
    applySiteHeader();
    fixPageScroll();
    disableLenisScroll();
    disableJarallax();
    disableMotionEffects();
    fixHeroBackgrounds();
    applyModernHeroBackgrounds();
    applyServicePhotos();
    injectHomeHeroCtas();
    forceHeroTextWhite();
    fixHeader();
    initMobileMenu();
    initDesktopDropdowns();
    initProjectGridToggle();
    fixInnerPageHeroes();
    fixFooter();
    fixWhatsAppButton();
    fixMobileHeader();
    removeScrollToTop();
    revealPage();
    window.setTimeout(initMobileMenu, 300);
    window.setTimeout(initDesktopDropdowns, 300);
    window.setTimeout(fixPageScroll, 250);
    window.setTimeout(applySiteHeader, 250);
    window.setTimeout(fixMobileHeader, 250);
    window.setTimeout(fixWhatsAppButton, 400);
    window.setTimeout(fixWhatsAppButton, 1200);
    window.setTimeout(forceHeroTextWhite, 100);
    window.setTimeout(forceHeroTextWhite, 500);
    window.setTimeout(function () {
      disableStickySpacers();
      applySiteHeader();
      fixMobileHeader();
      fixPageScroll();
      syncHeaderHeight();
      revealPage();
    }, 1000);
  });

  /* Removed per-scroll disableMotionEffects — it caused hero lag on inner pages */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
