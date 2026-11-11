import { getGlobal, getServices } from '@/lib/payload'
import { paths, telHref } from '@/lib/util'
import { LogoInner, MaxIcon } from '../Common'
import DockScroll from './DockScroll'

/**
 * Навигация-«островок» (только десктоп; на телефоне — обычная шапка с бургером).
 * variant="hero" — главная: стоит внизу первого экрана и при прокрутке
 *   прилипает к верху, сжимаясь в островок.
 * variant="top" — остальные страницы: островок сверху сразу.
 */
export default async function Dock({ variant = 'hero' }: { variant?: 'hero' | 'top' }) {
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

  const drop = (kind?: string) => {
    if (kind === 'services')
      return (
        <div className="gb-dock__drop gb-dock__drop--wide" role="menu">
          <div className="gb-dock__drop-grid">
            {services.map((sv: any) => (
              <a key={sv.id} href={paths.service(sv.slug)} className="gb-dock__drop-link" role="menuitem">
                <span className="gb-dock__drop-ico">
                  <i className={sv.icon || 'fas fa-code'}></i>
                </span>
                <span className="gb-dock__drop-text">
                  <b>{sv.title}</b>
                  {sv.price && <small>{sv.price}</small>}
                </span>
              </a>
            ))}
          </div>
          <a href="/services/" className="gb-dock__drop-all" role="menuitem">
            Все услуги <i className="fas fa-arrow-right"></i>
          </a>
        </div>
      )
    if (kind === 'contacts')
      return (
        <div className="gb-dock__drop" role="menu">
          <a href="/contacts/" className="gb-dock__drop-link" role="menuitem">
            <span className="gb-dock__drop-ico">
              <i className="fas fa-envelope"></i>
            </span>
            <span className="gb-dock__drop-text">
              <b>Контакты</b>
            </span>
          </a>
          <a href="/faq/" className="gb-dock__drop-link" role="menuitem">
            <span className="gb-dock__drop-ico">
              <i className="fas fa-circle-question"></i>
            </span>
            <span className="gb-dock__drop-text">
              <b>Вопросы и ответы</b>
            </span>
          </a>
        </div>
      )
    return null
  }

  return (
    <>
      {variant === 'hero' && (
        <div className="gb-herotop">
          <a href="/" className="gb-herotop__logo" aria-label="GeoBit — на главную">
            <LogoInner />
          </a>
          <div className="gb-herotop__right">
            {s?.phone && (
              <a href={telHref(s.phone)} className="gb-herotop__phone">
                {s.phone}
              </a>
            )}
            {s?.email && (
              <a href={`mailto:${s.email}`} className="gb-herotop__mail">
                {s.email}
              </a>
            )}
            <span className="gb-herotop__soc">
              {s?.telegramUrl && (
                <a href={s.telegramUrl} target="_blank" rel="noopener" aria-label="Telegram">
                  <i className="fab fa-telegram"></i>
                </a>
              )}
              {s?.maxUrl && (
                <a href={s.maxUrl} target="_blank" rel="noopener" aria-label="MAX">
                  <MaxIcon size={20} />
                </a>
              )}
            </span>
          </div>
        </div>
      )}
      <div className={`gb-dock gb-dock--${variant}` + (variant === 'top' ? ' is-island' : '')} id={variant === 'hero' ? 'gbDock' : undefined}>
        <nav className="gb-dock__bar" aria-label="Основное меню">
          <a href="/" className="gb-dock__logo" aria-label="GeoBit — на главную">
            <LogoInner />
          </a>
          <div className="gb-dock__links">
            {items.map((it, i) => {
              const dd = it.dropdown && it.dropdown !== 'none' ? it.dropdown : undefined
              return (
                <div key={i} className={'gb-dock__item' + (dd ? ' has-drop' : '')}>
                  <a href={it.url} className="gb-dock__link" aria-haspopup={dd ? 'true' : undefined}>
                    {it.label}
                    {dd && <i className="fas fa-chevron-down gb-dock__caret" aria-hidden="true"></i>}
                  </a>
                  {drop(dd)}
                </div>
              )
            })}
          </div>
          <div className="gb-dock__right">
            {s?.phone && (
              <a href={telHref(s.phone)} className="gb-dock__icon" aria-label="Позвонить">
                <i className="fas fa-phone"></i>
              </a>
            )}
            {s?.telegramUrl && (
              <a href={s.telegramUrl} target="_blank" rel="noopener" className="gb-dock__icon" aria-label="Telegram">
                <i className="fab fa-telegram"></i>
              </a>
            )}
            <a href="/contacts/" className="btn btn-primary gb-dock__cta">
              <span>Заказать сайт</span>
            </a>
          </div>
        </nav>
        <DockScroll variant={variant} />
      </div>
    </>
  )
}
