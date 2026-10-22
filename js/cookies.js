/* Mudanzas Express BCN — consentimiento de cookies (guía AEPD)
   Las cookies técnicas no necesitan consentimiento. El contenido de terceros
   (Google Maps) solo se carga si el usuario lo acepta. */
(function () {
  'use strict';

  var STORAGE_KEY = 'mebcn_consent';
  var VERSION = 1;
  var banner, prefsPanel, configBtn, mapsInput;

  function readConsent() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return data && data.v === VERSION ? data : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(maps) {
    var previous = readConsent();
    var data = { v: VERSION, maps: !!maps, date: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* almacenamiento no disponible */ }
    hideBanner();
    // Si se retira un consentimiento ya dado, se recarga para descargar el contenido de terceros
    if (previous && previous.maps && !data.maps) {
      window.location.reload();
      return;
    }
    applyConsent(data);
  }

  function applyConsent(data) {
    if (data && data.maps) loadMaps();
  }

  /* ---------- Google Maps ---------- */
  function loadMaps() {
    document.querySelectorAll('[data-map-src]').forEach(function (box) {
      if (box.querySelector('iframe')) return;
      var iframe = document.createElement('iframe');
      iframe.src = box.getAttribute('data-map-src');
      iframe.title = box.getAttribute('data-map-title') || 'Mapa de Google Maps';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(iframe);
    });
  }

  /* ---------- Banner ---------- */
  function buildBanner() {
    banner = document.createElement('section');
    banner.className = 'cookie-banner';
    banner.setAttribute('aria-labelledby', 'cookie-title');
    banner.setAttribute('aria-describedby', 'cookie-desc');
    banner.hidden = true;
    banner.innerHTML =
      '<div class="cookie-banner__inner">' +
        '<h2 id="cookie-title">Tu privacidad es importante</h2>' +
        '<p id="cookie-desc">Usamos cookies técnicas necesarias. Con tu permiso, cargaremos también el mapa de Google Maps, que usa cookies de terceros. ' +
        'Puedes cambiar tu elección cuando quieras. <a href="cookies.html">Política de cookies</a>.</p>' +
        '<div class="cookie-actions">' +
          '<button type="button" class="btn btn--navy" data-consent="accept">Aceptar</button>' +
          '<button type="button" class="btn btn--navy" data-consent="reject">Rechazar</button>' +
          '<button type="button" class="btn btn--navy" data-consent="config" aria-expanded="false" aria-controls="cookie-prefs">Configurar</button>' +
        '</div>' +
        '<div class="cookie-prefs" id="cookie-prefs" hidden>' +
          '<div class="cookie-option">' +
            '<div><strong id="opt-tec">Cookies técnicas (necesarias)</strong><span>Guardan tu elección sobre cookies. Siempre activas.</span></div>' +
            '<label class="switch"><input type="checkbox" checked disabled aria-labelledby="opt-tec"><span class="switch__track"></span></label>' +
          '</div>' +
          '<div class="cookie-option">' +
            '<div><strong id="opt-maps">Contenido de terceros: Google Maps</strong><span>Muestra el mapa de ubicación. Google puede usar cookies propias.</span></div>' +
            '<label class="switch"><input type="checkbox" id="consent-maps" aria-labelledby="opt-maps"><span class="switch__track"></span></label>' +
          '</div>' +
          '<button type="button" class="btn btn--accent" data-consent="save">Guardar mi selección</button>' +
        '</div>' +
      '</div>';

    document.body.insertBefore(banner, document.body.firstChild);
    prefsPanel = banner.querySelector('#cookie-prefs');
    configBtn = banner.querySelector('[data-consent="config"]');
    mapsInput = banner.querySelector('#consent-maps');

    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var action = btn.getAttribute('data-consent');
      if (action === 'accept') saveConsent(true);
      else if (action === 'reject') saveConsent(false);
      else if (action === 'save') saveConsent(mapsInput.checked);
      else if (action === 'config') togglePrefs(prefsPanel.hidden);
    });

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        document.body.style.setProperty('--cookie-h', banner.offsetHeight + 'px');
      }).observe(banner);
    }
  }

  function togglePrefs(open) {
    prefsPanel.hidden = !open;
    configBtn.setAttribute('aria-expanded', String(open));
  }

  function showBanner(withPrefs) {
    if (!banner) buildBanner();
    var current = readConsent();
    mapsInput.checked = !!(current && current.maps);
    togglePrefs(!!withPrefs);
    banner.hidden = false;
    document.body.classList.add('has-cookie-banner');
    if (withPrefs) {
      var title = banner.querySelector('h2');
      title.setAttribute('tabindex', '-1');
      title.focus();
    }
  }

  function hideBanner() {
    if (!banner) return;
    banner.hidden = true;
    document.body.classList.remove('has-cookie-banner');
  }

  /* ---------- Inicio ---------- */
  var consent = readConsent();
  if (consent) applyConsent(consent);
  else showBanner(false);

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cookie-settings]')) {
      e.preventDefault();
      showBanner(true);
    } else if (e.target.closest('[data-map-accept]')) {
      saveConsent(true);
    }
  });
})();
