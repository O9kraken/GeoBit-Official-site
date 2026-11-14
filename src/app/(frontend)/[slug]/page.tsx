import { av } from '@/lib/asset'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Breadcrumbs, JsonLd, faqSchema } from '@/components/Common'
import { AnswerBox, DocFaq } from '@/components/sections/Aeo'
import LegacyScripts from '@/components/LegacyScripts'
import { Newsletter, richHtml } from '@/components/sections/Pages'
import { findBySlug, getPosts, payload, cmsRedirect, postAuthor } from '@/lib/payload'
import { articleSchema, breadcrumbSchema, docMeta } from '@/lib/seo'
import { SITE_URL, formatDateLong, formatDateRu, mediaUrl, paths } from '@/lib/util'


type P = { params: Promise<{ slug: string }> }

/** Один адрес /<slug>/ — как в WordPress: и статьи блога, и обычные страницы */
async function resolve(slug: string) {
  const s = decodeURIComponent(slug)
  const post = await findBySlug('posts', s, 2)
  if (post && post._status === 'published') return { kind: 'post' as const, doc: post }
  const page = await findBySlug('pages', s, 1)
  if (page) return { kind: 'page' as const, doc: page }
  return null
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params
  const r = await resolve(slug)
  if (!r) return {}
  return docMeta(r.doc, paths.page(r.doc.slug), r.doc.title, r.kind === 'post' ? 'article' : 'website')
}

export default async function SlugPage({ params }: P) {
  const { slug } = await params
  const r = await resolve(slug)
  if (!r) {
    const to = await cmsRedirect(`/${slug}/`)
    if (to) permanentRedirect(to)
    notFound()
  }
  return r.kind === 'post' ? <PostView post={r.doc} /> : <PageView page={r.doc} />
}

/** index.php → «Generic fallback» (юридические страницы) */
function PageView({ page }: { page: any }) {
  return (
    <main id="main" role="main">
      <section className="page-hero">
        <div className="container">
          <div className="page-hero-content">
            <span className="section-tag">Страница</span>
            <h1 className="page-hero-title">{page.title}</h1>
          </div>
        </div>
      </section>
      <section className="section-padding">
        <div className="container">
          <AnswerBox text={page.meta?.answer} />
          <div className="post-body" dangerouslySetInnerHTML={{ __html: richHtml(page.content) }} />
          <DocFaq faq={page.meta?.faq} />
          {page.meta?.faq?.length > 0 && <JsonLd data={faqSchema(page.meta.faq.slice(0, 7))} />}
        </div>
      </section>
    </main>
  )
}

