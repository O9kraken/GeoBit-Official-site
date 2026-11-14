import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * SEO-аудит 14.11.2026: title/description вне нормы (title 30–70, description до 160 символов).
 * Меняем только то, что сейчас пустое, слишком короткое или слишком длинное.
 */
type Fix = { collection: 'projects' | 'posts'; slug: string; title?: string; description?: string; faq?: [string, string][] }

const FIXES: Fix[] = [
  {
    collection: 'projects',
    slug: 'kofe-bu',
    title: 'Сайт для кофейни «Кофе Бу» — электронное меню с фильтрами | GeoBit',
    description: 'Кейс GeoBit: сайт-визитка и электронное меню для кофейни «Кофе Бу». Категории и фильтры, удобно с телефона, меню и цены сотрудники меняют сами в админке.',
  },
  {
    collection: 'projects',
    slug: 'noir-river',
    description: 'Собственный проект GeoBit: онлайн-клуб с 14 карточными и настольными играми в браузере — покер, дурак, шахматы. Раздачи на сервере, игра на фишки.',
  },
  {
    collection: 'projects',
    slug: 'zero-stack',
    description: 'Собственный проект GeoBit: учебная платформа по веб-разработке — Frontend, Backend, Fullstack. Уроки, задачи с автопроверкой в редакторе кода, уровни.',
  },
  {
    collection: 'posts',
    slug: 'wordpress-ili-konstruktor-sajtov-2026',
    title: 'WordPress или конструктор сайтов в 2026: что выбрать бизнесу | GeoBit',
    description: 'Сравниваем WordPress и конструкторы (Tilda, Flexbe, Creatium): цена, SEO, ИИ-инструменты, рост сайта. Что выбрать бизнесу в 2026 году.',
    // по этому запросу статья уже получает показы в Google
    faq: [
      [
        'WordPress — это конструктор сайтов или нет?',
        'Нет. WordPress — это система управления сайтом (CMS): её устанавливают на свой хостинг, сайт и данные принадлежат владельцу, а возможности расширяются темами, плагинами и своим кодом. Конструктор (Tilda, Flexbe) — сервис по подписке: сайт собирают из готовых блоков на чужой платформе, и перенести его к другому подрядчику целиком нельзя.',
      ],
    ],
  },
]

const badTitle = (t?: string | null) => !t || t.trim().length < 30 || t.trim().length > 70
const badDesc = (d?: string | null) => !d || d.trim().length < 100 || d.trim().length > 165

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const f of FIXES) {
    const found = await payload.find({ collection: f.collection, where: { slug: { equals: f.slug } }, limit: 1, depth: 0, req, draft: false })
    const doc: any = found.docs[0]
    if (!doc) continue
    const meta = { ...(doc.meta || {}) }
    let changed = false
    if (f.title && badTitle(meta.title)) {
      meta.title = f.title
      changed = true
    }
    if (f.description && badDesc(meta.description)) {
      meta.description = f.description
      changed = true
    }
    if (f.faq) {
      const faq = Array.isArray(meta.faq) ? [...meta.faq] : []
      for (const [q, a] of f.faq) {
        if (!faq.some((x: any) => String(x.q || '').toLowerCase() === q.toLowerCase())) {
          faq.unshift({ q, a })
          changed = true
        }
      }
      meta.faq = faq
    }
    if (changed) {
      await payload.update({ collection: f.collection, id: doc.id, data: { meta } as any, req, context: { skipRevalidate: true } })
      payload.logger.info(`seo_meta_fix: ${f.collection}/${f.slug} обновлён`)
    }
  }
}

export async function down(_: MigrateDownArgs): Promise<void> {}
