// Адрес сайта берётся при запуске: SERVER_URL → адрес Render → значение из сборки
export const SITE_URL = (process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

/** Ссылка на медиафайл Payload (оригинал или размер) */
export function mediaUrl(m: any, size?: 'thumb' | 'card' | 'wide'): string {
  if (!m || typeof m !== 'object') return ''
  const file = (size && m.sizes?.[size]?.filename) || m.filename
  if (file) return `/media/${encodeURIComponent(file)}`
  return (m.url || '').replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '')
}

/** Аналог wpautop: абзацы и переносы строк */
export function autop(text?: string | null): string {
  if (!text) return ''
  const esc = escapeHtml(text.trim())
  return esc
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Разбор текстового поля «каждый пункт с новой строки» */
export const lines = (s?: string | null): string[] => (s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean)

export const telHref = (phone?: string | null) => (phone ? 'tel:' + phone.replace(/[^+\d]/g, '') : '')

export const stripTags = (s?: string | null) => (s || '').replace(/<[^>]*>/g, '').trim()

export function formatDateRu(d?: string | null): string {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Moscow' })
}

export function formatDateLong(d?: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' })
}

/** Склонение: plural(5, ['минута','минуты','минут']) */
export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}

/** slug общей страницы «Создание сайтов в Крыму» (коллекция landings) */
export const LANDING_HUB = 'krym'

export const paths = {
  service: (slug: string) => `/services/${slug}/`,
  /** Города и отрасли; slug «krym» — общая страница региона */
  landing: (slug: string) => (slug === LANDING_HUB ? '/sozdanie-sajtov/' : `/sozdanie-sajtov/${slug}/`),
  project: (slug: string) => `/project/${slug}/`,
  post: (slug: string) => `/${slug}/`,
  page: (slug: string) => `/${slug}/`,
  serviceCategory: (slug: string) => `/service-category/${slug}/`,
  portfolioCategory: (slug: string) => `/portfolio-category/${slug}/`,
  category: (slug: string) => `/category/${slug}/`,
  tag: (slug: string) => `/tag/${slug}/`,
}

/** Неразрывные пробелы после коротких предлогов и союзов («в», «и», «на»…) и в числах — для заголовков, рендерящихся на сервере */
export const typo = (s?: string | null) =>
  String(s ?? '')
    .replace(/(^|[\s(«"—–-])([а-яёА-ЯЁ]{1,2})\s+(?=\S)/g, '$1$2\u00A0')
    .replace(/(^|[\s(«"—–-])([а-яёА-ЯЁ]{1,2})\s+(?=\S)/g, '$1$2\u00A0')
    .replace(/(\d)\s(?=\d{3}(?!\d))/g, '$1\u00A0')
    .replace(/(\d)\s(?=₽)/g, '$1\u00A0')
