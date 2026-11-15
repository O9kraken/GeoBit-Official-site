import type { Payload } from 'payload'
import { SITE_URL } from '../util'
import { nicheKeyOf } from './potential'

/** Какой продукт предлагать в сфере и куда вести (отраслевая страница сайта, если есть) */
const PLAN: Record<string, { service: string; landing?: string; pitch: string; benefits: string[] }> = {
  cafe: { service: 'site-vizit', landing: 'dlya-kafe', pitch: 'сайт с меню, фото зала и кнопкой брони или заказа', benefits: ['меню с ценами, которое легко обновлять', 'бронь стола и заказ в один клик', 'выход в Яндекс Карты и поиск по запросам «кафе рядом»'] },
  hotel: { service: 'site-vizit', landing: 'dlya-gostinic', pitch: 'сайт с номерами, ценами и прямым бронированием без комиссии агрегаторов', benefits: ['прямые брони без 15–20% комиссии площадкам', 'номера, цены и календарь занятости', 'показ в поиске по запросам «гостевой дом + ваш город»'] },
  dentist: { service: 'corp-site', landing: 'dlya-stomatologii', pitch: 'сайт клиники с услугами, ценами, врачами и онлайн-записью', benefits: ['онлайн-запись к врачу круглосуточно', 'прайс и врачи — то, что смотрят перед выбором клиники', 'доверие: лицензии, отзывы, фото работ'] },
  clinic: { service: 'corp-site', pitch: 'сайт медцентра с услугами, врачами и записью', benefits: ['онлайн-запись', 'прайс и специалисты', 'документы и лицензии на виду'] },
  beauty: { service: 'site-vizit', landing: 'dlya-salona-krasoty', pitch: 'сайт салона с прайсом, мастерами, портфолио и онлайн-записью', benefits: ['онлайн-запись без переписки в директе', 'прайс и портфолио мастеров', 'новые клиенты из поиска и карт, не только из соцсетей'] },
  auto: { service: 'site-vizit', landing: 'dlya-avtoservisa', pitch: 'сайт автосервиса с услугами, ценами и записью на ремонт', benefits: ['запись на ремонт онлайн', 'понятные цены на работы', 'заявки из поиска по запросам «автосервис рядом»'] },
  fitness: { service: 'site-vizit', pitch: 'сайт клуба с расписанием, абонементами и пробным занятием', benefits: ['расписание и абонементы', 'заявка на пробное занятие', 'трафик из поиска'] },
  tour: { service: 'corp-site', landing: 'dlya-turagentstva', pitch: 'сайт с турами и экскурсиями, ценами и бронированием', benefits: ['каталог туров и экскурсий', 'бронь и предоплата онлайн', 'поток туристов из поиска в сезон'] },
  legal: { service: 'site-vizit', landing: 'dlya-yurista', pitch: 'сайт юриста с услугами, кейсами и формой консультации', benefits: ['заявки на консультацию', 'доверие: опыт, кейсы, отзывы', 'поиск по запросам «юрист + город»'] },
  build: { service: 'corp-site', landing: 'dlya-stroitelnoj-kompanii', pitch: 'сайт с объектами, ценами и калькулятором стоимости', benefits: ['портфолио объектов', 'калькулятор стоимости и заявка на замер', 'дорогие заказы из поиска'] },
  edu: { service: 'landing-page', landing: 'dlya-onlajn-shkoly', pitch: 'сайт с программами, расписанием и записью на занятия', benefits: ['программы и цены', 'запись на пробный урок', 'набор учеников круглый год'] },
  photo: { service: 'site-vizit', landing: 'dlya-fotografa', pitch: 'сайт-портфолио с пакетами съёмок и бронированием даты', benefits: ['портфолио, которое не теряется в ленте', 'пакеты и цены', 'бронь даты съёмки'] },
  vet: { service: 'site-vizit', pitch: 'сайт клиники с услугами, ценами и записью', benefits: ['запись к ветеринару', 'цены на услуги', 'поиск по запросам «ветклиника рядом»'] },
  shop: { service: 'site-vizit', pitch: 'сайт-витрина с каталогом и заказом', benefits: ['каталог товаров', 'заказ и доставка', 'покупатели из поиска'] },
}

