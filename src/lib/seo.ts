import type { Metadata } from 'next'
import { SITE_URL, mediaUrl, stripTags } from './util'

const ORG_ID = `${SITE_URL}/#organization`

export function organizationSchema(s: any) {
  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    addressLocality: 'Севастополь',
    addressRegion: 'Севастополь',
    addressCountry: 'RU',
  }
  if (s?.address) address.streetAddress = s.address
  if (s?.postalCode) address.postalCode = s.postalCode
  const org: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['ProfessionalService', 'LocalBusiness'],
    '@id': ORG_ID,
    name: 'GeoBit',
    url: `${SITE_URL}/`,
    email: s?.email,
    telephone: s?.phone,
    priceRange: s?.priceRange || '₽₽',
    image: `${SITE_URL}/logo.svg`,
    logo: `${SITE_URL}/logo.svg`,
    areaServed: [
      { '@type': 'City', name: 'Севастополь' },
      { '@type': 'AdministrativeArea', name: 'Крым' },
      { '@type': 'Country', name: 'Россия' },
    ],
    address,
    serviceType: ['Создание сайтов', 'Разработка сайтов', 'Дизайн сайтов', 'Разработка логотипа', 'SEO-продвижение'],
    sameAs: [s?.telegramUrl, s?.vkUrl, s?.instagramUrl, s?.maxUrl].filter(Boolean),
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '10:00',
      closes: '19:00',
    },
  }
  if (s?.geoLat && s?.geoLng) org.geo = { '@type': 'GeoCoordinates', latitude: s.geoLat, longitude: s.geoLng }
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: 'GeoBit',
    inLanguage: 'ru-RU',
    publisher: { '@id': ORG_ID },
  }
  return [org, website]
}

export const serviceSchema = (svc: any, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: svc.title,
  description: stripTags(svc.shortDesc || svc.excerpt || ''),
  provider: { '@id': ORG_ID },
  areaServed: [
    { '@type': 'City', name: 'Севастополь' },
    { '@type': 'Country', name: 'Россия' },
  ],
  url,
  ...(svc.price
    ? { offers: { '@type': 'Offer', priceCurrency: 'RUB', price: String(svc.price).replace(/[^\d]/g, ''), priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'RUB', minPrice: String(svc.price).replace(/[^\d]/g, '') } } }
    : {}),
})

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Главная', url: `${SITE_URL}/` }, ...items].map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
  })),
})

export const articleSchema = (post: any, url: string, author?: { name: string; about?: string; avatar?: any }) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.meta?.description || stripTags(post.excerpt || ''),
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  inLanguage: 'ru-RU',
  author: {
    '@type': 'Person',
    name: author?.name || post.authorName || 'Георгий',
    ...(author?.about ? { jobTitle: author.about } : {}),
    ...(author?.avatar ? { image: `${SITE_URL}${mediaUrl(author.avatar, 'thumb') || mediaUrl(author.avatar)}` } : {}),
    url: `${SITE_URL}/about/`,
  },
  publisher: { '@id': ORG_ID },
  mainEntityOfPage: url,
  image: post.cover ? `${SITE_URL}${mediaUrl(post.cover)}` : undefined,
  ...(post.meta?.focusKeyword ? { keywords: [post.meta.focusKeyword, ...String(post.meta.synonyms || '').split(',').map((x: string) => x.trim()).filter(Boolean)].join(', ') } : {}),
  // фрагменты, которые голосовые помощники и ИИ могут зачитывать как ответ
  ...(post.meta?.answer ? { speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.gb-answer'] } } : {}),
})

/** Общие SEO-настройки сайта (шаблон title, картинка по умолчанию) */
async function seoSettings(): Promise<any> {
  try {
    const { payload } = await import('./payload')
    const p = await payload()
    return await p.findGlobal({ slug: 'seo-settings' as any, depth: 1 })
  } catch {
    return {}
  }
}

