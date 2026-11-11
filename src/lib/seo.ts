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

export const articleSchema = (post: any, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.meta?.description || stripTags(post.excerpt || ''),
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  author: { '@type': 'Person', name: post.authorName || 'Георгий' },
  publisher: { '@id': ORG_ID },
  mainEntityOfPage: url,
  image: post.cover ? `${SITE_URL}${mediaUrl(post.cover)}` : undefined,
})

/** Метаданные страницы: SEO-поля документа (плагин) с запасными значениями */
export function buildMeta(opts: {
  path: string
  title?: string | null
  description?: string | null
  image?: any
  noindex?: boolean
  type?: 'website' | 'article'
}): Metadata {
  const url = `${SITE_URL}${opts.path}`
  const img = opts.image ? mediaUrl(opts.image, 'wide') || mediaUrl(opts.image) : ''
  return {
    title: opts.title || 'GeoBit',
    description: opts.description || undefined,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: true } : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      title: opts.title || 'GeoBit',
      description: opts.description || undefined,
      url,
      type: opts.type || 'website',
      locale: 'ru_RU',
      siteName: 'GeoBit',
      images: img ? [{ url: img }] : undefined,
    },
  }
}

export const docMeta = (doc: any, path: string, fallbackTitle?: string, type: 'website' | 'article' = 'website') =>
  buildMeta({
    path,
    title: doc?.meta?.title || fallbackTitle || doc?.title,
    description: doc?.meta?.description,
    image: doc?.meta?.image || doc?.cover || doc?.image,
    noindex: doc?.noindex,
    type,
  })
