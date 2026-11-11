import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PostArchive } from '@/components/sections/Archive'
import { findBySlug, getTerms, payload } from '@/lib/payload'
import { buildMeta } from '@/lib/seo'
import { paths } from '@/lib/util'

type P = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params
  const t = await findBySlug('categories', decodeURIComponent(slug), 0)
  if (!t) return {}
  return buildMeta({ seo: t.meta, path: paths.category(t.slug), title: t.meta?.title || `${t.name} | Блог GeoBit`, description: t.meta?.description || t.description })
}

export default async function CategoryPage({ params }: P) {
  const { slug } = await params
  const term = await findBySlug('categories', decodeURIComponent(slug), 0)
  if (!term) notFound()
  const p = await payload()
  const [posts, cats] = await Promise.all([
    p.find({ collection: 'posts', where: { categories: { in: [term.id] }, _status: { equals: 'published' } }, sort: '-publishedAt', limit: 100, depth: 1 }),
    getTerms('categories'),
  ])
  const counts = await Promise.all(cats.map(async (c: any) => ({ c, n: (await p.count({ collection: 'posts', where: { categories: { in: [c.id] }, _status: { equals: 'published' } } })).totalDocs })))
  return <PostArchive kind="category" term={term} posts={posts.docs} cats={counts.filter((x) => x.n > 0)} />
}
