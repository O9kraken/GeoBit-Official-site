/**
 * Версия статики: меняется при каждой сборке. Caddy кэширует /legacy/* на 30 дней,
 * поэтому к адресам CSS/JS добавляется ?v=… — после деплоя браузеры берут свежие файлы.
 */
export const ASSET_V = process.env.NEXT_PUBLIC_ASSET_V || 'dev'
export const av = (u: string) => `${u}${u.includes('?') ? '&' : '?'}v=${ASSET_V}`
