import type { Metadata } from 'next'
import { FaqList, JsonLd, faqSchema } from '@/components/Common'
import LegacyScripts from '@/components/LegacyScripts'
import Cta from '@/components/sections/Cta'
import { PageHero } from '@/components/sections/Pages'
import { getGlobal } from '@/lib/payload'
import { buildMeta } from '@/lib/seo'


export async function generateMetadata(): Promise<Metadata> {
  const g = await getGlobal<any>('faq-page')
  return buildMeta({
    path: '/faq/',
    seo: g?.seo,
    title: g?.seo?.title || 'Вопросы и ответы | GeoBit',
    description: g?.seo?.description || 'Ответы на частые вопросы о разработке сайта в студии GeoBit: стоимость, сроки, договор, поддержка.',
    image: g?.seo?.image,
  })
}

export default async function FaqPage() {
  const g = await getGlobal<any>('faq-page')
  const faqs = g?.faq || []
  return (
    <main id="main" role="main">
      <PageHero
        crumbs={[{ label: 'FAQ' }]}
        tag={g?.tag || 'Вопросы и ответы'}
        title={g?.title || 'Частые <span class="gradient-text">вопросы</span>'}
        subtitle={g?.subtitle || 'Собрали ответы на вопросы, которые чаще всего задают перед началом работы. Не нашли свой — напишите нам.'}
      />
      <section className="faq section-padding" id="faq">
        <div className="container">
          {faqs.length ? (
            <FaqList faqs={faqs} />
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--gray)' }}>Вопросы пока не добавлены.</p>
          )}
        </div>
      </section>
      <Cta />
      {faqs.length > 0 && <JsonLd data={faqSchema(faqs)} />}
      <LegacyScripts src={['/legacy/js/inline-cta-0.js']} />
    </main>
  )
}
