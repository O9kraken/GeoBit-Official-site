import { getGlobal } from '@/lib/payload'
import { telHref } from '@/lib/util'
import { LogoInner } from '../Common'
import DockScroll from './DockScroll'

/**
 * Навигация-«островок» (только десктоп; на телефоне — обычная шапка с бургером).
 * variant="hero" — главная: стоит внизу первого экрана и при прокрутке
 *   прилипает к верху, сжимаясь в островок.
 * variant="top" — остальные страницы: островок сверху сразу.
 */
export default async function Dock({ variant = 'hero' }: { variant?: 'hero' | 'top' }) {
  const [nav, s] = await Promise.all([getGlobal<any>('navigation'), getGlobal<any>('settings')])
  const items: { label: string; url: string }[] = nav?.header?.length
    ? nav.header
    : [
        { label: 'Главная', url: '/' },
        { label: 'Услуги', url: '/services/' },
        { label: 'Портфолио', url: '/portfolio/' },
        { label: 'О нас', url: '/about/' },
        { label: 'Блог', url: '/blog/' },
        { label: 'Контакты', url: '/contacts/' },
      ]
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
              {s?.whatsappUrl && (
                <a href={s.whatsappUrl} target="_blank" rel="noopener" aria-label="WhatsApp">
                  <i className="fab fa-whatsapp"></i>
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
          {items.map((it, i) => (
            <a key={i} href={it.url} className="gb-dock__link">
              {it.label}
            </a>
          ))}
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
