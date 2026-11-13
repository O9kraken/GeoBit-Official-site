import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { POSTS } from '../content/posts-2026-11'

/**
 * Четыре статьи блога с обложками — создаются ЧЕРНОВИКАМИ (опубликовать в админке после вычитки).
 * Тексты — src/content/posts-2026-11.ts, обложки — public/blog-covers/.
 * Создаются только отсутствующие статьи. Идемпотентно.
 */

// ---- мини-markdown → Lexical ----
const textNode = (text: string, format = 0) => ({ type: 'text', text, format, mode: 'normal', style: '', detail: 0, version: 1 })

function inline(src: string): any[] {
  const out: any[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(textNode(src.slice(last, m.index)))
    if (m[1]) out.push(textNode(m[1], 1))
    else
      out.push({
        type: 'link',
        id: `gbl${Date.now().toString(36)}${i++}`,
        fields: { url: m[3], newTab: false, linkType: 'custom' },
        children: [textNode(m[2])],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 3,
      })
    last = m.index + m[0].length
  }
  if (last < src.length) out.push(textNode(src.slice(last)))
  return out
}

const block = (type: string, children: any[], extra: Record<string, unknown> = {}) => ({ type, children, direction: 'ltr', format: '', indent: 0, version: 1, ...extra })

function toLexical(md: string) {
  const children: any[] = []
  for (const raw of md.trim().split(/\n\s*\n/)) {
    const b = raw.trim()
    const lines = b.split('\n').map((l) => l.trim())
    if (b.startsWith('### ')) children.push(block('heading', inline(b.slice(4)), { tag: 'h3' }))
    else if (b.startsWith('## ')) children.push(block('heading', inline(b.slice(3)), { tag: 'h2' }))
    else if (lines.every((l) => l.startsWith('- ')))
      children.push(
        block('list', lines.map((l, i) => block('listitem', inline(l.slice(2)), { value: i + 1 })), { listType: 'bullet', tag: 'ul', start: 1 }),
      )
    else if (lines.every((l) => /^\d+\.\s/.test(l)))
      children.push(
        block('list', lines.map((l, i) => block('listitem', inline(l.replace(/^\d+\.\s/, '')), { value: i + 1 })), { listType: 'number', tag: 'ol', start: 1 }),
      )
    else children.push(block('paragraph', inline(lines.join(' ')), { textFormat: 0, textStyle: '' }))
  }
  return { root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } }
}

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
