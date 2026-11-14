import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * 1) Снимает с публикации временные отзывы из старой темы (не настоящие клиенты) — записи остаются в админке.
 * 2) Title/description страниц логотипа и SEO-продвижения под спрос Вордстата
 *    («заказать логотип» ~120/мес в Крыму, «продвижение сайта» ~185 / Севастополь ~40).
 *    Меняется, только если в админке остались прежние значения.
 */
const FAKE = ['Алексей Громов', 'Ольга Яковлева', 'Марина Соколова']

const META: { slug: string; oldTitle: string; title: string; description: string; focusKeyword: string }[] = [
  {
    slug: 'design-logo',
    oldTitle: 'Разработка логотипа на заказ в Севастополе | GeoBit',
    title: 'Заказать логотип в Севастополе и Крыму — от 15 000 ₽ | GeoBit',
    description: 'Разработка логотипа на заказ: несколько концепций, финал в векторе, версии для сайта, вывески и соцсетей. Примеры: AUTOBAHN, KODE23, baggyWEB. От 15 000 ₽.',
    focusKeyword: 'заказать логотип',
  },
  {
    slug: 'seo-prodvizhenie',
    oldTitle: 'SEO-продвижение сайтов в Севастополе и Крыму | GeoBit',
    title: 'Продвижение сайта в Севастополе и Крыму — SEO в Яндексе | GeoBit',
    description: 'SEO-продвижение сайта в Яндексе и Google: аудит, семантика, тексты, техника и ежемесячный отчёт в Метрике. Белые методы, без накруток. От 18 000 ₽/мес.',
    focusKeyword: 'продвижение сайта',
  },
]

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const t = await payload.find({ collection: 'testimonials', where: { name: { in: FAKE } }, limit: 10, depth: 0, req })
  for (const d of t.docs as any[]) {
    if (d.published) {
      await payload.update({ collection: 'testimonials', id: d.id, data: { published: false } as any, req })
      payload.logger.info(`trust_and_meta: отзыв «${d.name}» снят с публикации`)
    }
  }
  for (const m of META) {
    const doc: any = (await payload.find({ collection: 'services', where: { slug: { equals: m.slug } }, limit: 1, depth: 0, req })).docs[0]
    if (!doc) continue
    const meta = { ...(doc.meta || {}) }
    if (meta.title && meta.title.trim() !== m.oldTitle) continue
    meta.title = m.title
    meta.description = m.description
    meta.focusKeyword = m.focusKeyword
    await payload.update({ collection: 'services', id: doc.id, data: { meta } as any, req })
    payload.logger.info(`trust_and_meta: services/${m.slug} обновлён`)
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const t = await payload.find({ collection: 'testimonials', where: { name: { in: FAKE } }, limit: 10, depth: 0, req })
  for (const d of t.docs as any[]) await payload.update({ collection: 'testimonials', id: d.id, data: { published: true } as any, req })
}
