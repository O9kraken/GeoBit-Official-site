import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { Breadcrumbs, Html, MaxIcon } from '@/components/Common'
import { Consent, HiddenFields, MethodField } from '@/components/LeadForm'
import { getGlobal } from '@/lib/payload'
import { mediaUrl } from '@/lib/util'
import type { FaqItem } from '@/components/Common'

export type Crumb = { label: string; href?: string }

/** Шапка внутренних страниц (.services-hero + хлебные крошки) */
export function PageHero({
  crumbs,
  tag,
  title,
  subtitle,
  className = 'services-hero',
  titleClass,
  subtitleClass,
}: {
  crumbs: Crumb[]
  tag?: string
  title: string
  subtitle?: string
  className?: string
  titleClass?: string
  subtitleClass?: string
}) {
  return (
    <section className={className}>
      <div className="container">
        <Breadcrumbs items={crumbs} />
        <div className="page-hero-content">
          {tag && <span className="section-tag">{tag}</span>}
          <Html as="h1" className={titleClass} html={title} />
          {subtitle && <p className={subtitleClass}>{subtitle}</p>}
        </div>
      </div>
    </section>
  )
}

/** Lexical → HTML (та же разметка, что выдавал WordPress) */
export const richHtml = (data: any) => {
  if (!data?.root) return ''
  try {
    return convertLexicalToHTML({ data, disableContainer: true })
  } catch {
    return ''
  }
}

/** FAQ для внутренних страниц: свои вопросы страницы → общие со страницы FAQ (как template-parts/faq.php) */
export async function pageFaqs(own?: FaqItem[] | null): Promise<FaqItem[]> {
  if (own?.length) return own
  const f = await getGlobal<any>('faq-page')
  return f?.faq || []
}

/** template-parts/newsletter.php */
export function Newsletter({ title, text }: { title?: string; text?: string } = {}) {
  return (
    <section className="nl2 section-padding">
      <div className="container">
        <div className="nl2__panel">
          <div className="nl2__info">
            <span className="section-tag">Рассылка</span>
            <h2 className="nl2__title" dangerouslySetInnerHTML={{ __html: title || 'Полезные статьи <span class="gradient-text">на почту</span>' }} />
            <p className="nl2__text">{text || 'Присылаем письмо, когда выходит новая статья. Без спама — только контент.'}</p>
            <ul className="nl2__points">
              <li>
                <i className="fas fa-check"></i> Только новые статьи
              </li>
              <li>
                <i className="fas fa-check"></i> Отписка в один клик
              </li>
            </ul>
          </div>
          <form className="gb-newsletter-form nl2__form" noValidate>
            <div aria-hidden="true" style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden' }}>
              <label>
                Не заполняйте это поле
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <label className="nl2__label" htmlFor="nl2Email">
              Ваш email
            </label>
            <div className="nl2__field">
              <i className="far fa-envelope" aria-hidden="true"></i>
              <input id="nl2Email" type="email" name="email" placeholder="you@mail.ru" autoComplete="email" required />
              <button type="submit" className="btn btn-primary">
                <span>Подписаться</span>
              </button>
            </div>
            <label className="nl2__consent">
              <input type="checkbox" name="consent" value="1" required />
              <span>
                Даю{' '}
                <a href="/soglasie-pd/" target="_blank" rel="noopener">
                  согласие на обработку персональных данных
                </a>{' '}
                в соответствии с{' '}
                <a href="/privacy-policy/" target="_blank" rel="noopener">
                  политикой конфиденциальности
                </a>
              </span>
            </label>
            <label className="nl2__consent">
              <input type="checkbox" name="consent_mailing" value="1" required />
              <span>
                Даю{' '}
                <a href="/soglasie-rassylka/" target="_blank" rel="noopener">
                  согласие на получение рассылки
                </a>{' '}
                (можно отписаться в любом письме)
              </span>
            </label>
            <div className="success-msg gb-newsletter-msg"></div>
          </form>
        </div>
      </div>
    </section>
  )
}

/** template-parts/service-plan-modal.php */
export function PlanModal({ service = '' }: { service?: string }) {
  return (
    <div className="gbx-modal" id="planModal" aria-hidden="true">
      <div className="gbx-modal-overlay" data-plan-close></div>
      <div className="gbx-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="planModalTitle">
        <button type="button" className="gbx-modal-x" data-plan-close aria-label="Закрыть">
          <i className="fas fa-xmark"></i>
        </button>
        <div className="gbx-modal-head">
          <span className="section-tag">Заявка</span>
          <h3 id="planModalTitle" className="gbx-modal-title">
            Оставить заявку
          </h3>
          <p className="gbx-modal-sub" id="planModalSub">
            Заполните форму — свяжемся в течение часа и обсудим детали
          </p>
        </div>
        <div className="gbx-modal-chip" id="planModalChip" hidden>
          <i className="fas fa-circle-check"></i>
          <span>
            <span id="planModalChipLabel">Тариф</span>: <strong id="planModalChipName">—</strong>
          </span>
          <span className="gbx-modal-chip-price" id="planModalChipPrice"></span>
        </div>
        <form id="planForm" noValidate>
          <HiddenFields nonceName="adelf_nonce_plan" />
          <input type="hidden" name="plan_name" id="planFieldName" defaultValue="" />
          <input type="hidden" name="plan_price" id="planFieldPrice" defaultValue="" />
          <input type="hidden" name="service_title" id="planFieldService" defaultValue={service} />
          <div className="form-group">
            <label htmlFor="pm_name">Ваше имя *</label>
            <input type="text" id="pm_name" name="name" placeholder="Александр" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pm_phone">Телефон *</label>
              <input type="tel" id="pm_phone" name="phone" placeholder="+7 (999) 123-45-67" autoComplete="tel" required />
            </div>
            <div className="form-group">
              <label htmlFor="pm_email">Email</label>
              <input type="email" id="pm_email" name="email" placeholder="you@mail.ru" autoComplete="email" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pm_message">Комментарий</label>
            <textarea id="pm_message" name="message" placeholder="Кратко о задаче или вопрос…"></textarea>
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
          <div id="planFormMsg" className="success-msg"></div>
        </form>
      </div>
    </div>
  )
}

/** Кнопки мессенджеров страницы «Контакты» */
export function MessengerButtons({ s }: { s: any }) {
  const items = [
    s?.telegramUrl && { href: s.telegramUrl, cls: 'tg', icon: <i className="fab fa-telegram fa-lg"></i>, label: 'Telegram' },
    s?.maxUrl && { href: s.maxUrl, cls: 'max', icon: <MaxIcon className="fa-lg" />, label: 'MAX' },
    s?.instagramUrl && { href: s.instagramUrl, cls: 'ig', icon: <i className="fab fa-instagram fa-lg"></i>, label: 'Instagram' },
  ].filter(Boolean) as any[]
  if (!items.length) return null
  return (
    <>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, color: 'var(--white)' }}>Мессенджеры</h3>
      <div className="contact-messengers">
        {items.map((it) => (
          <a key={it.cls} href={it.href} className={`contact-messenger-btn ${it.cls}`} target="_blank" rel="noopener">
            {it.icon}
            <div>
              <div>{it.label}</div>
            </div>
            <i className="fas fa-arrow-right" style={{ marginLeft: 'auto' }}></i>
          </a>
        ))}
      </div>
    </>
  )
}

export const imgOf = (m: any, size?: 'thumb' | 'card' | 'wide') => mediaUrl(m, size)
