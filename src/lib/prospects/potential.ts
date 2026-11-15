import { NICHES } from './presets'

/**
 * Насколько выгодно этой компании предлагать сайт.
 * Сфера: чем дороже клиент у бизнеса, тем быстрее окупается сайт и тем охотнее платят.
 */
export const NICHE_VALUE: Record<string, number> = {
  dentist: 35, clinic: 35, hotel: 33, build: 33, legal: 30, tour: 28, auto: 24, edu: 24,
  fitness: 18, vet: 18, beauty: 16, photo: 16, shop: 8, cafe: 8,
}
/** Где соцсетей обычно хватает и сайт продать сложнее */
const SOCIAL_OK = new Set(['cafe', 'shop', 'beauty', 'photo'])

/** Уровни для фильтров и подписей */
export const TIER = (p?: number | null) => (p == null || p < 0 ? 'none' : p >= 70 ? 'hot' : p >= 50 ? 'maybe' : 'cold')

/** Федеральные сети, франшизы и госструктуры — сайт у них делает головной офис */
const CHAIN_LIST = [
  'faberlic', 'avon', 'oriflame', 'магнит', 'пятёрочка', 'пятерочка', 'перекрёсток', 'перекресток', 'ашан', 'пуд', 'золотое яблоко', 'летуаль', "л'этуаль", 'рив гош',
  'подружка', 'улыбка радуги', 'fix price', 'fixprice', 'светофор', 'kfc', 'burger king', 'бургер кинг', 'вкусно и точка', 'макдоналдс', 'mcdonald', 'додо', 'dodo',
  'subway', 'теремок', 'шоколадница', 'кофе хауз', 'cofix', 'starbucks', 'сбербанк', 'сбер', 'втб', 'тинькофф', 'т-банк', 'рнкб', 'генбанк', 'почта россии', 'сдэк', 'cdek',
  'boxberry', 'wildberries', 'ozon', 'озон', 'яндекс маркет', 'мтс', 'мегафон', 'билайн', 'tele2', 'теле2', 'win mobile', 'лукойл', 'роснефть', 'атан', 'тнк', 'газпром',
  'ригла', 'планета здоровья', 'инвитро', 'helix', 'хеликс', 'гемотест', 'ситилаб', 'kari', 'zolla', 'глория джинс', 'gloria jeans', "o'stin", 'остин', 'befree', 'sela',
  'leroy merlin', 'леруа', 'м.видео', 'эльдорадо', 'dns', 'ситилинк', 'спортмастер', 'детский мир', 'ростелеком', 'rendez-vous',
]
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// \b в JS не работает с кириллицей — границы слова задаём через \p{L}
const CHAINS = new RegExp(`(?:^|[^\\p{L}\\d])(?:${CHAIN_LIST.map(esc).join('|')})(?=$|[^\\p{L}\\d])`, 'iu')

/** Названия-заглушки: точка без бренда, продавать некому */
const GENERIC = /^(кафе|ресторан|бар|кофейня|кофе|столовая|шаурма|пекарня|магазин|продукты|парикмахерская|салон красоты|салон|барбершоп|barbershop|barber|маникюр|nail|ногти|косметика.*|парфюмерия|автосервис|шиномонтаж|автомойка|мойка|сто|гостиница|отель|гостевой дом|мини-гостиница|стоматология|аптека|ремонт.*|фото|hairstylist|beauty|кофе с собой|цветы)$/i

export const nicheKeyOf = (label?: string | null, key?: string | null): string | undefined => {
  if (key && NICHES[key]) return key
  if (!label) return undefined
  const e = Object.entries(NICHES).find(([, n]) => n.label === label)
  return e?.[0]
}

export type PotentialInput = {
  name?: string
  niche?: string | null
  nicheKey?: string | null
  phone?: string | null
  email?: string | null
  socials?: string | null
  website?: string | null
  siteStatus?: string | null
}

export type Potential = { potential: number; potentialWhy: string; nicheKey?: string; skip?: string }

export function computePotential(d: PotentialInput): Potential {
  const nicheKey = nicheKeyOf(d.niche, d.nicheKey)
  const name = (d.name || '').trim()
  const why: string[] = []

  if (CHAINS.test(name)) return { potential: 0, potentialWhy: 'Сеть или франшиза — сайт делает головной офис', nicheKey, skip: 'chain' }
  const soc = (d.socials || '').split(/\s+/).filter((s) => /^https?:|\.(com|ru|me)\//i.test(s))
  const reach = (d.phone ? 30 : 0) + (d.email ? 10 : 0) + (soc.length ? 6 : 0)
  if (!reach) return { potential: 0, potentialWhy: 'Нет контактов — не с кем говорить', nicheKey, skip: 'nocontact' }
  if (d.siteStatus === 'ok') return { potential: 5, potentialWhy: 'Нормальный сайт уже есть', nicheKey, skip: 'hassite' }

  let p = Math.min(reach, 40)
  why.push(d.phone ? 'есть телефон' : d.email ? 'есть почта' : 'только соцсети')

  const nv = nicheKey ? NICHE_VALUE[nicheKey] ?? 15 : 15
  p += nv
  if (nv >= 28) why.push('дорогой клиент в сфере — сайт быстро окупается')
  else if (nv <= 10) why.push('сфера с низким чеком')

  const need: Record<string, [number, string]> = {
    none: [22, 'сайта нет'],
    social: nicheKey && SOCIAL_OK.has(nicheKey) ? [10, 'работают через соцсети (в этой сфере часто хватает)'] : [20, 'работают только через соцсети'],
    down: [22, 'сайт не работает — теряют клиентов'],
    old: [17, 'сайт устарел'],
    weak: [5, 'сайт слабый'],
  }
  const n = need[d.siteStatus || '']
  if (n) {
    p += n[0]
    why.push(n[1])
  }
  if (GENERIC.test(name) || name.length < 3) {
    p -= 30
    why.push('нет названия-бренда')
  }
  p = Math.max(0, Math.min(100, Math.round(p)))
  return { potential: p, potentialWhy: why.join(', '), nicheKey }
}
