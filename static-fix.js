/**
 * Static site fixes for Kızılağaç İnşaat clone
 */
(function () {
  var css = document.createElement('style');
  css.textContent = [
    'sr7-module { display:block !important; min-height:774px !important; position:relative !important; overflow:hidden !important; background:#f5f5f5; }',
    'sr7-content { display:block !important; position:relative !important; width:100% !important; min-height:774px !important; }',
    'sr7-slide { display:block !important; position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; }',
    'sr7-slide:first-child { opacity:1 !important; z-index:2 !important; }',
    'sr7-slide:not(:first-child) { opacity:0 !important; z-index:1 !important; }',
    'sr7-bg { display:block !important; position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; }',
    'sr7-bg img { width:100% !important; height:100% !important; object-fit:cover !important; display:block !important; }',
    'sr7-txt, sr7-bg + a { position:relative !important; z-index:5 !important; }',
  ].join('\n');
  document.head.appendChild(css);

  if (window.SR7 && SR7.E) {
    SR7.E.plugin_url = 'wp-content/plugins/revslider/';
    SR7.E.wp_plugin_url = 'wp-content/plugins/';
    SR7.E.ajaxurl = '';
    SR7.E.resturl = '';
  }

  function rotateSlides() {
    var slides = document.querySelectorAll('sr7-content > sr7-slide');
    if (slides.length < 2) return;
    var cur = 0;
    setInterval(function () {
      slides[cur].style.opacity = '0';
      slides[cur].style.zIndex = '1';
      cur = (cur + 1) % slides.length;
      slides[cur].style.opacity = '1';
      slides[cur].style.zIndex = '2';
    }, 5000);
  }

  function init() {
    rotateSlides();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
