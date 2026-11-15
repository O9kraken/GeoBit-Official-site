import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export type SiteCheck = {
  siteStatus: 'none' | 'social' | 'down' | 'old' | 'weak' | 'ok'
  score: number
  siteNotes: string
  siteFinalUrl?: string
  siteTitle?: string
  siteMs?: number
}

/** Внутренние адреса сервера не трогаем (адреса сайтов приходят из внешних данных) */
const privateIp = (ip: string): boolean => {
  if (ip.includes(':')) {
    const l = ip.toLowerCase()
    if (l.startsWith('::ffff:')) return privateIp(l.slice(7))
    return l === '::1' || l === '::' || /^(fc|fd|fe[89ab])/.test(l)
  }
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
}

async function safeUrl(raw: string): Promise<URL> {
  const u = new URL(raw)
  if (!/^https?:$/.test(u.protocol)) throw new Error('не http(s)')
  if (u.port && !['80', '443', ''].includes(u.port)) throw new Error('нестандартный порт')
  const host = u.hostname
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error('внутренний адрес')
  const ips = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
  if (!ips.length || ips.some((x) => privateIp(x.address))) throw new Error('внутренний адрес')
  return u
}

/** Загрузка с ручными редиректами (каждый шаг проверяется), не больше 1,5 МБ */
async function get(url: string) {
  let cur = url
  const t0 = Date.now()
  for (let i = 0; i < 5; i++) {
    const u = await safeUrl(cur)
    const r = await fetch(u, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GeoBitSiteCheck/1.0; +https://getgeobit.ru)', Accept: 'text/html,*/*' },
    })
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      cur = new URL(r.headers.get('location')!, u).toString()
      continue
    }
    const reader = r.body?.getReader()
    let html = ''
    if (reader) {
      const dec = new TextDecoder()
      let size = 0
      while (size < 1_500_000) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.length
        html += dec.decode(value, { stream: true })
      }
      reader.cancel().catch(() => {})
    }
    return { status: r.status, url: cur, html, ms: Date.now() - t0 }
  }
  throw new Error('слишком много редиректов')
}

const BUILDERS: [RegExp, string][] = [
  [/tilda\.ws|tildacdn|data-tilda/i, 'Tilda'],
  [/wix\.com|wixstatic/i, 'Wix'],
  [/ucoz|narod\.ru|ucoz\.net/i, 'uCoz/Narod'],
  [/nethouse/i, 'Nethouse'],
  [/flexbe/i, 'Flexbe'],
  [/lpmotor|lpgenerator/i, 'конструктор лендингов'],
  [/ukit|umi\.ru/i, 'uKit/UMI'],
  [/1c-bitrix|bitrix\/js/i, '1С-Битрикс'],
  [/wp-content|wp-includes/i, 'WordPress'],
  [/joomla/i, 'Joomla'],
]

/** Оценка 0–100: чем выше, тем нужнее компании новый сайт (и тем интереснее лид) */
export async function checkSite(website?: string, hasSocials?: boolean): Promise<SiteCheck> {
  if (!website) {
    return hasSocials
      ? { siteStatus: 'social', score: 95, siteNotes: 'Сайта нет, только соцсети — нужен сайт' }
      : { siteStatus: 'none', score: 90, siteNotes: 'Сайта нет' }
  }
  let res: Awaited<ReturnType<typeof get>>
  try {
    res = await get(website)
  } catch (e: any) {
    if (website.startsWith('http://')) {
      try {
        res = await get(website.replace('http://', 'https://'))
      } catch {
        return { siteStatus: 'down', score: 85, siteNotes: `Сайт не открывается (${e?.message || 'ошибка'})` }
      }
    } else return { siteStatus: 'down', score: 85, siteNotes: `Сайт не открывается (${e?.message || 'ошибка'})` }
  }
  if (res.status >= 400) return { siteStatus: 'down', score: 85, siteNotes: `Сайт отвечает ошибкой ${res.status}`, siteFinalUrl: res.url, siteMs: res.ms }

  const h = res.html
  const notes: string[] = []
  let score = 15
  const https = res.url.startsWith('https://')
  const viewport = /<meta[^>]+name=["']?viewport/i.test(h)
  const title = (h.match(/<title[^>]*>([^<]{0,200})/i)?.[1] || '').replace(/\s+/g, ' ').trim()
  const years = [...h.matchAll(/(?:©|&copy;|copyright)[^<]{0,40}?((?:19|20)\d{2})(?:\s*[-–—]\s*((?:19|20)\d{2}))?/gi)].map((m) => Number(m[2] || m[1]))
  const year = years.length ? Math.max(...years) : undefined
  const nowY = new Date().getFullYear()
  const builder = BUILDERS.find(([re]) => re.test(h))?.[1]
  const flash = /\.swf|<frameset|<marquee|<font /i.test(h)
  const tables = (h.match(/<table/gi) || []).length > 6 && !/<(div|section)[^>]*class=/i.test(h.slice(0, 20000))

  if (!https) { score += 20; notes.push('нет HTTPS') }
  if (!viewport) { score += 30; notes.push('нет мобильной версии') }
  if (year && year <= nowY - 3) { score += 15; notes.push(`© ${year} — давно не обновлялся`) }
  if (flash || tables) { score += 15; notes.push('устаревшая вёрстка') }
  if (res.ms > 4000) { score += 10; notes.push(`грузится ${(res.ms / 1000).toFixed(1)} с`) }
  if (!title) { score += 5; notes.push('нет заголовка страницы') }
  if (h.length < 3000) { score += 10; notes.push('почти пустая страница') }
  if (builder && /uCoz|Narod|Nethouse|uKit|конструктор/.test(builder)) { score += 10; notes.push(`сделан на ${builder}`) }
  else if (builder) notes.push(builder)

  score = Math.min(80, score)
  const siteStatus = score >= 55 ? 'old' : score >= 35 ? 'weak' : 'ok'
  return {
    siteStatus,
    score,
    siteNotes: notes.length ? notes.join(', ') : 'Сайт в порядке',
    siteFinalUrl: res.url,
    siteTitle: title.slice(0, 150) || undefined,
    siteMs: res.ms,
  }
}
