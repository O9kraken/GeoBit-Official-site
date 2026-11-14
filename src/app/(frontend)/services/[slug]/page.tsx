import { AnswerBox } from '@/components/sections/Aeo'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Breadcrumbs, JsonLd, faqSchema, topFaq } from '@/components/Common'
import LegacyScripts from '@/components/LegacyScripts'
import { PlanModal } from '@/components/sections/Pages'
import { findBySlug, getProjects, getServices, cmsRedirect } from '@/lib/payload'
import { breadcrumbSchema, docMeta, serviceSchema } from '@/lib/seo'
import { SITE_URL, lines, mediaUrl, paths } from '@/lib/util'


type P = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params
  const s = await findBySlug('services', decodeURIComponent(slug))
  return s ? docMeta(s, paths.service(s.slug)) : {}
}

const grad = { background: 'linear-gradient(135deg,var(--accent-pink),var(--accent-purple),var(--accent-cyan))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' } as const
const iconOf = (i?: string) => (i && /^fa[srbl]? /.test(i) ? i : `fas ${i || 'fa-code'}`)

export default async function ServicePage({ params }: P) {
  const { slug } = await params
  const s = await findBySlug('services', decodeURIComponent(slug))
  if (!s) {
    const to = await cmsRedirect(`/services/${slug}/`)
    if (to) permanentRedirect(to)
    notFound()
  }
  const [allServices, projects] = await Promise.all([getServices(), getProjects()])
  const catId = typeof s.category === 'object' ? s.category?.id : s.category
  const catName = typeof s.category === 'object' ? s.category?.name : ''
  const img = mediaUrl(s.image, 'wide') || mediaUrl(s.image)
  const features: string[] = (s.features || []).map((f: any) => f.text).filter(Boolean)
  const steps: any[] = s.steps || []
  const plans: any[] = s.plans || []
  const faqs: any[] = topFaq([...(s.faq || []), ...(s.meta?.faq || [])].filter((f: any) => f.q))
  const ex = s.explainer || {}
  const exPoints: string[] = (ex.points || []).map((p: any) => p.text).filter(Boolean)
  const exParas = splitParas(ex.text || '')
  const exLead = exParas[0] || ''
  const exRest = exParas.slice(1)
  const exTitle = highlightTitle(ex.title || '')

  // Примеры работ: портфолио той же категории услуг, добиваем свежими до 4 (service-cases.php)
  const relId = (v: any) => (typeof v === 'object' ? v?.id : v)
  let cases = catId ? projects.filter((p: any) => (p.serviceCategories || []).some((c: any) => relId(c) === catId)).slice(0, 4) : []
  if (cases.length < 4) {
    const rest = [...projects]
      .filter((p: any) => !cases.includes(p))
      .sort((a: any, b: any) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
    cases = [...cases, ...rest.slice(0, 4 - cases.length)]
  }
  // Смежные услуги (service-related.php)
  let related = allServices.filter((x: any) => x.id !== s.id && catId && relId(x.category) === catId)
  if (related.length < 6) related = [...related, ...allServices.filter((x: any) => x.id !== s.id && !related.includes(x)).slice(0, 8 - related.length)]

  return (
    <main id="main" role="main">
      <section className="section-padding" style={{ paddingTop: 140 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Услуги', href: '/services/' }, { label: s.title }]} />

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 64, alignItems: 'center' }} className="service-hero-grid">
            <div>
              {(catName || s.number) && (
                <span className="section-tag" style={{ marginBottom: 16, display: 'inline-block' }}>
                  {catName || s.number}
                </span>
              )}
              <h1 style={{ fontFamily: 'var(--font-main)', fontSize: 'clamp(2rem,4vw,3.4rem)', fontWeight: 800, lineHeight: 1.12, marginBottom: 20 }}>{s.title}</h1>
              {s.shortDesc && <p className="service-lead">{s.shortDesc}</p>}
              <AnswerBox text={s.meta?.answer} />
              {(s.price || s.duration) && (
                <div style={{ display: 'flex', gap: 32, marginBottom: 36, flexWrap: 'wrap' }}>
                  {s.price && (
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: 4 }}>Стоимость</div>
                      <div style={{ fontFamily: 'var(--font-main)', fontSize: '1.8rem', fontWeight: 800, ...grad }}>от {s.price}</div>
                    </div>
                  )}
                  {s.duration && (
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: 4 }}>Срок</div>
                      <div style={{ fontFamily: 'var(--font-main)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--white)' }}>от {s.duration}</div>
                    </div>
                  )}
                </div>
              )}
              <a href="#service-cta" className="btn btn-primary btn-lg">
                <span>Обсудить проект</span>
                <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', minHeight: 320, background: 'radial-gradient(ellipse at center,rgba(123,47,255,0.18),rgba(10,8,18,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {img ? (
                <img src={img} alt={s.title} width={600} height={500} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
              ) : (
                <i className={iconOf(s.icon)} style={{ fontSize: '6rem', ...grad }}></i>
              )}
            </div>
          </div>

          {(ex.title || ex.text) && (
            <div className="svc-explainer-v2">
              <div className="svc-ex2-top">
                <div className="svc-ex2-head">
                  <span className="section-tag">
                    <i className="fas fa-circle-info"></i> Разбираемся
                  </span>
                  {ex.title && <h2 className="svc-ex2-title">{exTitle}</h2>}
                </div>
                {exLead && <div className="svc-ex2-lead" dangerouslySetInnerHTML={{ __html: exLead }} />}
              </div>
              {(exRest.length > 0 || exPoints.length > 0) && (
                <div className="svc-ex2-grid">
                  {exRest.map((html, i) => (
                    <div className="svc-ex2-card" key={i}>
                      <span className={`svc-ex2-ico gb-tone-${EX_TONES[i % EX_TONES.length]}`}>
                        <i className={`fas ${EX_ICONS[i % EX_ICONS.length]}`}></i>
                      </span>
                      <div className="svc-ex2-text" dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                  ))}
                  {exPoints.length > 0 && (
                    <div className="svc-ex2-card svc-ex2-card--accent">
                      <span className="svc-ex2-ico gb-tone-cyan">
                        <i className="fas fa-bolt"></i>
                      </span>
                      <h3>Коротко</h3>
                      <ul>
                        {exPoints.map((pt, i) => (
                          <li key={i}>
                            <i className="fas fa-check"></i>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {features.length > 0 && (
            <div style={{ marginTop: 80 }}>
              <h2 className="section-title" style={{ marginBottom: 40 }}>Что входит в услугу</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, margin: '0 auto' }} className="service-features-grid">
                {features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '20px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
                    <i className="fas fa-check" style={{ color: 'var(--accent-cyan)', marginTop: 4 }}></i>
                    <span style={{ color: 'var(--gray-2)', lineHeight: 1.6 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(s.problem || s.solution) && (
            <div style={{ marginTop: 80, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="service-ps-grid">
              {s.problem && (
                <div style={{ padding: 32, borderRadius: 18, background: 'rgba(255,51,153,0.06)', border: '1px solid rgba(255,51,153,0.2)' }}>
                  <h3 style={{ fontFamily: 'var(--font-main)', fontSize: '1.3rem', marginBottom: 14, color: 'var(--accent-pink)' }}>
                    <i className="fas fa-circle-exclamation"></i> Проблема
                  </h3>
                  <p style={{ color: 'var(--gray-2)', lineHeight: 1.7 }}>{s.problem}</p>
                </div>
              )}
              {s.solution && (
                <div style={{ padding: 32, borderRadius: 18, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}>
                  <h3 style={{ fontFamily: 'var(--font-main)', fontSize: '1.3rem', marginBottom: 14, color: 'var(--accent-cyan)' }}>
                    <i className="fas fa-circle-check"></i> Решение
                  </h3>
                  <p style={{ color: 'var(--gray-2)', lineHeight: 1.7 }}>{s.solution}</p>
                </div>
              )}
            </div>
          )}

          {steps.length > 0 && (
            <div style={{ marginTop: 80 }}>
              <h2 className="section-title" style={{ marginBottom: 40 }}>Как мы работаем</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }} className="service-steps-grid">
                {steps.map((st, i) => (
                  <div key={i} style={{ padding: '28px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                    <div style={{ fontFamily: 'var(--font-main)', fontSize: '2.2rem', fontWeight: 800, ...grad, marginBottom: 10 }}>{String(i + 1).padStart(2, '0')}</div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{st.title}</h4>
                    {st.text && <p style={{ color: 'var(--gray-2)', fontSize: '0.95rem', lineHeight: 1.6 }}>{st.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.casesEnable !== false && cases.length > 0 && (
            <div className="svc-cases">
              <div className="svc-cases-head">
                <span className="section-tag">Портфолио</span>
                <h2 className="section-title">{s.casesTitle || 'Примеры наших работ'}</h2>
              </div>
              <div className="svc-cases-grid">
                {cases.map((p: any) => {
                  const cover = mediaUrl(p.cover, 'card') || mediaUrl(p.cover)
                  const tag = p.serviceCategories?.[0]?.name || p.categoryLabel
                  const words = (p.excerpt || '').split(/\s+/).filter(Boolean)
                  return (
                    <a key={p.id} href={paths.project(p.slug)} className="svc-case-card">
                      <div className="svc-case-img">
                        {cover && <img src={cover} alt={p.title} width={800} height={600} loading="lazy" decoding="async" />}
                        <span className="svc-case-arrow">
                          <i className="fas fa-arrow-right"></i>
                        </span>
                      </div>
                      <div className="svc-case-body">
                        {tag && <span className="svc-case-tag">{tag}</span>}
                        <h3 className="svc-case-title">{p.title}</h3>
                        {words.length > 0 && <p className="svc-case-desc">{words.slice(0, 14).join(' ') + (words.length > 14 ? '…' : '')}</p>}
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {plans.length > 0 && (
            <div style={{ marginTop: 80 }}>
              <h2 className="section-title" style={{ marginBottom: 40 }}>Тарифы</h2>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plans.length},1fr)`, gap: 24, margin: '0 auto' }} className="service-plans-grid">
                {plans.map((pl, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '36px 28px',
                      borderRadius: 20,
                      background: pl.featured ? 'linear-gradient(160deg,rgba(123,47,255,0.18),rgba(10,8,18,0.3))' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${pl.featured ? 'rgba(124,0,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {pl.featured && (
                      <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,var(--accent-purple),var(--accent-pink))', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '5px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                        Популярный
                      </span>
                    )}
                    <h3 style={{ fontFamily: 'var(--font-main)', fontSize: '1.4rem', marginBottom: 8 }}>{pl.name}</h3>
                    {pl.price && <div style={{ fontFamily: 'var(--font-main)', fontSize: '2rem', fontWeight: 800, marginBottom: 24, ...grad }}>{pl.price}</div>}
                    {lines(pl.features).length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12, flexGrow: 1 }}>
                        {lines(pl.features).map((f, j) => (
                          <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--gray-2)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            <i className="fas fa-check" style={{ color: 'var(--accent-cyan)', marginTop: 4 }}></i> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button type="button" className={`btn ${pl.featured ? 'btn-primary' : 'btn-outline'} btn-lg`} style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }} data-plan-open data-plan={pl.name} data-price={pl.price} data-service={s.title}>
                      <span>Выбрать</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {faqs.length > 0 && (
            <div style={{ marginTop: 80, marginLeft: 'auto', marginRight: 'auto' }}>
              <h2 className="section-title" style={{ marginBottom: 40 }}>Частые вопросы</h2>
              <div className="service-faq">
                {faqs.map((f, i) => (
                  <details key={i} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 14, background: 'rgba(255,255,255,0.03)' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                      {f.q} <i className="fas fa-plus" style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}></i>
                    </summary>
                    {f.a && <p style={{ color: 'var(--gray-2)', lineHeight: 1.7, marginTop: 16 }}>{f.a}</p>}
                  </details>
                ))}
              </div>
              <JsonLd data={faqSchema(faqs)} />
            </div>
          )}

          {related.length > 0 && (
            <div className="gbx-rs" id="relatedServices">
              <div className="gbx-rs-head">
                <span className="section-tag">Смежные услуги</span>
                <h2 className="section-title">Что ещё может пригодиться</h2>
              </div>
              <div className="gbx-rs-viewport">
                <div className="gbx-rs-track" id="gbxRsTrack">
                  {related.map((r: any) => {
                    const rimg = mediaUrl(r.image, 'card') || mediaUrl(r.image)
                    const rcat = typeof r.category === 'object' ? r.category?.name : ''
                    const short = r.shortDesc || (r.excerpt || '').split(/\s+/).slice(0, 16).join(' ')
                    return (
                      <a key={r.id} href={paths.service(r.slug)} className="gbx-rs-card">
                        <div className="gbx-rs-card-top">
                          {rimg ? (
                            <img className="gbx-rs-card-img" src={rimg} alt={r.title} loading="lazy" decoding="async" />
                          ) : (
                            <span className="gbx-rs-card-ico">
                              <i className={iconOf(r.icon)}></i>
                            </span>
                          )}
                          {rcat && <span className="gbx-rs-card-tag">{rcat}</span>}
                        </div>
                        <div className="gbx-rs-card-body">
                          <h3 className="gbx-rs-card-title">{r.title}</h3>
                          {short && <p className="gbx-rs-card-desc">{short}</p>}
                          <div className="gbx-rs-card-foot">
                            {r.price && <span className="gbx-rs-card-price">{r.price}</span>}
                            <span className="gbx-rs-card-link">
                              Подробнее <i className="fas fa-arrow-right"></i>
                            </span>
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
              <div className="gbx-rs-controls">
                <button className="gbx-rs-btn" id="gbxRsPrev" aria-label="Назад">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="gbx-rs-dots" id="gbxRsDots"></div>
                <button className="gbx-rs-btn" id="gbxRsNext" aria-label="Вперёд">
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          <div id="service-cta" style={{ marginTop: 90, textAlign: 'center', padding: '60px 40px', borderRadius: 24, background: 'radial-gradient(ellipse at center,rgba(123,47,255,0.15),rgba(10,8,18,0.3))', border: '1px solid rgba(124,0,255,0.25)' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Готовы начать проект?</h2>
            <p style={{ color: 'var(--gray-2)', fontSize: '1.05rem', marginBottom: 32, marginLeft: 'auto', marginRight: 'auto' }}>Оставьте заявку — обсудим вашу задачу и предложим решение</p>
            <button type="button" className="btn btn-primary btn-lg" data-plan-open data-service={s.title}>
              <span>Оставить заявку</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>
      <PlanModal service={s.title} />
      <JsonLd data={serviceSchema(s, `${SITE_URL}${paths.service(s.slug)}`)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Главная', url: `${SITE_URL}/` },
          { name: 'Услуги', url: `${SITE_URL}/services/` },
          { name: s.title, url: `${SITE_URL}${paths.service(s.slug)}` },
        ])}
      />
      <LegacyScripts src={['/legacy/js/inline-plan-modal-0.js', '/legacy/js/inline-service-related-0.js']} />
    </main>
  )
}

const EX_ICONS = ['fa-route', 'fa-bullhorn', 'fa-lightbulb', 'fa-gem']
const EX_TONES = ['pink', 'purple', 'pink', 'purple']

/** Делит HTML-текст пояснения на абзацы: первый — лид, остальные — карточки. */
function splitParas(html: string): string[] {
  const ps = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1].trim()).filter(Boolean)
  if (ps.length) return ps
  return html
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)
}

/** «Что такое landing-page?» → предмет вопроса выделяется градиентом. */
function highlightTitle(t: string) {
  const m = t.match(/^(Что такое|Кому нужен|Кому нужна|Кому нужно|Зачем нужен|Зачем нужна|Зачем нужно)\s+(.+?)(\??)$/i)
  if (!m) return t
  return (
    <>
      {m[1]} <span className="gradient-text">{m[2]}</span>
      {m[3]}
    </>
  )
}
