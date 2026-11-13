/**
 * Посадочная страница: город Крыма или отрасль (коллекция landings).
 * Используется в /sozdanie-sajtov/ (регион) и /sozdanie-sajtov/[slug]/.
 */
import { AnswerBox } from '@/components/sections/Aeo'
import { Breadcrumbs, JsonLd, faqSchema } from '@/components/Common'
import LegacyScripts from '@/components/LegacyScripts'
import { PlanModal } from '@/components/sections/Pages'
import { getLandings, getProjects, getServices } from '@/lib/payload'
import { breadcrumbSchema } from '@/lib/seo'
import { LANDING_HUB, SITE_URL, mediaUrl, paths, stripTags } from '@/lib/util'

const grad = { background: 'linear-gradient(135deg,var(--accent-pink),var(--accent-purple),var(--accent-cyan))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' } as const
const iconOf = (i?: string) => (i && /^fa[srbl]? /.test(i) ? i : `fas ${i || 'fa-location-dot'}`)
const relId = (v: any) => (typeof v === 'object' && v ? v.id : v)
const ICONS = ['fa-route', 'fa-bullhorn', 'fa-lightbulb', 'fa-gem', 'fa-mobile-screen', 'fa-magnifying-glass']
const TONES = ['pink', 'purple', 'cyan']
const DEFAULT_SERVICES = ['landing-page', 'corp-site', 'shops']

