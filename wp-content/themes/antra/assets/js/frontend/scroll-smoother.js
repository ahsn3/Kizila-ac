(function ($) {
    'use strict';

    let lenis = null;
    let rafId = null;

    function startLenis() {
        if (lenis) return;
        lenis = new Lenis({
            lerp: 0.09,
            smoothWheel: true,
            smoothTouch: false,
            wheelMultiplier: 0.85,
            touchMultiplier: 1.5,
        });
        window.lenisInstance = lenis;

        function raf(time) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);
        $('html').css('scroll-behavior', 'initial');
    }

    function stopLenis() {
        if (!lenis) return;
        if (rafId) cancelAnimationFrame(rafId);
        lenis.destroy();
        lenis = null;
        $('html').css('scroll-behavior', 'smooth');
    }

    function handleResize() {
        if ($(window).width() <= 992) {
            stopLenis();
        } else {
            startLenis();
        }
    }

    // Init on load
    handleResize();

    $(window).on('resize', function () {
        handleResize();
    });

})(jQuery);
