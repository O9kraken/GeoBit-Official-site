import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { POSTS_DEC } from '../content/posts-2026-12'
import { toLexical } from '../lib/md-lexical'

/**
 * Четыре новые статьи: создаются черновиками и сразу ставятся в расписание —
 * по одной в неделю, по вторникам в 10:00 МСК, сразу после последней уже запланированной статьи
 * (если запланированных нет — со ближайшего вторника).
 * Тексты — src/content/posts-2026-12.ts, обложки — public/blog-covers/. Идемпотентно.
 */
const TUE_10_MSK = Date.parse('2026-11-17T07:00:00Z') // опорный вторник, 10:00 МСК
const WEEK = 7 * 24 * 3600 * 1000

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const users = await payload.find({ collection: 'users', limit: 1, depth: 0, req, sort: 'createdAt' })
  const cats = await payload.find({ collection: 'categories', where: { slug: { equals: 'dev' } }, limit: 1, depth: 0, req })
  const author = users.docs[0]?.id
  const cat = cats.docs[0]?.id

  // ближайший будущий вторник 10:00 МСК
  let at = TUE_10_MSK
  while (at < Date.now() + 3600 * 1000) at += WEEK
  // …но не раньше, чем через неделю после последней запланированной публикации
  const pending = await payload.find({
    collection: 'payload-jobs' as any,
    where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }] },
    sort: '-waitUntil',
    limit: 1,
    depth: 0,
    req,
  })
  const last = (pending.docs[0] as any)?.waitUntil
  if (last) while (at <= Date.parse(last)) at += WEEK

  for (const p of POSTS_DEC) {
    const exists = await payload.find({ collection: 'posts', where: { slug: { equals: p.slug } }, limit: 1, depth: 0, req, draft: true })
    if (exists.totalDocs) continue

    let coverId: number | string | undefined
    try {
      const data = await readFile(path.join(process.cwd(), 'public', 'blog-covers', p.cover))
      const media = await payload.create({
        collection: 'media',
        req,
        data: { alt: p.coverAlt } as any,
        file: { data, mimetype: 'image/webp', name: p.cover, size: data.length },
      })
      coverId = media.id
    } catch (e) {
      payload.logger.warn(`blog_posts_dec: обложка ${p.cover} не загружена: ${String(e)}`)
    }

    const doc: any = await payload.create({
      collection: 'posts',
      req,
      draft: true,
      data: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        cover: coverId,
        content: toLexical(p.body),
        author,
        authorName: 'Георгий',
        categories: cat ? [cat] : [],
        _status: 'draft',
        meta: {
          title: p.meta.title,
          description: p.meta.description,
          focusKeyword: p.meta.focus,
          answer: p.meta.answer,
          faq: p.faq.map(([q, a]) => ({ q, a })),
        },
      } as any,
    })

    await payload.jobs.queue({
      task: 'schedulePublish',
      input: { type: 'publish', doc: { relationTo: 'posts', value: String(doc.id) } } as any,
      waitUntil: new Date(at),
      req,
    })
    payload.logger.info(`blog_posts_dec: ${p.slug} → ${new Date(at).toISOString()}`)
    at += WEEK
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'posts', where: { slug: { in: POSTS_DEC.map((p) => p.slug) } }, req })
}