function paras(t: string): string[] {
  return String(t || '')
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export async function LandingView({ doc }: { doc: any }) {
  const [all, services, projects] = await Promise.all([getLandings(), getServices(), getProjects()])
  const isHub = doc.slug === LANDING_HUB
  const url = `${SITE_URL}${paths.landing(doc.slug)}`
  const hub = all.find((l: any) => l.slug === LANDING_HUB)
  const hubLabel = hub?.cardTitle || 'Создание сайтов в Крыму'
  const name = doc.cardTitle || doc.title

  const ex = doc.explainer || {}
  const exP = paras(ex.text)
  const exPoints: string[] = (ex.points || []).map((p: any) => p.text).filter(Boolean)
  const features: any[] = (doc.features || []).filter((f: any) => f.title)
  const steps: any[] = doc.steps || []
  const faqs: any[] = [...(doc.faq || []), ...(doc.meta?.faq || [])].filter((f: any) => f.q)
  const img = mediaUrl(doc.image, 'wide') || mediaUrl(doc.image)

  const picked: any[] = (doc.services || []).filter((x: any) => typeof x === 'object' && x)
  const svc = picked.length ? picked : DEFAULT_SERVICES.map((s) => services.find((x: any) => x.slug === s)).filter(Boolean)
  const pickedCases: any[] = (doc.cases || []).filter((x: any) => typeof x === 'object' && x)
  const cases = (pickedCases.length ? pickedCases : [...projects].sort((a: any, b: any) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))).slice(0, 4)

  const cities = all.filter((l: any) => l.kind === 'city' && l.id !== doc.id)
  const industries = all.filter((l: any) => l.kind === 'industry' && l.id !== doc.id)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: doc.title,
    serviceType: 'Создание сайтов',
    description: stripTags(doc.shortDesc || ''),
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: doc.place ? [{ '@type': 'City', name: doc.place }] : [{ '@type': 'AdministrativeArea', name: 'Крым' }, { '@type': 'Country', name: 'Россия' }],
    url,
    ...(doc.price ? { offers: { '@type': 'Offer', priceCurrency: 'RUB', price: String(doc.price).replace(/[^\d]/g, '') } } : {}),
  }
  const crumbs = isHub ? [{ label: name }] : [{ label: hubLabel, href: paths.landing(LANDING_HUB) }, { label: name }]

  return (
    <main id="main" role="main">
      <section className="section-padding" style={{ paddingTop: 140 }}>
        <div className="container">
          <Breadcrumbs items={crumbs} />

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 64, alignItems: 'center' }} className="service-hero-grid">
            <div>
              <span className="section-tag" style={{ marginBottom: 16, display: 'inline-block' }}>
                <i className={iconOf(doc.icon)}></i> {doc.kind === 'industry' ? 'Сайты для бизнеса' : doc.place || 'Крым'}
              </span>
              <h1 style={{ fontFamily: 'var(--font-main)', fontSize: 'clamp(2rem,4vw,3.4rem)', fontWeight: 800, lineHeight: 1.12, marginBottom: 20 }}>{doc.title}</h1>
              {doc.shortDesc && <p className="service-lead">{doc.shortDesc}</p>}
              <AnswerBox text={doc.meta?.answer} />
              {(doc.price || doc.duration) && (
                <div style={{ display: 'flex', gap: 32, marginBottom: 36, flexWrap: 'wrap' }}>
                  {doc.price && (
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: 4 }}>Стоимость</div>
                      <div style={{ fontFamily: 'var(--font-main)', fontSize: '1.8rem', fontWeight: 800, ...grad }}>от {doc.price}</div>
                    </div>
                  )}
                  {doc.duration && (
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: 4 }}>Срок</div>
                      <div style={{ fontFamily: 'var(--font-main)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--white)' }}>от {doc.duration}</div>
                    </div>
                  )}
                </div>
              )}
              <a href="#service-cta" className="btn btn-primary btn-lg">
                <span>Обсудить проект</span>
                <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            <div className={`gb-land-visual${img ? '' : ' gb-land-visual--icon'}`}>
              {img ? <img src={img} alt={doc.title} width={600} height={500} loading="lazy" /> : <i className={iconOf(doc.icon)} style={grad}></i>}
            </div>
          </div>

          {(ex.title || exP.length > 0) && (
            <div className="svc-explainer-v2">
              <div className="svc-ex2-top">
                <div className="svc-ex2-head">
                  <span className="section-tag">
                    <i className="fas fa-circle-info"></i> {doc.kind === 'industry' ? 'Специфика' : doc.kind === 'region' ? 'Особенности Крыма' : 'О работе в городе'}
                  </span>
                  {ex.title && <h2 className="svc-ex2-title">{ex.title}</h2>}
                </div>
                {exP[0] && <div className="svc-ex2-lead">{exP[0]}</div>}
              </div>
              {(exP.length > 1 || exPoints.length > 0) && (
                <div className="svc-ex2-grid">
                  {exP.slice(1).map((t, i) => (
                    <div className="svc-ex2-card" key={i}>
                      <span className={`svc-ex2-ico gb-tone-${TONES[i % 2]}`}>
                        <i className={`fas ${ICONS[i % ICONS.length]}`}></i>
                      </span>
                      <div className="svc-ex2-text">{t}</div>
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
            <div className="gb-land-block">
              <h2 className="section-title">{doc.featuresTitle || 'Что должно быть на сайте'}</h2>
              <div className="gb-land-feats">
                {features.map((f, i) => (
                  <div className="gb-land-feat" key={i}>
                    <span className={`svc-ex2-ico gb-tone-${TONES[i % 3]}`}>
                      <i className={`fas ${ICONS[(i + 2) % ICONS.length]}`}></i>
                    </span>
                    <h3>{f.title}</h3>
                    {f.text && <p>{f.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {svc.length > 0 && (
            <div className="gb-land-block">
              <h2 className="section-title">Какой сайт подойдёт</h2>
              <div className="gb-land-svc">
                {svc.map((s: any) => (
                  <a key={s.id} href={paths.service(s.slug)} className="gb-land-svc-card">
                    <span className="gb-land-svc-ico">
                      <i className={s.icon && /^fa[srbl]? /.test(s.icon) ? s.icon : `fas ${s.icon || 'fa-code'}`}></i>
                    </span>
                    <h3>{s.title}</h3>
                    {(s.shortDesc || s.excerpt) && <p>{stripTags(s.shortDesc || s.excerpt).split(/\s+/).slice(0, 22).join(' ')}</p>}
                    <div className="gb-land-svc-foot">
                      {s.price && <strong style={grad}>от {s.price}</strong>}
                      {s.duration && <span>от {s.duration}</span>}
                      <i className="fas fa-arrow-right"></i>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {cases.length > 0 && (
            <div className="svc-cases">
              <div className="svc-cases-head">
                <span className="section-tag">Портфолио</span>
                <h2 className="section-title">Примеры наших работ</h2>
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

          {steps.length > 0 && (
            <div className="gb-land-block">
              <h2 className="section-title">Как мы работаем</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }} className="service-steps-grid">
                {steps.map((st, i) => (
                  <div key={i} style={{ padding: '28px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontFamily: 'var(--font-main)', fontSize: '2.2rem', fontWeight: 800, ...grad, marginBottom: 10 }}>{String(i + 1).padStart(2, '0')}</div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{st.title}</h3>
                    {st.text && <p style={{ color: 'var(--gray-2)', fontSize: '0.95rem', lineHeight: 1.6 }}>{st.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {faqs.length > 0 && (
            <div className="gb-land-block">
              <h2 className="section-title">Частые вопросы</h2>
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

          {(cities.length > 0 || industries.length > 0) && (
            <div className="gb-land-block gb-land-links">
              {cities.length > 0 && (
                <div>
                  <h2 className="gb-land-links-title">
                    <i className="fas fa-map-location-dot"></i> Работаем по всему Крыму
                  </h2>
                  <div className="gb-land-chips">
                    {!isHub && hub && <a href={paths.landing(LANDING_HUB)}>Весь Крым</a>}
                    <a href="/">Севастополь</a>
                    {cities.map((c: any) => (
                      <a key={c.id} href={paths.landing(c.slug)}>
                        {c.cardTitle || c.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {industries.length > 0 && (
                <div>
                  <h2 className="gb-land-links-title">
                    <i className="fas fa-briefcase"></i> Сайты для отраслей
                  </h2>
                  <div className="gb-land-chips">
                    {industries.map((c: any) => (
                      <a key={c.id} href={paths.landing(c.slug)}>
                        {c.cardTitle || c.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div id="service-cta" style={{ marginTop: 90, textAlign: 'center', padding: '60px 40px', borderRadius: 24, background: 'radial-gradient(ellipse at center,rgba(123,47,255,0.15),rgba(10,8,18,0.3))', border: '1px solid rgba(124,0,255,0.25)' }} className="gb-land-cta">
            <h2 className="section-title" style={{ marginBottom: 16 }}>Обсудим ваш сайт?</h2>
            <p style={{ color: 'var(--gray-2)', fontSize: '1.05rem', marginBottom: 32, marginLeft: 'auto', marginRight: 'auto' }}>Расскажите о задаче — назовём сроки и стоимость в течение дня</p>
            <button type="button" className="btn btn-primary btn-lg" data-plan-open data-service={doc.title}>
              <span>Оставить заявку</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>
      <PlanModal service={doc.title} />
      <JsonLd data={schema} />
      <JsonLd
        data={breadcrumbSchema(
          isHub
            ? [{ name: name, url }]
            : [
                { name: hubLabel, url: `${SITE_URL}${paths.landing(LANDING_HUB)}` },
                { name, url },
              ],
        )}
      />
      <LegacyScripts src={['/legacy/js/inline-plan-modal-0.js']} />
    </main>
  )
}
