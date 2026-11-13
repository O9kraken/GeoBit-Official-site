import { av } from '@/lib/asset'
import type { Metadata } from 'next'
import { FaqSection, Html } from '@/components/Common'
import LegacyScripts from '@/components/LegacyScripts'
import Cta from '@/components/sections/Cta'
import { PageHero, PlanModal, pageFaqs } from '@/components/sections/Pages'
import { getGlobal, getServices } from '@/lib/payload'
import { buildMeta, breadcrumbSchema } from '@/lib/seo'
import { JsonLd } from '@/components/Common'
import { SITE_URL, lines, mediaUrl, paths } from '@/lib/util'


export async function generateMetadata(): Promise<Metadata> {
  const g = await getGlobal<any>('services-page')
  return buildMeta({ path: '/services/', seo: g?.seo, title: 'Услуги веб-студии GeoBit' })
}

const anchorOf = (s: any) => s.anchor || s.slug
const iconOf = (i?: string) => (i && /^fa[srbl]? /.test(i) ? i : `fas ${i || 'fa-code'}`)

export default async function ServicesPage() {
  const [g, services] = await Promise.all([getGlobal<any>('services-page'), getServices()])
  const faqs = await pageFaqs(g?.faq)
  const plans: any[] = g?.plans || []
  return (
    <main id="main" role="main">
      <link rel="stylesheet" href={av("/legacy/css/inline-services-0.css")} precedence="default" />
      <PageHero
        crumbs={[{ label: 'Услуги' }]}
        tag={g?.tag || 'Что мы делаем'}
        title={g?.title || 'Наши <span class="gradient-text">услуги</span>'}
        subtitle={g?.subtitle || 'Полный цикл создания веб-присутствия — от идеи и дизайна до запуска и SEO-продвижения'}
      />
      <section style={{ padding: '24px 0', background: 'var(--dark-2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {services.map((s: any) => (
              <a key={s.id} href={`#${anchorOf(s)}`} className="btn btn-outline btn-sm">
                <i className={iconOf(s.icon)}></i> {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {services.map((s: any, index: number) => {
        const img = mediaUrl(s.image, 'card') || mediaUrl(s.image)
        const num = s.number || String(index + 1).padStart(2, '0')
        return (
          <section key={s.id} className="service-detail" id={anchorOf(s)}>
            <div className="container">
              <div className={`service-detail-grid ${index % 2 ? 'reverse' : ''}`}>
                {s.contentHtml ? (
                  <div className="service-detail-wysiwyg svc-mock">
                    <div className="wysiwyg-content" dangerouslySetInnerHTML={{ __html: s.contentHtml }} />
                  </div>
                ) : img ? (
                  <div className="service-detail-img">
                    <img src={img} alt={s.image?.alt || s.title} width={600} height={500} loading="lazy" />
                  </div>
                ) : null}
                <div className="service-detail-content">
                  <span className="section-tag">
                    {num} — {s.title}
                  </span>
                  <h2>{s.title}</h2>
                  {s.shortDesc && <p className="service-lead">{s.shortDesc}</p>}
                  {s.excerpt && <div dangerouslySetInnerHTML={{ __html: `<p>${s.excerpt}</p>` }} />}
                  {s.features?.length > 0 && (
                    <ul className="service-includes">
                      {s.features.map((f: any, i: number) => (
                        <li key={i}>
                          <i className="fas fa-check"></i> {f.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="service-price-box">
                    <div>
                      <div className="price-label">Стоимость</div>
                      <div className="price-value">{s.price ? `от ${s.price}` : 'По запросу'}</div>
                    </div>
                    {s.duration && (
                      <div>
                        <div className="price-label">Срок</div>
                        <div className="price-value" style={{ fontSize: '1.3rem', color: 'var(--accent-purple)' }}>
                          от {s.duration}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 8, justifyContent: 'space-between' }}>
                    <button type="button" className="btn btn-primary btn-lg" data-plan-open data-service={s.title}>
                      <i className="fas fa-paper-plane"></i> Заказать: {s.title}
                    </button>
                    <a href={paths.service(s.slug)} className="btn btn-outline btn-lg">
                      <i className="fas fa-arrow-right"></i> Подробнее
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )
      })}

      {plans.length > 0 && (
        <section className="section-padding" style={{ background: 'var(--dark-2)' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Тарифы</span>
              <Html as="h2" className="section-title" html={g?.pricingTitle || 'Прозрачные цены'} />
              <p className="section-desc">{g?.pricingSubtitle || 'Выберите подходящий тариф или запросите индивидуальный расчёт'}</p>
            </div>
            <div className="section-plan-grid">
              {plans.map((plan: any, i: number) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--dark-3)',
                    border: `1px solid ${plan.featured ? 'rgba(124,0,255,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '36px 28px',
                    position: 'relative',
                    ...(plan.featured ? { boxShadow: '0 0 40px rgba(124,0,255,0.15)' } : {}),
                  }}
                >
                  {plan.featured && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,var(--accent-purple),var(--accent-pink))', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                      Популярный
                    </div>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-main)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
                  {plan.desc && <p style={{ color: 'var(--gray-2)', fontSize: '0.875rem', marginBottom: 20 }}>{plan.desc}</p>}
                  <div style={{ fontFamily: 'var(--font-main)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: 24 }}>{plan.price}</div>
                  {lines(plan.features).length > 0 && (
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                      {lines(plan.features).map((line, j) => {
                        const off = line.startsWith('×')
                        const text = off ? line.slice(1).trim() : line
                        return (
                          <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: off ? 'var(--gray)' : 'var(--white-3)' }}>
                            <i className={`fas ${off ? 'fa-times' : 'fa-check'}`} style={{ color: off ? 'var(--gray)' : 'var(--accent-green)', fontSize: '0.75rem', flexShrink: 0 }}></i>
                            {text}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} data-plan-open data-plan={plan.name} data-price={plan.price}>
                    {plan.btnText || 'Выбрать тариф'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <FaqSection faqs={faqs} />
      <Cta />
      <PlanModal />
      <JsonLd data={breadcrumbSchema([{ name: 'Главная', url: `${SITE_URL}/` }, { name: 'Услуги', url: `${SITE_URL}/services/` }])} />
      <LegacyScripts src={['/legacy/js/inline-plan-modal-0.js', '/legacy/js/inline-cta-0.js']} />
    </main>
  )
}
