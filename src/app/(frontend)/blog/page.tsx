import type { Metadata } from 'next'
import { FaqSection } from '@/components/Common'
import LegacyScripts from '@/components/LegacyScripts'
import { BlogCard } from '@/components/sections/Cards'
import { Newsletter, PageHero, pageFaqs } from '@/components/sections/Pages'
import { getGlobal, getTerms, payload } from '@/lib/payload'
import { buildMeta } from '@/lib/seo'

const PER_PAGE = 9

type P = { searchParams: Promise<{ cat?: string; s?: string; paged?: string }> }

export async function generateMetadata({ searchParams }: P): Promise<Metadata> {
  const g = await getGlobal<any>('blog-page')
  const sp = await searchParams
  return {
    ...(await buildMeta({ path: '/blog/', seo: g?.seo, title: 'Блог GeoBit' })),
    // фильтры и поиск не индексируем — канонической остаётся /blog/
    ...(sp.cat || sp.s || sp.paged ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function BlogPage({ searchParams }: P) {
  const sp = await searchParams
  const cat = (sp.cat || '').slice(0, 80)
  const search = (sp.s || '').slice(0, 100)
  const paged = Math.max(1, parseInt(sp.paged || '1', 10) || 1)
  const [g, cats, p] = await Promise.all([getGlobal<any>('blog-page'), getTerms('categories'), payload()])
  const catDoc = cat ? cats.find((c: any) => c.slug === cat) : null
  const where: any = { and: [{ _status: { equals: 'published' } }] }
  if (cat) where.and.push({ categories: { in: catDoc ? [catDoc.id] : [-1] } })
  if (search) where.and.push({ or: [{ title: { like: search } }, { excerpt: { like: search } }] })
  const res = await p.find({ collection: 'posts', where, sort: '-publishedAt', limit: PER_PAGE, page: paged, depth: 1 })
  // счётчики рубрик (hide_empty, по убыванию)
  const counts = await Promise.all(
    cats.map(async (c: any) => ({ c, n: (await p.count({ collection: 'posts', where: { categories: { in: [c.id] }, _status: { equals: 'published' } } })).totalDocs })),
  )
  const catList = counts.filter((x) => x.n > 0).sort((a, b) => b.n - a.n)
  const faqs = await pageFaqs()
  const qs = (page: number) => {
    const q = new URLSearchParams()
    if (cat) q.set('cat', cat)
    if (search) q.set('s', search)
    if (page > 1) q.set('paged', String(page))
    const s = q.toString()
    return `/blog/${s ? '?' + s : ''}`
  }
  return (
    <main id="main" role="main">
      <PageHero
        className="page-hero blog-hero"
        titleClass="page-hero-title"
        subtitleClass="page-hero-subtitle"
        crumbs={[{ label: 'Блог' }]}
        tag={g?.tag || 'Блог о сайтах и продвижении'}
        title={g?.title || 'Полезные статьи о веб-разработке'}
        subtitle={g?.subtitle || 'Делимся опытом, лайфхаками и трендами в мире веб-разработки и дизайна'}
      />
      <section className="blog-filters-section">
        <div className="container">
          <div className="blog-controls">
            <form className="blog-search-form" action="/blog/" method="GET">
              <div className="search-input-wrap">
                <i className="fas fa-search"></i>
                <input type="text" name="s" className="search-input" placeholder="Поиск по статьям..." defaultValue={search} />
                {cat && <input type="hidden" name="cat" value={cat} />}
              </div>
            </form>
            <div className="blog-cat-filters">
              <a href="/blog/" className={`cat-filter-btn ${!cat ? 'active' : ''}`}>
                Все
              </a>
              {catList.map(({ c, n }) => (
                <a key={c.id} href={`/blog/?cat=${encodeURIComponent(c.slug)}`} className={`cat-filter-btn ${cat === c.slug ? 'active' : ''}`}>
                  {c.name}
                  <span className="cat-count">{n}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="blog-grid-section section-padding">
        <div className="container">
          {res.docs.length ? (
            <>
              <div className="blog-grid" id="blogGrid">
                {res.docs.map((post: any, i: number) => (
                  <BlogCard key={post.id} post={post} featured={i === 0 && paged === 1 && !search && !cat} />
                ))}
              </div>
              {res.totalPages > 1 && (
                <div className="blog-pagination">
                  {res.hasPrevPage && (
                    <span className="page-btn">
                      <a className="prev page-numbers" href={qs(paged - 1)}>
                        <i className="fas fa-chevron-left"></i>
                      </a>
                    </span>
                  )}
                  {Array.from({ length: res.totalPages }, (_, i) => i + 1).map((n) => (
                    <span key={n} className="page-btn">
                      {n === paged ? (
                        <span aria-current="page" className="page-numbers current">
                          {n}
                        </span>
                      ) : (
                        <a className="page-numbers" href={qs(n)}>
                          {n}
                        </a>
                      )}
                    </span>
                  ))}
                  {res.hasNextPage && (
                    <span className="page-btn">
                      <a className="next page-numbers" href={qs(paged + 1)}>
                        <i className="fas fa-chevron-right"></i>
                      </a>
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="blog-empty">
              <div className="blog-empty__icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>Статьи не найдены</h3>
              <p>Попробуйте изменить параметры поиска или выбрать другую категорию.</p>
              <a href="/blog/" className="btn btn-primary">
                Все статьи
              </a>
            </div>
          )}
        </div>
      </section>

      <Newsletter title={g?.newsletterTitle || undefined} text={g?.newsletterText || undefined} />
      <FaqSection faqs={faqs} />
      <LegacyScripts src={['/legacy/js/inline-blog-0.js', '/legacy/js/newsletter.js']} />
    </main>
  )
}
