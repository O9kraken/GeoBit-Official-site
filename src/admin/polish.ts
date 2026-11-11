/**
 * Мелкие улучшения админки без изменения схемы базы:
 *  — строки повторяющихся блоков подписываются по-русски («Цифра 01», а не «Hero Stat 01»);
 *  — у услуг, кейсов, статей и страниц появляется кнопка «Предпросмотр» на сайте.
 */
import type { CollectionConfig, Field, GlobalConfig } from 'payload'
import { SITE_URL, paths } from '../lib/util'

const SINGULAR: Record<string, string> = {
  heroStats: 'Цифра', heroBadges: 'Плашка', aboutFeatures: 'Преимущество', processSteps: 'Этап', advantages: 'Преимущество',
  faq: 'Вопрос', plans: 'Тариф', stats: 'Цифра', values: 'Ценность', tech: 'Технология', timeline: 'Событие',
  why: 'Причина', guarantees: 'Гарантия', features: 'Пункт', points: 'Пункт', steps: 'Этап', gallery: 'Скриншот',
  media: 'Блок', results: 'Результат', header: 'Пункт меню', footerNav: 'Ссылка', footerServices: 'Ссылка',
  footerLegal: 'Ссылка', types: 'Тип сайта', speeds: 'Срок', designs: 'Вариант дизайна', addons: 'Опция', blocks: 'Блок',
}

function walk(fields: Field[]): Field[] {
  return fields.map((f: any) => {
    if (f.type === 'array') {
      const singular = SINGULAR[f.name] || (typeof f.label === 'string' ? f.label : undefined)
      return { ...f, labels: f.labels || (singular ? { singular, plural: typeof f.label === 'string' ? f.label : singular } : undefined), fields: walk(f.fields) }
    }
    if (f.type === 'tabs') return { ...f, tabs: f.tabs.map((t: any) => ({ ...t, fields: walk(t.fields) })) }
    if (f.fields) return { ...f, fields: walk(f.fields) }
    return f
  })
}

/** Группы боковой панели: от частых действий к редким */
const GROUP: Record<string, string> = {
  leads: 'Заявки', subscribers: 'Заявки',
  pages: 'Страницы сайта',
  home: 'Страницы сайта', 'services-page': 'Страницы сайта', 'about-page': 'Страницы сайта', 'contacts-page': 'Страницы сайта',
  'portfolio-page': 'Страницы сайта', 'blog-page': 'Страницы сайта', 'faq-page': 'Страницы сайта',
  services: 'Контент', projects: 'Контент', posts: 'Контент', team: 'Контент', testimonials: 'Контент', media: 'Контент',
  'service-categories': 'Рубрики', 'portfolio-categories': 'Рубрики', categories: 'Рубрики', tags: 'Рубрики',
  settings: 'Настройки', 'seo-settings': 'Настройки', navigation: 'Настройки', calculator: 'Настройки', redirects: 'Настройки', users: 'Настройки',
}

/** Какую страницу сайта показывать в предпросмотре глобалов */
const GLOBAL_URL: Record<string, string> = {
  home: '/', 'services-page': '/services/', 'about-page': '/about/', 'contacts-page': '/contacts/',
  'portfolio-page': '/portfolio/', 'blog-page': '/blog/', 'faq-page': '/faq/', settings: '/contacts/', navigation: '/', calculator: '/#calculator',
}

const PREVIEW: Record<string, (slug: string) => string> = {
  services: paths.service,
  projects: paths.project,
  posts: paths.post,
  pages: paths.page,
}

export const polishCollection = (c: CollectionConfig): CollectionConfig => ({
  ...c,
  fields: walk(c.fields),
  admin: {
    ...c.admin,
    group: GROUP[c.slug] ?? c.admin?.group,
    ...(PREVIEW[c.slug]
      ? {
          preview: (doc: any) => (doc?.slug ? `${SITE_URL}${PREVIEW[c.slug](doc.slug)}` : null),
          livePreview: { url: ({ data }: any) => `${SITE_URL}${data?.slug ? PREVIEW[c.slug](data.slug) : '/'}` },
        }
      : {}),
  },
})

export const polishGlobal = (g: GlobalConfig): GlobalConfig => ({
  ...g,
  fields: walk(g.fields),
  admin: {
    ...g.admin,
    group: GROUP[g.slug] ?? g.admin?.group,
    ...(GLOBAL_URL[g.slug] ? { livePreview: { url: () => `${SITE_URL}${GLOBAL_URL[g.slug]}` } } : {}),
  },
})
