import { CITIES, NICHES } from './presets'
import { type Found, normPhone, normSite } from './normalize'

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']

const esc = (s: string) => s.replace(/["\\]/g, '')

/** OpenStreetMap через Overpass API — бесплатно, без ключа, лицензия ODbL (данные открытые) */
export async function searchOsm(city: string, niche: string, query?: string, limit = 500): Promise<Found[]> {
  const c = CITIES[city]
  if (!c) throw new Error('Неизвестный город')
  const bbox = c.bbox.join(',')
  const sel: string[] = []
  if (niche && NICHES[niche]) for (const [k, v] of NICHES[niche].osm) sel.push(`nwr["${k}"~"^(${v})$"]["name"](${bbox});`)
  if (query) sel.push(`nwr["name"~"${esc(query)}",i](${bbox});`)
  if (!sel.length) throw new Error('Выберите сферу или введите запрос')
  const body = `[out:json][timeout:90];(${sel.join('')});out center tags ${Math.min(limit, 2000)};`

  let json: any, lastErr: any
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ data: body }),
        headers: { 'User-Agent': 'GeoBit-admin/1.0 (getgeobit.ru)' },
        signal: AbortSignal.timeout(100_000),
      })
      if (!r.ok) throw new Error(`Overpass ответил ${r.status}`)
      json = await r.json()
      break
    } catch (e) {
      lastErr = e
    }
  }
  if (!json) throw new Error(`OpenStreetMap недоступен: ${lastErr?.message || lastErr}`)

  const out: Found[] = []
  for (const el of json.elements || []) {
    const t = el.tags || {}
    if (!t.name) continue
    const site = normSite(t.website || t['contact:website'] || t.url)
    const socials = [t['contact:vk'], t['contact:telegram'], t['contact:instagram'], t['contact:whatsapp'], site.social].filter(Boolean)
    const street = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ')
    out.push({
      source: 'osm',
      sourceId: `${el.type}/${el.id}`,
      name: t.name,
      category: t.amenity || t.shop || t.tourism || t.office || t.craft || t.leisure || t.healthcare,
      address: [t['addr:city'] || c.label, street].filter(Boolean).join(', '),
      phone: normPhone(t.phone || t['contact:phone'] || t['contact:mobile']),
      website: site.website,
      email: t.email || t['contact:email'],
      socials: [...new Set(socials)].join(' ') || undefined,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      hours: t.opening_hours,
    })
  }
  return out
}