/** Метка над заголовком карточки для соцсетей — по разделу сайта */
function ogKind(path: string, type?: string): string {
  if (path === '/') return 'Веб-студия в Крыму'
  if (type === 'article' || /^\/(blog|category|tag)\//.test(path)) return 'Блог'
  if (/^\/services\/[^/]+\/$/.test(path)) return 'Услуга'
  if (/^\/(services|service-category)\//.test(path)) return 'Услуги'
  if (/^\/project\//.test(path)) return 'Кейс'
  if (/^\/(portfolio|portfolio-category)\//.test(path)) return 'Портфолио'
  if (path === '/about/') return 'О студии'
  if (path === '/contacts/') return 'Контакты'
  if (path === '/faq/') return 'FAQ'
  return 'Документ'
}

/** Адрес фирменной карточки /og/ для страницы (см. src/app/og/route.tsx) */
function ogCard(o: { path: string; title: string; description?: string | null; image?: any; type?: string; badge?: string | null }): string {
  const title =
    stripTags(o.title)
      .split(/\s+\|\s+/)[0]
      .replace(/\s*[—–-]\s*(веб-студия\s*)?GeoBit\s*$/i, '')
      .trim() || 'GeoBit'
  const cover = o.image ? mediaUrl(o.image, 'wide') || mediaUrl(o.image) : ''
  const q = new URLSearchParams()
  q.set('t', title)
  if (o.description) q.set('s', stripTags(String(o.description)))
  q.set('k', ogKind(o.path, o.type))
  if (o.badge) q.set('b', /^от\s/i.test(String(o.badge)) ? String(o.badge) : `от ${o.badge}`)
  if (cover && cover.startsWith('/')) q.set('img', cover.split('?')[0])
  let h = 0
  for (const ch of q.toString()) h = (h * 31 + ch.charCodeAt(0)) | 0
  q.set('v', (h >>> 0).toString(36))
  return `${SITE_URL}/og/?${q.toString()}`
}

/**
 * Метаданные страницы. Источник — поля вкладки «SEO и ИИ» (seo/meta),
 * запасные значения — заголовок страницы, шаблон title и картинка по умолчанию.
 */
export async function buildMeta(opts: {
  path: string
  seo?: any
  title?: string | null
  /** Заголовок страницы — подставляется в шаблон, если title не задан */
  pageTitle?: string | null
  description?: string | null
  image?: any
  noindex?: boolean
  type?: 'website' | 'article'
  /** Плашка на карточке для соцсетей, например цена услуги */
  badge?: string | null
}): Promise<Metadata> {
  const st = await seoSettings()
  const seo = opts.seo || {}
  const tpl: string = st?.titleTemplate || '%s — GeoBit'
  const title = String(seo.title || opts.title || (opts.pageTitle ? tpl.replace('%s', stripTags(opts.pageTitle)) : '') || 'GeoBit').trim()
  const description = seo.description || opts.description || undefined
  // Картинка для соцсетей: если в «SEO и ИИ» выбрана своя — берём её, иначе фирменная карточка /og/
  const own = seo.image ? mediaUrl(seo.image, 'wide') || mediaUrl(seo.image) : ''
  const img = own || ogCard({ ...opts, title: stripTags(opts.pageTitle || seo.title || opts.title || 'GeoBit'), description })
  const url = `${SITE_URL}${opts.path}`
  const canonical = String(seo.canonical || '').trim() || url
  const noindex = Boolean(seo.noindex || opts.noindex)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: !seo.nofollow }
      : { index: true, follow: !seo.nofollow, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    openGraph: {
      title,
      description,
      url: canonical,
      type: opts.type || 'website',
      locale: 'ru_RU',
      siteName: 'GeoBit',
      images: img ? [{ url: img, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: img ? 'summary_large_image' : 'summary', title, description, images: img ? [img] : undefined },
  }
}

export const docMeta = (doc: any, path: string, fallbackTitle?: string, type: 'website' | 'article' = 'website') =>
  buildMeta({
    path,
    seo: doc?.meta,
    pageTitle: fallbackTitle || doc?.title || doc?.name,
    image: doc?.cover || doc?.image,
    noindex: doc?.noindex,
    type,
    badge: doc?.price,
  })
