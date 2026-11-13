import { AnswerBox } from '@/components/sections/Aeo'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Breadcrumbs, FaqSection, JsonLd } from '@/components/Common'
import LegacyScripts from '@/components/LegacyScripts'
import { PfCard } from '@/components/sections/Cards'
import Cta from '@/components/sections/Cta'
import { pageFaqs } from '@/components/sections/Pages'
import { findBySlug, getProjects, cmsRedirect } from '@/lib/payload'
import { breadcrumbSchema, docMeta } from '@/lib/seo'
import { SITE_URL, autop, mediaUrl, paths } from '@/lib/util'


type P = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params
  const p = await findBySlug('projects', decodeURIComponent(slug))
  return p ? docMeta(p, paths.project(p.slug)) : {}
}

export default async function ProjectPage({ params }: P) {
  const { slug } = await params
  const p = await findBySlug('projects', decodeURIComponent(slug))
  if (!p) {
    const to = await cmsRedirect(`/project/${slug}/`)
    if (to) permanentRedirect(to)
    notFound()
  }
  const [all, faqs] = await Promise.all([getProjects(), pageFaqs()])
  const catName = p.categories?.[0]?.name || ''
  const results: any[] = (p.results || []).filter((r: any) => r.value)
  const resultTxt = results[0]?.label || ''
  const cover = mediaUrl(p.cover, 'wide') || mediaUrl(p.cover)
  const displayCat = p.categoryLabel || catName
  const tsr = [
    { label: 'Задача', text: p.challenge, mod: 'task' },
    { label: 'Решение', text: p.solution, mod: 'solution' },
    { label: 'Результат', text: resultTxt, mod: 'result' },
  ].filter((i) => i.text)
  // «Другие проекты»: в WP было orderby=rand — берём стабильный порядок, чтобы страница кэшировалась
  const others = all.filter((x: any) => x.id !== p.id).slice(0, 3)
  const info = [
    ['Клиент', p.client],
    ['Тип проекта', displayCat],
    ['Год', p.year],
    ['Сроки', p.duration],
  ].filter(([, v]) => v)
  return (
    <main id="main" role="main">
      <section className="section-padding pf-single">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Портфолио', href: '/portfolio/' }, { label: p.title }]} />
          <div className="pf-single-hero">
            <div className="pf-single-cover">{cover && <img src={cover} decoding="async" alt={p.title} width={800} height={600} loading="lazy" />}</div>
            <div>
              {catName && <span className="section-tag pf-single-tag">{catName}</span>}
              <h1 className="pf-single-title">{p.title}</h1>
              <p className="pf-single-lead">{p.excerpt}</p>
              <AnswerBox text={p.meta?.answer} />
              {results.length > 0 && (
                <div className="pf-single-metrics">
                  {results.map((r, i) => (
                    <div key={i} className="pf-single-metric">
                      <div className="pf-single-metric-val">{r.value}</div>
                      {r.label && <div className="pf-single-metric-lbl">{r.label}</div>}
                    </div>
                  ))}
                </div>
              )}
              <div className="pf-single-info">
                <div className="pf-single-info-list">
                  {info.map(([k, v]) => (
                    <div key={k} className="pf-single-info-row">
                      <span className="k">{k}</span>
                      <span className="v">{v}</span>
                    </div>
                  ))}
                  {p.technologies && (
                    <div className="pf-single-info-row">
                      <span className="k">Технологии</span>
                      <span className="v accent">{p.technologies}</span>
                    </div>
                  )}
                </div>
              </div>
              {p.url && (
                <a href={p.url} className="btn btn-primary btn-lg" target="_blank" rel="noopener">
                  <i className="fas fa-external-link-alt"></i> Открыть сайт
                </a>
              )}
            </div>
          </div>

          {tsr.length > 0 && (
            <div className="pf-ts-grid">
              {tsr.map((i) => (
                <div key={i.mod} className={`pf-ts-card pf-ts-card--${i.mod}`}>
                  <h3>{i.label}</h3>
                  <p>{i.text}</p>
                </div>
              ))}
            </div>
          )}

          {p.media?.length > 0 && (
            <div className="pf-single-block">
              <h3 className="pf-single-section-title">Как это выглядит</h3>
              <div className="pf-media-blocks">
                {p.media.map((b: any, i: number) => (
                  <div key={i} className="pf-media-block">
                    {b.image && (
                      <div className="pf-media-block__shot">
                        <img src={mediaUrl(b.image, 'wide') || mediaUrl(b.image)} alt={p.title} loading="lazy" decoding="async" />
                      </div>
                    )}
                    <div className="pf-media-block__desc" dangerouslySetInnerHTML={{ __html: autop(b.desc) }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.gallery?.length > 0 && (
            <div className="pf-single-block">
              <h3 className="pf-single-section-title">Скриншоты проекта</h3>
              <div className="pf-single-gallery">
                {p.gallery.map((g: any, i: number) => (
                  <img key={i} src={mediaUrl(g.image, 'wide') || mediaUrl(g.image)} alt={g.image?.alt || p.title} loading="lazy" />
                ))}
              </div>
            </div>
          )}

          <div className="pf-single-others">
            <h3 className="pf-single-section-title">Другие проекты</h3>
            <div className="pf-grid">
              {others.map((o: any) => (
                <PfCard key={o.id} p={o} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <FaqSection faqs={p.meta?.faq?.length ? p.meta.faq : faqs} />
      <Cta />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Главная', url: `${SITE_URL}/` },
          { name: 'Портфолио', url: `${SITE_URL}/portfolio/` },
          { name: p.title, url: `${SITE_URL}${paths.project(p.slug)}` },
        ])}
      />
      <LegacyScripts src={['/legacy/js/inline-cta-0.js']} />
    </main>
  )
}
