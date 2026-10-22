/* Mudanzas Express BCN — galería con lightbox (flota) */
(function () {
  'use strict';

  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  var dialog = document.getElementById('lightbox');
  if (!items.length || !dialog || typeof dialog.showModal !== 'function') return;

  var img = dialog.querySelector('.lightbox__img');
  var caption = dialog.querySelector('.lightbox__caption');
  var current = 0;
  var lastTrigger = null;

  function show(index) {
    current = (index + items.length) % items.length;
    var item = items[current];
    var thumb = item.querySelector('img');
    img.src = item.getAttribute('data-lightbox');
    img.alt = thumb ? thumb.alt : '';
    caption.textContent = item.getAttribute('data-caption') || '';
    // Reinicia la animación de entrada en cada cambio
    img.style.animation = 'none';
    void img.offsetWidth;
    img.style.animation = '';
  }

  items.forEach(function (item, i) {
    item.addEventListener('click', function () {
      lastTrigger = item;
      show(i);
      dialog.showModal();
    });
  });

  dialog.querySelector('.lightbox__close').addEventListener('click', function () { dialog.close(); });
  dialog.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
  dialog.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });

  // Cerrar al tocar fuera de la imagen
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog || e.target.classList.contains('lightbox__figure')) dialog.close();
  });

  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
  });

  dialog.addEventListener('close', function () {
    if (lastTrigger) lastTrigger.focus();
  });

  // Deslizar en móvil
  var startX = null;
  dialog.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
