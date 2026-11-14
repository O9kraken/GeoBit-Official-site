import { asyncCss, av } from '@/lib/asset'
import type { Metadata } from 'next'
import LegacyScripts from '@/components/LegacyScripts'
import Calculator from '@/components/sections/Calculator'
import Cta from '@/components/sections/Cta'
import Dock from '@/components/sections/Dock'
import {
  AboutSection,
  AdvantagesSection,
  BlogPreviewSection,
  Hero,
  HomeFaq,
  PortfolioSection,
  ProcessSection,
  ServicesSection,
  TestimonialsSection,
} from '@/components/sections/Home'
import { getGlobal, getPosts, getProjects, getServices, getTeam, getTestimonials, payload } from '@/lib/payload'
import { buildMeta } from '@/lib/seo'


export async function generateMetadata(): Promise<Metadata> {
  const h = await getGlobal<any>('home')
  return buildMeta({ path: '/', seo: h?.seo, title: 'Создание сайтов в Севастополе и Крыму — GeoBit' })
}

export default async function HomePage() {
  const p = await payload()
  const [h, faqPage, services, projects, team, testimonials, posts, pcats] = await Promise.all([
    getGlobal<any>('home'),
    getGlobal<any>('faq-page'),
    getServices(),
    getProjects(),
    getTeam(),
    getTestimonials(),
    getPosts(3),
    p.find({ collection: 'portfolio-categories', limit: 50 }).then((r) => r.docs),
  ])
  const usedCats = pcats.filter((c: any) => projects.some((pr: any) => pr.categories?.some((x: any) => x.id === c.id)))
  const faqs = h?.faq?.length ? h.faq : faqPage?.faq || []
  const landing = services.find((s: any) => s.slug === 'landing-page')
  return (
    <main id="main" role="main">
      <script dangerouslySetInnerHTML={{ __html: asyncCss([av('/legacy/calculator/calculator.css')]) }} />
      <Hero h={h} landingPrice={landing?.price || undefined} />
      <Dock variant="hero" />
      <ServicesSection h={h} services={services} />
      <Calculator />
      <AboutSection h={h} team={team} />
      <ProcessSection h={h} />
      <PortfolioSection projects={projects} categories={usedCats} />
      <AdvantagesSection items={h?.advantages || []} />
      <TestimonialsSection items={testimonials} />
      <BlogPreviewSection posts={posts} />
      <HomeFaq h={h} faqs={faqs} />
      <Cta />
      <LegacyScripts
        src={[
          '/legacy/js/inline-about-0.js',
          '/legacy/js/inline-process-0.js',
          '/legacy/js/inline-cta-0.js',
          '/legacy/calculator/calculator-data.js',
          '/legacy/calculator/calculator.js',
        ]}
      />
    </main>
  )
}
