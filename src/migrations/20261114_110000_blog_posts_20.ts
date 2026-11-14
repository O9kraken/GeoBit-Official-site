import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { SeedPost } from '../content/posts-2026-11'
import { POSTS_A } from '../content/posts-2027-a'
import { POSTS_B } from '../content/posts-2027-b'
import { toLexical } from '../lib/md-lexical'

/**
 * 20 статей: создаются черновиками и ставятся в расписание так, чтобы в блоге выходило
 * по 2 статьи в неделю — по вторникам и пятницам в 10:00 МСК. Дни, на которые уже
 * запланирована публикация, пропускаются. Порядок выбран так, чтобы статья выходила
 * не раньше тех, на которые она ссылается. Тексты — src/content/posts-2027-*.ts,
 * обложки — public/blog-covers/. Идемпотентно.
 */
const ORDER = [
  'sajt-i-152-fz-chek-list',
  'inostrannye-servisy-na-sajte-chto-zamenit',
  'kakie-messendzhery-stavit-na-sajt',
  'skorost-sajta-i-zayavki',
  'kartochka-v-yandeks-biznese',
  'mobilnaya-versiya-sajta-chek-list',
  'otzyvy-klientov-na-sajte',
  'sajt-k-kurortnomu-sezonu-v-krymu',
  'pervyj-ekran-sajta-kak-napisat',
  'lokalnoe-seo-top-yandeksa-v-svoem-gorode',
  'onlajn-zapis-i-bronirovanie-na-sajte',
  'svoj-sajt-ili-tolko-socseti',
  'kviz-sajt-kogda-rabotaet',
  'priem-oplaty-na-sajte',
  'hosting-dlya-sajta-v-rossii',
  'kak-vybrat-domen-i-ne-poteryat',
  'yandeks-metrika-dlya-vladelca-biznesa',
  'redizajn-sajta-kogda-pora',
  'nejroseti-dlya-malogo-biznesa-sajt-i-teksty',
  'podderzhka-sajta-posle-zapuska',
]

const DAY = 24 * 3600 * 1000
const TUE_10_MSK = Date.parse('2026-11-17T07:00:00Z') // опорный вторник, 10:00 МСК
const dayKey = (t: number) => new Date(t + 3 * 3600 * 1000).toISOString().slice(0, 10) // дата по Москве

/** Слоты вт/пт 10:00 МСК начиная с ближайшего будущего, без уже занятых дней */
function* slots(taken: Set<string>) {
  let week = TUE_10_MSK
  while (week + 3 * DAY < Date.now() + 3600 * 1000) week += 7 * DAY
  for (;;) {
    for (const t of [week, week + 3 * DAY]) {
      if (t < Date.now() + 3600 * 1000) continue
      if (taken.has(dayKey(t))) continue
      yield t
    }
    week += 7 * DAY
  }
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const all = new Map<string, SeedPost>([...POSTS_A, ...POSTS_B].map((p) => [p.slug, p]))
  const users = await payload.find({ collection: 'users', limit: 1, depth: 0, req, sort: 'createdAt' })
  const cats = await payload.find({ collection: 'categories', where: { slug: { equals: 'dev' } }, limit: 1, depth: 0, req })
  const author = users.docs[0]?.id
  const cat = cats.docs[0]?.id

  // дни, на которые публикация уже запланирована
  const pending = await payload.find({
    collection: 'payload-jobs' as any,
    where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }] },
    limit: 500,
    depth: 0,
    req,
  })
  const taken = new Set<string>(pending.docs.map((j: any) => j.waitUntil).filter(Boolean).map((w: string) => dayKey(Date.parse(w))))
  const next = slots(taken)

  for (const slug of ORDER) {
    const p = all.get(slug)
    if (!p) continue
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
      payload.logger.warn(`blog_posts_20: обложка ${p.cover} не загружена: ${String(e)}`)
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

    const at = next.next().value as number
    await payload.jobs.queue({
      task: 'schedulePublish',
      input: { type: 'publish', doc: { relationTo: 'posts', value: String(doc.id) } } as any,
      waitUntil: new Date(at),
      req,
    })
    payload.logger.info(`blog_posts_20: ${p.slug} → ${new Date(at).toISOString()}`)
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'posts', where: { slug: { in: ORDER } }, req })
}
