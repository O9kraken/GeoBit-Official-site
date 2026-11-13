import { Newsletter, PageHero } from '@/components/sections/Pages'
import Cta from '@/components/sections/Cta'
import LegacyScripts from '@/components/LegacyScripts'
import { formatDateLong, mediaUrl, paths } from '@/lib/util'

/** category.php / archive.php — список статей рубрики или тега */
export function PostArchive({
  kind,
  term,
  posts,
  cats,
}: {
  kind: 'category' | 'tag'
  term: any
  posts: any[]
  cats: { c: any; n: number }[]
}) {
  const desc = term.description || (kind === 'category' ? 'Статьи по теме — делимся знаниями о веб-разработке, дизайне и SEO' : 'Делимся знаниями о веб-разработке, дизайне и SEO')
  return (
    <main id="main" role="main">
      <PageHero
        crumbs={kind === 'category' ? [{ label: 'Блог', href: '/blog/' }, { label: term.name }] : [{ label: `Метка: ${term.name}` }]}
        tag="Блог"
        title={`Статьи: <span class="gradient-text">${escape(term.name)}</span>`}
        subtitle={desc}
      />
      <section className="section-padding">
        <div className="container">
          <div className="portfolio-filter" style={{ marginBottom: 48 }}>
            <a href="/blog/" className={`filter-btn ${kind === 'tag' ? 'active' : ''}`}>
              Все статьи
            </a>
            {cats.map(({ c }) => (
              <a key={c.id} href={paths.category(c.slug)} className={`filter-btn ${kind === 'category' && c.id === term.id ? 'active' : ''}`}>
                {c.name}
              </a>
            ))}
          </div>
          <div className="blog-grid-full">
            {posts.length ? (
              posts.map((post: any) => {
                const cat = post.categories?.[0]
                return (
                  <article key={post.id} className={`blog-card${kind === 'tag' ? ' blog-card-filterable' : ''}`} data-category={kind === 'tag' ? cat?.slug || '' : undefined}>
                    <div className="blog-img">
                      <a href={paths.post(post.slug)}>
                        <img src={mediaUrl(post.cover, 'card') || mediaUrl(post.cover)} alt={post.title} width={600} height={360} loading="lazy" />
                      </a>
                    </div>
                    <div className="blog-content">
                      <div className="blog-meta">
                        {cat && (
                          <a href={paths.category(cat.slug)} className="blog-tag blog-tag--meta">
                            {cat.name}
                          </a>
                        )}
                        <span>
                          <i className="far fa-calendar"></i> {formatDateLong(post.publishedAt)}
                        </span>
                        <span>
                          <i className="far fa-clock"></i> {post.readingTime || 1} мин
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.1rem' }}>
                        <a href={paths.post(post.slug)}>{post.title}</a>
                      </h2>
                      <p>{post.excerpt}</p>
                      <a href={paths.post(post.slug)} className="blog-link">
                        Читать далее <i className="fas fa-arrow-right"></i>
                      </a>
                    </div>
                  </article>
                )
              })
            ) : (
              <p style={{ gridColumn: 'span 3', textAlign: 'center', color: 'var(--gray-2)' }}>{kind === 'category' ? 'В этой рубрике пока нет статей.' : 'Статьи пока не добавлены.'}</p>
            )}
          </div>
        </div>
      </section>
      <Newsletter />
      <Cta />
      <LegacyScripts src={['/legacy/js/newsletter.js', '/legacy/js/inline-cta-0.js']} />
    </main>
  )
}

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
export { escape as escapeHtmlText }
