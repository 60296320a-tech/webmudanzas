/* Mudanzas Express BCN — interacciones y animaciones */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Modo claro / oscuro ---------- */
  var THEME_KEY = 'mebcn_theme';
  var themeBtn = document.querySelector('.theme-toggle');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  var storedTheme = function () {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  };
  var applyTheme = function (theme) {
    root.setAttribute('data-theme', theme);
    if (themeBtn) themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
  };
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* almacenamiento no disponible */ }
    });
  }
  // Mientras el usuario no elija, se sigue la preferencia del sistema
  systemDark.addEventListener('change', function (e) {
    if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ---------- Scroll: cabecera, progreso y volver arriba ---------- */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.progress');
  var backTop = document.querySelector('.back-to-top');
  var nav = document.getElementById('site-nav');
  var lastY = window.scrollY;
  var ticking = false;

  var onScroll = function () {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var menuOpen = nav && nav.classList.contains('is-open');

    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      // Se oculta al bajar y reaparece al subir
      var hide = !menuOpen && y > 320 && y > lastY + 2;
      var show = y < lastY - 2 || y <= 320;
      if (hide) header.classList.add('is-hidden');
      else if (show) header.classList.remove('is-hidden');
      root.classList.toggle('header-hidden', header.classList.contains('is-hidden'));
    }
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (backTop) backTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
    lastY = y;
    ticking = false;
  };
  onScroll();
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var brand = document.querySelector('.site-header .brand');
      if (brand) brand.focus({ preventScroll: true });
    });
  }

  // Si el foco entra en la cabecera oculta (teclado), se vuelve a mostrar
  if (header) {
    header.addEventListener('focusin', function () {
      header.classList.remove('is-hidden');
      root.classList.remove('header-hidden');
    });
  }

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle && nav) {
    var desktop = window.matchMedia('(min-width: 992px)');

    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      if (open) {
        header.classList.remove('is-hidden');
        var first = nav.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') {
        setMenu(false);
        toggle.focus();
      } else if (e.key === 'Tab') {
        // Mantiene el foco dentro del menú abierto
        var items = [toggle].concat(Array.prototype.slice.call(nav.querySelectorAll('a')));
        var firstEl = items[0];
        var lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });

    desktop.addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- Aparición escalonada al hacer scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  var steps = document.querySelector('.steps');

  // Al terminar de aparecer se quita .reveal para que el hover y la inclinación respondan al instante
  var settle = function (el) {
    el.addEventListener('transitionend', function done(e) {
      if (e.target !== el || e.pseudoElement || e.propertyName !== 'transform') return;
      el.removeEventListener('transitionend', done);
      el.classList.remove('reveal', 'reveal--scale', 'reveal--left', 'reveal--right', 'reveal--fade', 'is-visible');
      el.style.removeProperty('--delay');
    });
  };

  if (reduceMotion || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    if (steps) steps.classList.add('is-drawn');
  } else {
    var observer = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (entry) { return entry.isIntersecting; });
      batch.forEach(function (entry, i) {
        var el = entry.target;
        var gap = el.classList.contains('step') ? 0.25 : 0.1;
        el.style.setProperty('--delay', (Math.min(i, 6) * gap).toFixed(2) + 's');
        el.classList.add('is-visible');
        settle(el);
        observer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });

    if (steps) {
      var lineObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          steps.classList.add('is-drawn');
          lineObserver.disconnect();
        }
      }, { threshold: 0.25 });
      lineObserver.observe(steps);
    }

    // Pausa el zoom lento de la portada cuando no se ve
    var hero = document.querySelector('.hero');
    if (hero) {
      new IntersectionObserver(function (entries) {
        hero.classList.toggle('is-offscreen', !entries[0].isIntersecting);
      }).observe(hero);
    }
  }

  /* ---------- Contadores ---------- */
  var counters = document.querySelectorAll('[data-count]');
  var runCounter = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null;
    var duration = 1400;
    var step = function (t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };
  if (counters.length && hasIO && !reduceMotion) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      el.textContent = '0' + (el.getAttribute('data-suffix') || '');
      counterObserver.observe(el);
    });
  }

  /* ---------- Inclinación 3D suave (solo ordenador) ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.card, .feature, .contact-card').forEach(function (el) {
      var frame = null;
      el.addEventListener('pointermove', function (e) {
        if (el.classList.contains('reveal')) return;
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width;
          var y = (e.clientY - r.top) / r.height;
          el.classList.add('is-tilting');
          el.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((0.5 - y) * 6).toFixed(2) + 'deg');
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
          frame = null;
        });
      });
      el.addEventListener('pointerleave', function () {
        if (frame) window.cancelAnimationFrame(frame);
        frame = null;
        el.classList.remove('is-tilting');
        el.style.removeProperty('--rx');
        el.style.removeProperty('--ry');
      });
    });
  }

  // iOS solo aplica :active (escala al tocar) si hay un listener táctil
  document.addEventListener('touchstart', function () {}, { passive: true });

  /* ---------- Preguntas frecuentes ---------- */
  document.querySelectorAll('.faq__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-open', open);
    });
  });

  /* ---------- Carrusel de la flota ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel__track');
    var slides = Array.prototype.slice.call(track.children);
    var prev = carousel.querySelector('[data-dir="-1"]');
    var next = carousel.querySelector('[data-dir="1"]');
    var dotsBox = carousel.querySelector('.carousel__dots');
    var behavior = reduceMotion ? 'auto' : 'smooth';

    var goTo = function (i) {
      var slide = slides[Math.max(0, Math.min(i, slides.length - 1))];
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).scrollPaddingLeft || 0), behavior: behavior });
    };
    var current = function () {
      var best = 0;
      var bestDist = Infinity;
      var center = track.scrollLeft + track.clientWidth / 2;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.offsetLeft - track.offsetLeft + s.offsetWidth / 2 - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    };

    // Indicadores de posición (decorativos: el control son las flechas y el gesto de deslizar)
    var dots = slides.map(function () {
      var dot = document.createElement('span');
      dot.className = 'carousel__dot';
      dotsBox.appendChild(dot);
      return dot;
    });

    var update = function () {
      var i = current();
      dots.forEach(function (d, j) { d.classList.toggle('is-active', i === j); });
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    var pending = false;
    track.addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () { update(); pending = false; });
    }, { passive: true });
    window.addEventListener('resize', update);

    [prev, next].forEach(function (btn) {
      btn.addEventListener('click', function () {
        goTo(current() + parseInt(btn.getAttribute('data-dir'), 10));
      });
    });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
    });
    update();
  });

  /* ---------- Burbuja "¿Te ayudamos?" ---------- */
  var BUBBLE_KEY = 'mebcn_bubble';
  var bubble = document.querySelector('.wa-bubble');
  if (bubble) {
    var dismissed = false;
    try { dismissed = sessionStorage.getItem(BUBBLE_KEY) === '1'; } catch (e) { /* sin almacenamiento */ }
    if (!dismissed) {
      setTimeout(function () { bubble.classList.add('is-visible'); }, 5000);
    }
    bubble.querySelector('button').addEventListener('click', function () {
      bubble.classList.remove('is-visible');
      try { sessionStorage.setItem(BUBBLE_KEY, '1'); } catch (e) { /* sin almacenamiento */ }
    });
  }

  /* ---------- Fundido entre páginas (navegadores sin View Transitions) ---------- */
  if (root.classList.contains('no-vt') && !reduceMotion) {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      var url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      root.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 250);
    });
    // Al volver con "atrás", la página puede venir de la caché con el fundido puesto
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) root.classList.remove('is-leaving');
    });
  }

  /* ---------- Año del copyright ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
