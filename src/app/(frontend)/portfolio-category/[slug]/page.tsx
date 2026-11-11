import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LegacyScripts from '@/components/LegacyScripts'
import { escapeHtmlText } from '@/components/sections/Archive'
import { PfCard } from '@/components/sections/Cards'
import Cta from '@/components/sections/Cta'
import { PageHero } from '@/components/sections/Pages'
import { findBySlug, getProjects, usedPortfolioCats } from '@/lib/payload'
import { buildMeta } from '@/lib/seo'
import { paths } from '@/lib/util'

type P = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params
  const t = await findBySlug('portfolio-categories', decodeURIComponent(slug), 0)
  if (!t) return {}
  return buildMeta({
    seo: t.meta,
    path: paths.portfolioCategory(t.slug),
    title: t.meta?.title || `Проекты: ${t.name} | Портфолио GeoBit`,
    description: t.meta?.description || t.description || `Реализованные проекты студии GeoBit в категории «${t.name}»`,
  })
}

export default async function PortfolioCategoryPage({ params }: P) {
  const { slug } = await params
  const term = await findBySlug('portfolio-categories', decodeURIComponent(slug), 0)
  if (!term) notFound()
  const projects = await getProjects()
  const cats = await usedPortfolioCats(projects)
  const list = projects.filter((p: any) => p.categories?.some((c: any) => (c?.id ?? c) === term.id))
  return (
    <main id="main" role="main">
      <PageHero
        crumbs={[{ label: 'Портфолио', href: '/portfolio/' }, { label: term.name }]}
        tag="Портфолио"
        title={`Проекты: <span class="gradient-text">${escapeHtmlText(term.name)}</span>`}
        subtitle={term.description || `Реализованные проекты студии GeoBit в категории «${term.name}»`}
      />
      <section className="section-padding portfolio portfolio-page">
        <div className="container">
          <div className="portfolio-filter">
            <a href="/portfolio/" className="filter-btn">
              Все проекты
            </a>
            {cats.map((c: any) => (
              <a key={c.id} href={paths.portfolioCategory(c.slug)} className={`filter-btn ${c.id === term.id ? 'active' : ''}`}>
                {c.name}
              </a>
            ))}
          </div>
          <div className="pf-grid">
            {list.length ? list.map((p: any) => <PfCard key={p.id} p={p} />) : <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--gray-2)' }}>В этой категории пока нет проектов.</p>}
          </div>
        </div>
      </section>
      <Cta />
      <LegacyScripts src={['/legacy/js/inline-cta-0.js']} />
    </main>
  )
}
