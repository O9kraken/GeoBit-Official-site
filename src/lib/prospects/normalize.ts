import { domainToUnicode } from 'node:url'

export type Found = {
  source: 'osm' | '2gis'
  sourceId: string
  name: string
  category?: string
  address?: string
  phone?: string
  website?: string
  email?: string
  socials?: string
  lat?: number
  lon?: number
  hours?: string
}

/** +7XXXXXXXXXX из любых «8 (978) 123-45-67», «+7 978…», несколько номеров через ; / , */
export const normPhone = (raw?: string): string | undefined => {
  if (!raw) return undefined
  const first = raw.split(/[;,/]|\s{2,}/)[0]
  let d = first.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1)
  if (d.length === 10) d = '7' + d
  return d.length === 11 && d.startsWith('7') ? `+${d}` : first.trim() || undefined
}

/** Сайты-«не сайты»: соцсети и карточки на картах считаем отсутствием сайта */
const NOT_SITE = /(^|\.)(vk\.com|vk\.ru|instagram\.com|t\.me|telegram\.me|ok\.ru|facebook\.com|wa\.me|whatsapp\.com|2gis\.ru|yandex\.ru|avito\.ru|youtube\.com|taplink\.cc|linktr\.ee)$/i

export const normSite = (raw?: string): { website?: string; social?: string } => {
  if (!raw) return {}
  let s = raw.trim().split(/[\s;,]+/)[0]
  if (!s) return {}
  if (!/^https?:\/\//i.test(s)) s = 'http://' + s
  try {
    const u = new URL(s)
    if (NOT_SITE.test(u.hostname)) return { social: u.toString() }
    return { website: `${u.protocol}//${domainToUnicode(u.hostname) || u.hostname}${u.pathname === '/' ? '' : decodeURI(u.pathname)}` }
  } catch {
    return {}
  }
}

export const domainOf = (url?: string) => {
  try {
    return url ? (domainToUnicode(new URL(url).hostname) || new URL(url).hostname).replace(/^www\./, '').toLowerCase() : undefined
  } catch {
    return undefined
  }
}
