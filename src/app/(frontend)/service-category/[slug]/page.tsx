import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LegacyScripts from '@/components/LegacyScripts'
import { escapeHtmlText } from '@/components/sections/Archive'
import { PfCard } from '@/components/sections/Cards'
import Cta from '@/components/sections/Cta'
import { PageHero } from '@/components/sections/Pages'
import { findBySlug, getProjects, getServices } from '@/lib/payload'
import { buildMeta } from '@/lib/seo'
import { paths } from '@/lib/util'

type P = { params: Promise<{ slug: string }> }
const rid = (v: any) => (typeof v === 'object' ? v?.id : v)

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params
  const t = await findBySlug('service-categories', decodeURIComponent(slug), 0)
  if (!t) return {}
  return buildMeta({
    seo: t.meta,
    path: paths.serviceCategory(t.slug),
    title: t.meta?.title || `${t.name} — услуги и кейсы | GeoBit`,
    description: t.meta?.description || t.description || `Услуги веб-студии GeoBit в категории «${t.name}» — цены, сроки и примеры работ`,
  })
}

export default async function ServiceCategoryPage({ params }: P) {
  const { slug } = await params
  const term = await findBySlug('service-categories', decodeURIComponent(slug), 0)
  if (!term) notFound()
  const [all, projects] = await Promise.all([getServices(), getProjects()])
  const services = all.filter((s: any) => rid(s.category) === term.id)
  const cases = projects.filter((p: any) => (p.serviceCategories || []).some((c: any) => rid(c) === term.id)).slice(0, 6)
  const fa = (i?: string) => (i && /^fa[srbl]? /.test(i) ? i : `fas ${i || 'fa-code'}`)
  return (
    <main id="main" role="main">
      <PageHero
        crumbs={[{ label: 'Услуги', href: '/services/' }, { label: term.name }]}
        tag="Услуги"
        title={`<span class="gradient-text">${escapeHtmlText(term.name)}</span> — услуги и кейсы`}
        subtitle={term.description || `Услуги веб-студии GeoBit в категории «${term.name}» — цены, сроки и примеры работ`}
      />
      {services.length > 0 && (
        <section className="section-padding">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Что мы предлагаем</span>
              <h2 className="section-title" dangerouslySetInnerHTML={{ __html: `Услуги в категории <span class="gradient-text">${escapeHtmlText(term.name)}</span>` }} />
            </div>
            <div className="section-plan-grid" style={{ marginTop: 48 }}>
              {services.map((s: any) => (
                <div key={s.id} style={{ background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <i className={fa(s.icon)} style={{ fontSize: '1.6rem', color: 'var(--accent-cyan)' }}></i>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{s.title}</h3>
                  {(s.shortDesc || s.excerpt) && <p style={{ color: 'var(--gray-2)', fontSize: '0.9rem', lineHeight: 1.65, flex: 1 }}>{s.shortDesc || s.excerpt}</p>}
                  {s.price && <div style={{ fontWeight: 800, color: 'var(--accent-green)' }}>от {s.price}</div>}
                  <a href={paths.service(s.slug)} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
                    Подробнее <i className="fas fa-arrow-right"></i>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {cases.length > 0 && (
        <section className="section-padding portfolio portfolio-page" style={{ background: 'var(--dark-2)' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Кейсы</span>
              <h2 className="section-title" dangerouslySetInnerHTML={{ __html: `Наши работы: <span class="gradient-text">${escapeHtmlText(term.name)}</span>` }} />
            </div>
            <div className="pf-grid" style={{ marginTop: 48 }}>
              {cases.map((p: any) => (
                <PfCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      {!services.length && !cases.length && (
        <section className="section-padding">
          <div className="container">
            <p style={{ textAlign: 'center', color: 'var(--gray-2)' }}>В этой категории пока нет материалов.</p>
          </div>
        </section>
      )}
      <Cta />
      <LegacyScripts src={['/legacy/js/inline-cta-0.js']} />
    </main>
  )
}
