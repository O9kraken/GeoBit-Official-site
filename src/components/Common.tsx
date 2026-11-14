import { LOGO_SVG } from '@/lib/logo-svg'
import { autop } from '@/lib/util'

export const Html = ({ html, as: Tag = 'span', className }: { html?: string | null; as?: any; className?: string }) =>
  html ? <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} /> : null

/** Внутренность логотипа — инлайн SVG (для currentColor) */
export const LogoInner = () => <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />

/** Логотип MAX: встроенный SVG в цвет текста (currentColor), размер 1em — как у иконок Font Awesome рядом */
const MAX_PATH =
  'M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z'
export const MaxIcon = ({ className = '' }: { size?: number; className?: string }) => (
  <svg className={`max-glyph ${className}`.trim()} viewBox="0 0 720 720" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
    <path d={MAX_PATH} />
  </svg>
)

export const Breadcrumbs = ({ items }: { items: { label: string; href?: string }[] }) => (
  <nav className="breadcrumbs" aria-label="Навигация">
    <a href="/">Главная</a>
    {items.map((it, i) => (
      <span key={i} style={{ display: 'contents' }}>
        {' '}
        <span>/</span> {it.href ? <a href={it.href}>{it.label}</a> : <span>{it.label}</span>}
      </span>
    ))}
  </nav>
)

export type FaqItem = { q: string; a: string }

/** На всех страницах, кроме /faq, показываем не больше 7 вопросов */
export const FAQ_MAX = 7
export const topFaq = <T,>(faqs: T[] | null | undefined, max = FAQ_MAX): T[] => (faqs || []).slice(0, max)

export const FaqList = ({ faqs, openFirst = true }: { faqs: FaqItem[]; openFirst?: boolean }) =>
  faqs?.length ? (
    <div className="faq-list">
      {faqs.map((item, idx) => {
        const open = openFirst && idx === 0
        return (
          <div className={'faq-item' + (open ? ' is-open' : '')} key={idx}>
            <button type="button" className="faq-question" aria-expanded={open ? 'true' : 'false'}>
              <span>{item.q}</span>
              <i className="fas fa-chevron-down"></i>
            </button>
            <div className="faq-answer" dangerouslySetInnerHTML={{ __html: autop(item.a) }} />
          </div>
        )
      })}
    </div>
  ) : null

export const JsonLd = ({ data }: { data: unknown }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
)

export const faqSchema = (faqs: FaqItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q.replace(/<[^>]*>/g, ''),
    acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]*>/g, '') },
  })),
})

/** Секция FAQ в стиле темы + разметка FAQPage */
export const FaqSection = ({ faqs: all, tag = 'Вопросы и ответы', title = 'Частые <span class="gradient-text">вопросы</span>' }: { faqs: FaqItem[]; tag?: string; title?: string }) => {
  const faqs = topFaq(all)
  return faqs.length ? (
    <>
      <section className="faq section-padding" id="faq">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{tag}</span>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: title }} />
          </div>
          <FaqList faqs={faqs} />
        </div>
      </section>
      <JsonLd data={faqSchema(faqs)} />
    </>
  ) : null
}
