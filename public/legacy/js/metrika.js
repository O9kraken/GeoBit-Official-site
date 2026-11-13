/* Яндекс Метрика — только после согласия на «Аналитику» (cookie-баннер) */
(function () {
  var id = window.GEOBIT_CFG && window.GEOBIT_CFG.metrikaId;
  if (!id) return;
  var loaded = false;
  function loadMetrika() {
    if (loaded) return;
    loaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
      m[i].l = 1 * new Date();
      k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(Number(id), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }
  function check(c) { if (c && c.analytics) loadMetrika(); }
  try { check(JSON.parse(localStorage.getItem('cb_consent') || 'null')); } catch (e) {}
  document.addEventListener('cb:consent', function (e) { check(e.detail); });
  // Цели: отправка заявки и клики по контактам
  window.geobitGoal = function (name) { try { if (loaded && window.ym) window.ym(Number(id), 'reachGoal', name); } catch (e) {} };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('tel:') === 0) window.geobitGoal('click_phone');
    else if (/t\.me\//.test(h)) window.geobitGoal('click_telegram');
    else if (/max\.ru\//.test(h)) window.geobitGoal('click_max');
    else if (/wa\.me\//.test(h)) window.geobitGoal('click_whatsapp');
  });
})();

/* Бейдж рейтинга Яндекс Бизнеса в подвале: до согласия — обычная ссылка, после — живой бейдж (iframe Яндекса ставит свои cookie) */
(function () {
  var id = window.GEOBIT_CFG && window.GEOBIT_CFG.yaBadge;
  if (!id) return;
  function show() {
    var a = document.querySelector('.ya-badge');
    if (!a || a.getAttribute('data-done')) return;
    a.setAttribute('data-done', '1');
    var f = document.createElement('iframe');
    f.src = 'https://yandex.ru/sprav/widget/rating-badge/' + encodeURIComponent(id) + '?type=rating&theme=dark';
    f.width = '150'; f.height = '50'; f.setAttribute('frameborder', '0'); f.title = 'Рейтинг GeoBit на Яндекс Картах';
    f.loading = 'lazy'; f.className = 'ya-badge-frame';
    a.parentNode.insertBefore(f, a.nextSibling);
    a.style.display = 'none';
  }
  function check(c) { if (c && c.analytics) show(); }
  function init() {
    try { check(JSON.parse(localStorage.getItem('cb_consent') || 'null')); } catch (e) {}
    document.addEventListener('cb:consent', function (e) { check(e.detail); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
