import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Расписание для новых статей: по одной в неделю, по вторникам в 10:00 по Москве.
 * Ставит в очередь только статьи, которые ещё черновики и для которых публикация не запланирована.
 * Дальше расписание видно и меняется в админке: статья → стрелка у «Опубликовать» → «Запланировать публикацию».
 */
const ORDER = ['sajt-dlya-gostevogo-doma', 'lending-ili-sajt-vizitka', 'skolko-vremeni-delayut-sajt', 'kak-vybrat-veb-studiyu']
const FIRST = Date.parse('2026-11-17T07:00:00Z') // вторник 17.11.2026, 10:00 МСК
const WEEK = 7 * 24 * 3600 * 1000

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // если миграция идёт позже — не планируем в прошлое
  let at = FIRST
  while (at < Date.now() + 3600 * 1000) at += WEEK
  for (const slug of ORDER) {
    const r = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true, req })
    const doc: any = r.docs[0]
    if (!doc || doc._status === 'published') continue
    const queued = await payload.find({
      collection: 'payload-jobs' as any,
      where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { 'input.doc.value': { equals: String(doc.id) } }, { completedAt: { exists: false } }] },
      limit: 1,
      depth: 0,
      req,
    })
    if (queued.totalDocs) continue
    await payload.jobs.queue({
      task: 'schedulePublish',
      input: { type: 'publish', doc: { relationTo: 'posts', value: String(doc.id) } } as any,
      waitUntil: new Date(at),
      req,
    })
    payload.logger.info(`schedule_posts: ${slug} → ${new Date(at).toISOString()}`)
    at += WEEK
  }
}

export async function down({}: MigrateDownArgs): Promise<void> {}
