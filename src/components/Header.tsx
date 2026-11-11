import { getGlobal, getServices } from '@/lib/payload'
import { paths, telHref } from '@/lib/util'
import { LogoInner, MaxIcon } from './Common'

const Arrow = () => (
  <svg className="nav-link-arrow" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

export default async function Header() {
  const [nav, s, services] = await Promise.all([getGlobal<any>('navigation'), getGlobal<any>('settings'), getServices()])
  const items: { label: string; url: string; dropdown?: string }[] = nav?.header?.length
    ? nav.header
    : [
        { label: 'Главная', url: '/' },
        { label: 'Услуги', url: '/services/', dropdown: 'services' },
        { label: 'Портфолио', url: '/portfolio/' },
        { label: 'О нас', url: '/about/' },
        { label: 'Блог', url: '/blog/' },
        { label: 'Контакты', url: '/contacts/', dropdown: 'contacts' },
      ]

  const dropdown = (kind?: string) => {
    if (kind === 'services')
      return (
        <ul className="nav-dropdown">
          {services.map((sv: any) => (
            <li key={sv.id}>
              <a href={paths.service(sv.slug)} className="nav-drop-link">
                <i className={sv.icon || 'fas fa-code'}></i>
                <span>{sv.title}</span>
              </a>
            </li>
          ))}
          <li className="nav-drop-all">
            <a href="/services/" className="nav-drop-link">
              <i className="fas fa-th-large"></i>
              <span>Все услуги</span>
            </a>
          </li>
        </ul>
      )
    if (kind === 'contacts')
      return (
        <ul className="nav-dropdown">
          <li>
            <a href="/faq/" className="nav-drop-link">
              <i className="fas fa-circle-question"></i>
              <span>FAQ</span>
            </a>
          </li>
          <li className="nav-drop-all">
            <a href="/contacts/" className="nav-drop-link">
              <i className="fas fa-envelope"></i>
              <span>Контакты</span>
            </a>
          </li>
        </ul>
      )
    return null
  }

  return (
    <nav className="navbar" id="navbar">
      <div className="container">
        <a href="/" className="logo logo--svg" aria-label="GeoBit — на главную">
          <LogoInner />
        </a>
        <ul id="navLinks" className="nav-links">
          <li className="nav-mobile-logo">
            <a href="/" className="logo logo--svg" aria-label="GeoBit">
              <LogoInner />
            </a>
          </li>
          {items.map((it, i) => {
            const dd = it.dropdown && it.dropdown !== 'none' ? it.dropdown : undefined
            const label = dd === 'services' ? 'Открыть список услуг' : 'Открыть подменю контактов'
            return (
              <li key={i} className={dd ? 'has-dropdown' : undefined}>
                <a href={it.url} className="nav-link">
                  <span className="nav-link-text">{it.label}</span>
                  {dd && <i className="fas fa-chevron-down nav-drop-caret" aria-hidden="true"></i>}
                  <Arrow />
                </a>
                {dd && (
                  <button type="button" className="nav-drop-toggle" aria-expanded="false" aria-label={label}>
                    <i className="fas fa-chevron-down"></i>
                  </button>
                )}
                {dropdown(dd)}
              </li>
            )
          })}
          <li className="nav-contacts">
            <div className="nav-contacts-inner">
              {s?.phone && (
                <a href={telHref(s.phone)} className="nav-contact-item">
                  <i className="fas fa-phone"></i> {s.phone}
                </a>
              )}
              {s?.email && (
                <a href={`mailto:${s.email}`} className="nav-contact-item">
                  <i className="fas fa-envelope"></i> {s.email}
                </a>
              )}
              <div className="nav-messengers">
                {s?.telegramUrl && (
                  <a href={s.telegramUrl} target="_blank" rel="noopener" aria-label="Telegram">
                    <i className="fab fa-telegram"></i>
                  </a>
                )}
                {s?.maxUrl && (
                  <a href={s.maxUrl} target="_blank" rel="noopener" aria-label="MAX" className="nav-msg-max">
                    <MaxIcon size={22} />
                  </a>
                )}
              </div>
              <a href="/contacts/" className="btn btn-primary nav-cta nav-cta-order">
                Заказать сайт
              </a>
            </div>
          </li>
        </ul>
        <a href="/contacts/" className="btn btn-primary nav-cta">
          Заказать сайт
        </a>
        <button className="burger" id="burgerBtn" aria-label="Меню">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}
