import type { Metadata } from 'next'
import LegacyScripts from '@/components/LegacyScripts'
import { BudgetOptions, Consent, HiddenFields, MethodField } from '@/components/LeadForm'
import { MessengerButtons, PageHero } from '@/components/sections/Pages'
import { getGlobal, getServices } from '@/lib/payload'
import { buildMeta } from '@/lib/seo'
import { telHref } from '@/lib/util'


export async function generateMetadata(): Promise<Metadata> {
  const g = await getGlobal<any>('contacts-page')
  return buildMeta({ path: '/contacts/', seo: g?.seo, title: 'Контакты GeoBit' })
}

const selectStyle = {
  width: '100%',
  background: 'var(--dark-4)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '14px 18px',
  color: 'var(--white)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'all 0.3s',
  WebkitAppearance: 'none' as const,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export default async function ContactsPage() {
  const [g, s, services] = await Promise.all([getGlobal<any>('contacts-page'), getGlobal<any>('settings'), getServices()])
  const faqs: { q: string; a: string }[] = g?.faq || []
  return (
    <main id="main" role="main">
      <PageHero
        crumbs={[{ label: 'Контакты' }]}
        tag={g?.tag || 'Напишите нам'}
        title={g?.title || '<span class="gradient-text">Заказать сайт</span> свяжитесь с нами'}
        subtitle={g?.subtitle || 'Обсудим ваш проект — это бесплатно. Ответим в течение 1 часа.'}
      />
      <section className="section-padding">
        <div className="container">
          <div className="contacts-grid">
            <div className="contact-form">
              <h2>{g?.formTitle || 'Оставить заявку'}</h2>
              <p>{g?.formSubtitle || 'Расскажите о вашем проекте — подберём оптимальное решение'}</p>
              <form id="contactForm" noValidate>
                <HiddenFields nonceName="adelf_nonce" />
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cf_name">Ваше имя *</label>
                    <input type="text" id="cf_name" name="name" placeholder="Александр" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cf_phone">Телефон *</label>
                    <input type="tel" id="cf_phone" name="phone" placeholder="+7 (999) 123-45-67" autoComplete="tel" required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="cf_email">Email</label>
                  <input type="email" id="cf_email" name="email" placeholder="you@mail.ru" autoComplete="email" />
                </div>
                <div className="form-group">
                  <label htmlFor="cf_service">Интересующая услуга</label>
                  <select id="cf_service" name="service" style={selectStyle} defaultValue="">
                    <option value="" disabled>
                      Выберите услугу
                    </option>
                    {services.map((sv: any) => (
                      <option key={sv.id} value={sv.title}>
                        {sv.title}
                      </option>
                    ))}
                    <option value="Другое">Другое</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="cf_budget">Примерный бюджет</label>
                  <select id="cf_budget" name="budget" style={selectStyle} defaultValue="">
                    <BudgetOptions />
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="cf_message">Описание проекта</label>
                  <textarea id="cf_message" name="message" placeholder="Расскажите о вашем бизнесе, целях сайта, пожеланиях..."></textarea>
                </div>
                <MethodField />
                <Consent />
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="fas fa-paper-plane"></i>
                  <span>Отправить заявку</span>
                </button>
                <p className="form-note">
                  <i className="fas fa-lock" style={{ color: 'var(--accent-cyan)' }}></i> Ваши данные защищены и не передаются третьим лицам
                </p>
                <div id="formSuccess" className="success-msg"></div>
              </form>
            </div>

            <div className="contact-info">
              <h3>Как с нами связаться</h3>
              <p>Выберите удобный способ — ответим быстро</p>
              <div className="contact-items">
                {s?.email && (
                  <div className="contact-item">
                    <div className="contact-item-icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="contact-item-text">
                      <strong>Email</strong>
                      <a href={`mailto:${s.email}`}>{s.email}</a>
                    </div>
                  </div>
                )}
                {s?.phone && (
                  <div className="contact-item">
                    <div className="contact-item-icon">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="contact-item-text">
                      <strong>Телефон</strong>
                      <a href={telHref(s.phone)}>{s.phone}</a>
                    </div>
                  </div>
                )}
                {s?.address && (
                  <div className="contact-item">
                    <div className="contact-item-icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="contact-item-text">
                      <strong>Адрес</strong>
                      <span>{s.address}</span>
                    </div>
                  </div>
                )}
                {s?.workHours && (
                  <div className="contact-item">
                    <div className="contact-item-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="contact-item-text">
                      <strong>Время работы</strong>
                      <span>{s.workHours}</span>
                    </div>
                  </div>
                )}
              </div>
              <MessengerButtons s={s} />
              {faqs.length > 0 && (
                <div style={{ marginTop: 40 }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20, color: 'var(--white)' }}>Частые вопросы</h3>
                  {faqs.map((f, i) => (
                    <details key={i} style={{ background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 12, cursor: 'pointer' }}>
                      <summary style={{ fontSize: '0.9rem', fontWeight: 600, listStyle: 'none', color: 'var(--white-3)' }}>{f.q}</summary>
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray-2)', marginTop: 12, lineHeight: 1.6 }}>{f.a}</p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <LegacyScripts src={['/legacy/js/inline-contacts-0.js']} />
    </main>
  )
}