const FINDING: Record<string, string> = {
  none: 'У вас нет сайта — клиенты, которые ищут в Яндексе и Google, уходят к конкурентам с сайтом.',
  social: 'Вы работаете через соцсети. Это хорошо, но из поиска Яндекса и Google вас почти не находят, а запись и вопросы теряются в переписке.',
  down: 'Ваш сайт сейчас не открывается — те, кто переходят на него из поиска и карт, видят ошибку и уходят.',
  old: 'Ваш сайт устарел: ',
  weak: 'Ваш сайт можно заметно усилить: ',
}

export type Offer = {
  company: string
  city?: string
  finding: string
  pitch: string
  benefits: string[]
  service?: { title: string; price?: string; duration?: string; features: string[]; url: string }
  landingUrl?: string
  cases: { title: string; url: string; label?: string }[]
  studio: { phone?: string; telegram?: string; max?: string; email?: string }
  kpUrl?: string
  message: string
  subject: string
}

export async function buildOffer(payload: Payload, d: any): Promise<Offer> {
  const key = nicheKeyOf(d.niche, d.nicheKey) || 'shop'
  const plan = PLAN[key] || PLAN.shop
  const redesign = ['old', 'weak', 'down'].includes(d.siteStatus)
  const [svc, cases, settings] = await Promise.all([
    payload.find({ collection: 'services', where: { slug: { equals: plan.service } }, limit: 1, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'projects', where: { and: [{ _status: { equals: 'published' } }, { isFeatured: { equals: true } }] }, sort: 'order', limit: 3, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] as any[] })),
    payload.findGlobal({ slug: 'settings', depth: 0, overrideAccess: true }) as Promise<any>,
  ])
  const s: any = svc.docs[0]
  let finding = FINDING[d.siteStatus] || FINDING.none
  if (d.siteStatus === 'old' || d.siteStatus === 'weak') finding += `${(d.siteNotes || '').toLowerCase()}. Такой сайт хуже ранжируется и отпугивает клиентов с телефона.`
  const kpUrl = d.kpToken ? `${SITE_URL}/kp/${d.kpToken}/` : undefined
  const me = 'Георгий'
  const hook =
    d.siteStatus === 'none' || d.siteStatus === 'social'
      ? `заметил, что у «${d.name}» нет своего сайта`
      : d.siteStatus === 'down'
        ? `заметил, что сайт «${d.name}» сейчас не открывается`
        : `посмотрел сайт «${d.name}» — ${(d.siteNotes || 'есть что улучшить').toLowerCase()}`
  const message = [
    `Здравствуйте! Меня зовут ${me}, я делаю сайты для бизнеса в Крыму (студия GeoBit).`,
    `${hook[0].toUpperCase()}${hook.slice(1)}.`,
    `Подготовил короткое предложение: ${redesign ? 'обновлённый ' : ''}${plan.pitch}${s?.price ? `, ориентир по цене — от ${String(s.price).replace(/^от\s*/i, '')}` : ''}.`,
    kpUrl ? `Посмотреть: ${kpUrl}` : '',
    'Если неинтересно — просто не отвечайте, больше не побеспокою.',
  ]
    .filter(Boolean)
    .join('\n\n')
  return {
    company: d.name,
    city: d.city,
    finding,
    pitch: redesign ? `Новый ${plan.pitch}` : plan.pitch[0].toUpperCase() + plan.pitch.slice(1),
    benefits: plan.benefits,
    service: s
      ? { title: s.title, price: s.price, duration: s.duration, features: (s.features || []).map((f: any) => f.text).slice(0, 6), url: `${SITE_URL}/services/${s.slug}/` }
      : undefined,
    landingUrl: plan.landing ? `${SITE_URL}/sozdanie-sajtov/${plan.landing}/` : undefined,
    cases: (cases.docs as any[]).map((c) => ({ title: c.title, url: `${SITE_URL}/project/${c.slug}/`, label: c.categoryLabel })),
    studio: { phone: settings?.phone, telegram: settings?.telegramUrl, max: settings?.maxUrl, email: settings?.email },
    kpUrl,
    message,
    subject: `Сайт для «${d.name}» — короткое предложение`,
  }
}
