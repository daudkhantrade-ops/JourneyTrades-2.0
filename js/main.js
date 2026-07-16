(function(){
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('animateMotion').forEach(function(el){ el.remove(); });
  }

  // Mobile nav toggle — full implementation: open/close, scroll lock, Escape, click-outside, focus return
  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
    var mobileLinks = mobileMenu.querySelectorAll('a');
    var lastFocused = null;

    var openMenu = function(){
      lastFocused = document.activeElement;
      menuToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
      // Move focus into the menu for keyboard users
      var firstLink = mobileMenu.querySelector('a');
      if (firstLink) { firstLink.focus(); }
    };

    var closeMenu = function(){
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
      // Return focus to the toggle so the user doesn't lose their place
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      } else {
        menuToggle.focus();
      }
    };

    var toggleMenu = function(){
      var isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) { closeMenu(); } else { openMenu(); }
    };

    menuToggle.addEventListener('click', function(e){ e.preventDefault(); toggleMenu(); });

    // Close after selecting any link inside the menu
    mobileLinks.forEach(function(a){
      a.addEventListener('click', function(){
        // Defer close so the browser can navigate (or so the click registers on hash-link pages)
        window.setTimeout(closeMenu, 0);
      });
    });

    // Click outside the menu (on the dark overlay/background of the menu itself) closes it
    mobileMenu.addEventListener('click', function(e){
      if (e.target === mobileMenu) { closeMenu(); }
    });

    // Escape key closes the menu — works anywhere on the page while menu is open
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        closeMenu();
      }
    });

    // If the viewport grows back to desktop while the menu is open, close it cleanly
    var desktopMQ = window.matchMedia('(min-width: 961px)');
    desktopMQ.addEventListener('change', function(e){
      if (e.matches && document.body.classList.contains('menu-open')) { closeMenu(); }
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(function(item){
    var btn = item.querySelector('.faq-item__q');
    var panel = item.querySelector('.faq-item__a');
    if (!btn || !panel) return;
    btn.addEventListener('click', function(){
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq-item__q').forEach(function(b){
        b.setAttribute('aria-expanded','false');
        var p = b.closest('.faq-item').querySelector('.faq-item__a');
        if (p) p.style.height = '0px';
      });
      if (!isOpen) {
        btn.setAttribute('aria-expanded','true');
        panel.style.height = panel.scrollHeight + 'px';
      }
    });
  });

  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Hero image carousel — loops every 3s, pauses on hover/focus and reduced motion
  var carousel = document.querySelector('.hero__bg');
  if (carousel) {
    var slides = carousel.querySelectorAll('.carousel__slide');
    var dots = carousel.querySelectorAll('.carousel__dot');
    var current = 0;
    var timer = null;
    var INTERVAL = 5000;

    var restartDotFill = function(dot){
      // force a reflow so the CSS fill animation restarts cleanly even if
      // this exact dot was already mid-animation (e.g. looping back to slide 1)
      dot.classList.remove('is-active');
      void dot.offsetWidth;
      dot.classList.add('is-active');
    };

    var show = function(index){
      slides[current].classList.remove('is-active');
      dots[current].classList.remove('is-active');
      dots[current].setAttribute('aria-selected','false');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current].setAttribute('aria-selected','true');
      restartDotFill(dots[current]);
    };
    var advance = function(){ show(current + 1); };
    var start = function(){
      stop();
      carousel.classList.remove('is-paused');
      timer = window.setInterval(advance, INTERVAL);
    };
    var stop = function(){
      if (timer) { window.clearInterval(timer); timer = null; }
      carousel.classList.add('is-paused');
    };

    dots.forEach(function(dot, i){
      dot.addEventListener('click', function(){ show(i); start(); });
    });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);

    // Autoplay always runs — hover/focus/click still gives full manual control,
    // which is the accessibility escape hatch, so this isn't gated on
    // prefers-reduced-motion the way the zoom/fill effects are (see CSS).
    start();
  }

  // Open the first FAQ item by default — gives the section visual weight on load
  var firstFaqBtn = document.querySelector('.faq-item:first-child .faq-item__q');
  var firstFaqPanel = firstFaqBtn ? firstFaqBtn.closest('.faq-item').querySelector('.faq-item__a') : null;
  if (firstFaqBtn && firstFaqPanel) {
    firstFaqBtn.setAttribute('aria-expanded', 'true');
    firstFaqPanel.style.height = firstFaqPanel.scrollHeight + 'px';
  }

  // Scroll-triggered reveals
  var revealTargets = document.querySelectorAll('.fade-up, .entry-rule');
  if ('IntersectionObserver' in window && revealTargets.length) {
    var revealObserver = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function(el){ el.classList.add('is-visible'); });
  }

  // Nav gains a slightly denser background once the page scrolls
  var siteNav = document.getElementById('site-nav');
  if (siteNav) {
    var onScroll = function(){
      siteNav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Contact form: formsubmit.co redirects back to /contact?sent=1 on success —
  // show the confirmation panel in place of the form when that param is present
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    var successPanel = document.getElementById('form-success');
    var params = new URLSearchParams(window.location.search);
    if (successPanel && params.get('sent') === '1') {
      contactForm.hidden = true;
      successPanel.hidden = false;
      successPanel.classList.add('fade-up','is-visible');
    }
  }

})();
