/**
 * Версия статики: меняется при каждой сборке. Caddy кэширует /legacy/* на 30 дней,
 * поэтому к адресам CSS/JS добавляется ?v=… — после деплоя браузеры берут свежие файлы.
 */
export const ASSET_V = process.env.NEXT_PUBLIC_ASSET_V || 'dev'
export const av = (u: string) => `${u}${u.includes('?') ? '&' : '?'}v=${ASSET_V}`

/** Подключает CSS без блокировки первой отрисовки.
 *  media="print" → браузер качает файл с низким приоритетом и не ждёт его для показа страницы;
 *  после загрузки стили включаются для экрана. */
export const asyncCss = (hrefs: string[]) =>
  `(function(d){${JSON.stringify(hrefs)}.forEach(function(h){var l=d.createElement('link');l.rel='stylesheet';l.media='print';l.onload=function(){this.onload=null;this.media='all'};l.href=h;d.head.appendChild(l)})})(document);`

/** Подключает CSS после полной загрузки страницы, когда браузер свободен.
 *  Вставляется перед остальными стилями, чтобы не перебивать правила сайта. */
export const lazyCss = (hrefs: string[]) =>
  `(function(w,d){function go(){var first=d.head.querySelector('style,link[rel=stylesheet]');${JSON.stringify(hrefs)}.forEach(function(h){var l=d.createElement('link');l.rel='stylesheet';l.href=h;d.head.insertBefore(l,first)})}function idle(){w.requestIdleCallback?requestIdleCallback(go,{timeout:4000}):setTimeout(go,1500)}d.readyState==='complete'?idle():w.addEventListener('load',idle)})(window,document);`
