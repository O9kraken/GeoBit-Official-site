import type { Metadata } from 'next'
import LegacyScripts from '@/components/LegacyScripts'
import { FaqSection } from '@/components/Common'
import { PfCard } from '@/components/sections/Cards'
import Cta from '@/components/sections/Cta'
import { PageHero, pageFaqs } from '@/components/sections/Pages'
import { getGlobal, getProjects, usedPortfolioCats } from '@/lib/payload'
import { buildMeta } from '@/lib/seo'


export async function generateMetadata(): Promise<Metadata> {
  const g = await getGlobal<any>('portfolio-page')
  return buildMeta({ path: '/portfolio/', seo: g?.seo, title: 'Портфолио GeoBit' })
}

export default async function PortfolioPage() {
  const [g, projects] = await Promise.all([getGlobal<any>('portfolio-page'), getProjects()])
  const cats = await usedPortfolioCats(projects)
  const faqs = await pageFaqs(g?.faq)
  return (
    <main id="main" role="main">
      <PageHero
        crumbs={[{ label: 'Портфолио' }]}
        tag={g?.tag || 'Наши проекты'}
        title={g?.title || '<span class="gradient-text">Наши </span>работы и проекты'}
        subtitle={g?.subtitle || 'Более 50 реализованных проектов — сайты, дизайн, SEO и логотипы'}
      />
      <section className="section-padding portfolio portfolio-page">
        <div className="container">
          <div className="portfolio-filter">
            <button className="filter-btn active" data-filter="all">
              Все проекты
            </button>
            {cats.map((c: any) => (
              <button key={c.id} className="filter-btn" data-filter={c.slug}>
                {c.name}
              </button>
            ))}
          </div>
          <div className="pf-grid">
            {projects.length ? (
              projects.map((p: any) => <PfCard key={p.id} p={p} />)
            ) : (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--gray-2)' }}>Проекты в портфолио ещё не добавлены.</p>
            )}
          </div>
        </div>
      </section>
      <FaqSection faqs={faqs} />
      <Cta />
      <LegacyScripts src={['/legacy/js/inline-cta-0.js']} />
    </main>
  )
}