/** single.php */
async function PostView({ post }: { post: any }) {
  const all = await getPosts()
  const cat = post.categories?.[0]
  const url = `${SITE_URL}${paths.post(post.slug)}`
  const catIds = (post.categories || []).map((c: any) => c.id)
  const related = all.filter((x: any) => x.id !== post.id && x.categories?.some((c: any) => catIds.includes(c.id))).slice(0, 3)
  const recent = all.filter((x: any) => x.id !== post.id).slice(0, 5)
  const cover = mediaUrl(post.cover, 'wide') || mediaUrl(post.cover)
  const author = await postAuthor(post)
  const authorImg = mediaUrl(author.avatar, 'thumb') || mediaUrl(author.avatar)
  const meta = { fontSize: '0.82rem', color: 'var(--gray)' }
  return (
    <main id="main" role="main">
      <link rel="stylesheet" href={av("/legacy/css/inline-single-0.css")} precedence="default" />
      <section className="section-padding single-section">
        <div className="container">
          <Breadcrumbs items={[...(cat ? [{ label: cat.name, href: paths.category(cat.slug) }] : []), { label: post.title }]} />
          <div className="single-layout">
            <article className="single-article">
              {cover && (
                <div className="single-featured">
                  <img src={cover} alt={post.cover?.alt || post.title} className="single-featured-img" width={1600} height={900} style={{ width: '100%', height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                {cat && (
                  <a href={paths.category(cat.slug)} style={{ background: 'linear-gradient(135deg,var(--accent-purple),var(--accent-pink))', color: 'var(--white)', fontSize: '0.75rem', fontWeight: 700, padding: '5px 14px', borderRadius: 100, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {cat.name}
                  </a>
                )}
                <span style={meta}>
                  <i className="far fa-calendar"></i> {formatDateLong(post.publishedAt)}
                </span>
                <span style={meta}>
                  <i className="far fa-clock"></i> {post.readingTime || 1} мин
                </span>
                <span style={meta}>
                  <i className="far fa-user"></i> {author.name}
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-main)', fontSize: 'clamp(1.6rem,3.5vw,2.8rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 28 }}>{post.title}</h1>
              <AnswerBox text={post.meta?.answer} />
              <div className="post-content" style={{ color: 'var(--white-3)', lineHeight: 1.9, fontSize: '1.05rem' }} dangerouslySetInnerHTML={{ __html: richHtml(post.content) }} />
              <DocFaq faq={post.meta?.faq} />

              {post.tags?.length > 0 && (
                <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {post.tags.map((t: any) => (
                    <a key={t.id} href={paths.tag(t.slug)} className="gb-post-tag">
                      #{t.name}
                    </a>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: 12 }}>Поделиться статьёй:</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener" className="btn btn-sm btn-outline">
                    <i className="fab fa-telegram"></i> Telegram
                  </a>
                  <a href={`https://vk.com/share.php?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener" className="btn btn-sm btn-outline">
                    <i className="fab fa-vk"></i> VK
                  </a>
                </div>
              </div>

              <div style={{ marginTop: 48, background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 28, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {authorImg ? (
                  <img src={authorImg} alt={author.name} width={80} height={80} loading="lazy" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(124,0,255,0.4)', flexShrink: 0 }} />
                ) : (
                  <span className="testimonial-initials" style={{ width: 80, height: 80, fontSize: '1.6rem', border: '2px solid rgba(124,0,255,0.4)', flexShrink: 0 }} aria-hidden="true">
                    {author.name.slice(0, 1)}
                  </span>
                )}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{author.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-2)', lineHeight: 1.6 }}>{author.about || 'Автор блога GeoBit'}</p>
                </div>
              </div>

              {related.length > 0 && (
                <div className="single-related">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>Читайте также</h3>
                  <div className="single-related-grid">
                    {related.map((rp: any) => (
                      <a key={rp.id} href={paths.post(rp.slug)} className="gb-related-card">
                        <img src={mediaUrl(rp.cover, 'card') || mediaUrl(rp.cover)} alt={rp.title} width={400} height={220} style={{ width: '100%', height: 160, objectFit: 'cover' }} loading="lazy" />
                        <div style={{ padding: 16 }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4 }}>{rp.title}</h3>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <aside className="single-sidebar">
              <div style={{ background: 'linear-gradient(135deg,rgba(124,0,255,0.15),rgba(0,229,255,0.05))', border: '1px solid rgba(124,0,255,0.3)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>Нужен сайт?</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-2)', marginBottom: 20 }}>Обсудим ваш проект бесплатно</p>
                <a href="/contacts/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Оставить заявку
                </a>
              </div>
              {recent.length > 0 && (
                <div style={{ background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Свежие статьи</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {recent.map((rr: any) => (
                      <a key={rr.id} href={paths.post(rr.slug)} className="gb-recent-link" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <img src={mediaUrl(rr.cover, 'thumb') || mediaUrl(rr.cover)} alt={rr.title} width={60} height={60} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} loading="lazy" />
                        <div>
                          <h5 style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4 }}>{rr.title}</h5>
                          <span style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>{formatDateRu(rr.publishedAt)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
      <Newsletter />
      <JsonLd data={articleSchema(post, url, author)} />
      {post.meta?.faq?.length > 0 && <JsonLd data={faqSchema(post.meta.faq.slice(0, 7))} />}
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Главная', url: `${SITE_URL}/` },
          ...(cat ? [{ name: cat.name, url: `${SITE_URL}${paths.category(cat.slug)}` }] : []),
          { name: post.title, url },
        ])}
      />
      <LegacyScripts src={['/legacy/js/newsletter.js']} />
    </main>
  )
}
