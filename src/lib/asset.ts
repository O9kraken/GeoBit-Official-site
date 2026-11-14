/**
 * Версия статики: меняется при каждой сборке. Caddy кэширует /legacy/* на 30 дней,
 * поэтому к адресам CSS/JS добавляется ?v=… — после деплоя браузеры берут свежие файлы.
 */
export const ASSET_V = process.env.NEXT_PUBLIC_ASSET_V || 'dev'
export const av = (u: string) => `${u}${u.includes('?') ? '&' : '?'}v=${ASSET_V}`

/** Подключает CSS без блокировки первой отрисовки */
export const asyncCss = (hrefs: string[]) =>
  `(function(d){${JSON.stringify(hrefs)}.forEach(function(h){var l=d.createElement('link');l.rel='stylesheet';l.href=h;d.head.appendChild(l)})})(document);`
