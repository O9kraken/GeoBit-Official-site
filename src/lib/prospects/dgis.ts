import { CITIES, NICHES } from './presets'
import { type Found, normPhone, normSite } from './normalize'

/**
 * 2ГИС Places API — официальный API по ключу (platform.2gis.ru).
 * Контакты (телефоны, сайты) 2ГИС отдаёт не на всех тарифах — если их нет в ответе, сохраняем то, что есть.
 */
/** Ссылки 2ГИС ведут через счётчик link.2gis.ru — достаём настоящий адрес */
const unwrap = (c: any, urlFirst = false): string | undefined => {
  for (const v of urlFirst ? [c?.url, c?.value, c?.text] : [c?.text, c?.value, c?.url]) {
    if (!v || typeof v !== 'string') continue
    if (/link\.2gis/.test(v)) {
      const m = v.match(/\?(https?:\/\/.+)$/) || v.match(/[?&](?:url|u)=([^&]+)/)
      if (m) return decodeURIComponent(m[1])
      continue
    }
    return v
  }
  return undefined
}

export async function search2gis(key: string, city: string, niche: string, query?: string, limit = 200): Promise<Found[]> {
  const c = CITIES[city]
  if (!c) throw new Error('Неизвестный город')
  const q = (query || NICHES[niche]?.q || '').trim()
  if (!q) throw new Error('Выберите сферу или введите запрос')
  const [s, w, n, e] = c.bbox
  const out: Found[] = []
  const pageSize = 10
  for (let page = 1; page <= Math.ceil(limit / pageSize) && page <= 50; page++) {
    const url = new URL('https://catalog.api.2gis.com/3.0/items')
    url.search = new URLSearchParams({
      q,
      type: 'branch',
      point1: `${w},${n}`,
      point2: `${e},${s}`,
      page: String(page),
      page_size: String(pageSize),
      fields: 'items.point,items.address,items.contact_groups,items.rubrics,items.schedule,items.full_address_name',
      locale: 'ru_RU',
      key,
    }).toString()
    const r = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    const j: any = await r.json().catch(() => ({}))
    const code = j?.meta?.code
    if (code === 404) break // результаты закончились
    if (!r.ok || (code && code !== 200)) throw new Error(`2ГИС: ${j?.meta?.error?.message || `ошибка ${code || r.status}`}`)
    const items: any[] = j?.result?.items || []
    for (const it of items) {
      const contacts = (it.contact_groups || []).flatMap((g: any) => g.contacts || [])
      const pick = (type: string) => contacts.find((x: any) => x.type === type)
      const site = normSite(unwrap(pick('website')))
      const socials = contacts.filter((x: any) => ['vkontakte', 'telegram', 'instagram', 'whatsapp', 'ok'].includes(x.type)).map((x: any) => unwrap(x, true)).filter((v: any) => typeof v === 'string' && /^https?:|\./.test(v)) as string[]
      if (site.social) socials.push(site.social)
      out.push({
        source: '2gis',
        sourceId: String(it.id).split('_')[0],
        name: it.name,
        category: it.rubrics?.[0]?.name,
        address: it.full_address_name || it.address_name,
        phone: normPhone(pick('phone')?.value || pick('phone')?.text),
        website: site.website,
        email: pick('email')?.value,
        socials: [...new Set(socials)].join(' ') || undefined,
        lat: it.point?.lat,
        lon: it.point?.lon,
      })
    }
    if (items.length < pageSize || out.length >= limit) break
    await new Promise((res) => setTimeout(res, 250))
  }
  return out
}
