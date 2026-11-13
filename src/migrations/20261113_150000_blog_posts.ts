import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { POSTS } from '../content/posts-2026-11'
import { toLexical } from '../lib/md-lexical'

/**
 * Четыре статьи блога с обложками — создаются ЧЕРНОВИКАМИ (опубликовать в админке после вычитки).
 * Тексты — src/content/posts-2026-11.ts, обложки — public/blog-covers/.
 * Создаются только отсутствующие статьи. Идемпотентно.
 */

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const users = await payload.find({ collection: 'users', limit: 1, depth: 0, req, sort: 'createdAt' })
  const cats = await payload.find({ collection: 'categories', where: { slug: { equals: 'dev' } }, limit: 1, depth: 0, req })
  const author = users.docs[0]?.id
  const cat = cats.docs[0]?.id

  for (const p of POSTS) {
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
      payload.logger.warn(`blog_posts: обложка ${p.cover} не загружена: ${String(e)}`)
    }

    await payload.create({
      collection: 'posts',
      req,
      draft: true,
      data: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        cover: coverId,
        content: toLexical(p.body),
        publishedAt: new Date().toISOString(),
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
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'posts', where: { slug: { in: POSTS.map((p) => p.slug) } }, req })
}
