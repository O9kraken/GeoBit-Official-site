import { getGlobal, getLandings, getServices } from '@/lib/payload'
import { LANDING_HUB, paths, telHref } from '@/lib/util'
import { LogoInner, MaxIcon } from './Common'
import { COOKIE_BANNER_HTML } from './cookie-banner-html'

export default async function Footer() {
  const [s, nav, services, landings] = await Promise.all([getGlobal<any>('settings'), getGlobal<any>('navigation'), getServices(), getLandings().catch(() => [] as any[])])
  const hub = landings.find((l: any) => l.slug === LANDING_HUB)
  const geo = landings.filter((l: any) => l.slug !== LANDING_HUB)
  const footerNav: { label: string; url: string }[] = nav?.footerNav?.length
    ? nav.footerNav
    : [
        { label: 'Главная', url: '/' },
        { label: 'Услуги', url: '/services/' },
        { label: 'Портфолио', url: '/portfolio/' },
        { label: 'О нас', url: '/about/' },
        { label: 'Блог', url: '/blog/' },
        { label: 'Контакты', url: '/contacts/' },
      ]
  const legal: { label: string; url: string }[] = nav?.footerLegal?.length
    ? nav.footerLegal
    : [
        { label: 'Политика конфиденциальности', url: '/privacy-policy/' },
        { label: 'Согласие на обработку ПД', url: '/soglasie-pd/' },
        { label: 'Согласие на рассылку', url: '/soglasie-rassylka/' },
        { label: 'Оферта', url: '/oferta/' },
      ]
  const socials: [string | undefined, string, React.ReactNode][] = [
    [s?.telegramUrl, 'Telegram', <i key="tg" className="fab fa-telegram"></i>],
    [s?.maxUrl, 'MAX', <MaxIcon key="max" size={16} />],
    [s?.vkUrl, 'VKontakte', <i key="vk" className="fab fa-vk"></i>],
    [s?.instagramUrl, 'Instagram', <i key="ig" className="fab fa-instagram"></i>],
    [s?.youtubeUrl, 'YouTube', <i key="yt" className="fab fa-youtube"></i>],
    [s?.dzenUrl, 'Дзен', 'Дзен'],
    [s?.okUrl, 'Одноклассники', <i key="ok" className="fab fa-odnoklassniki"></i>],
  ]
  const tg = (s?.telegramUsername || '').replace(/^@/, '')

  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="/" className="logo logo--svg" aria-label="GeoBit">
                <LogoInner />
              </a>
              <p>{s?.footerDescription || 'Студия веб-разработки и дизайна. Создаём сайты, которые работают на ваш бизнес.'}</p>
              <div className="footer-socials">
                {socials.map(([url, label, icon]) =>
                  url ? (
                    <a key={label} href={url} aria-label={label} target="_blank" rel="noopener" className={label === 'Дзен' ? 'social-max' : undefined}>
                      {icon}
                    </a>
                  ) : null,
                )}
              </div>
            </div>
            <div className="footer-nav">
              <h4>Навигация</h4>
              <ul>
                {footerNav.map((l, i) => (
                  <li key={i}>
                    <a href={l.url}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-services">
              <h4>Услуги</h4>
              <ul>
                {(nav?.footerServices?.length ? nav.footerServices : services.slice(0, 6).map((sv: any) => ({ label: sv.title, url: paths.service(sv.slug) }))).map(
                  (l: any, i: number) => (
                    <li key={i}>
                      <a href={l.url}>{l.label}</a>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Контакты</h4>
              <ul>
                {s?.email && (
                  <li>
                    <i className="fas fa-envelope"></i> <a href={`mailto:${s.email}`}>{s.email}</a>
                  </li>
                )}
                {s?.phone && (
                  <li>
                    <i className="fas fa-phone"></i> <a href={telHref(s.phone)}>{s.phone}</a>
                  </li>
                )}
                {tg && (
                  <li>
                    <i className="fab fa-telegram"></i>{' '}
                    <a href={`https://t.me/${tg}`} target="_blank" rel="noopener">
                      @{tg}
                    </a>
                  </li>
                )}
                {s?.address && (
                  <li>
                    <i className="fas fa-map-marker-alt"></i> <span>{s.address}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          {landings.length > 0 && (
            <nav className="footer-geo" aria-label="Города и отрасли">
              {hub && <a href={paths.landing(LANDING_HUB)}>{hub.cardTitle || 'Сайты в Крыму'}</a>}
              {geo.map((l: any) => (
                <a key={l.id} href={paths.landing(l.slug)}>
                  {l.kind === 'city' ? `Сайты — ${l.cardTitle || l.title}` : l.cardTitle || l.title}
                </a>
              ))}
            </nav>
          )}
          <div className="footer-bottom">
            <div className="footer-legal-info">
              <p className="footer-legal">
                {s?.legalName || 'Самозанятый Каляков Георгий Аскерович'}
                {s?.inn && (
                  <>
                    <br />
                    ИНН: {s.inn}
                  </>
                )}
              </p>
              <p className="footer-copy">© {new Date().getFullYear()} GeoBit. Все права защищены.</p>
            </div>
            <div className="footer-links">
              {legal.map((l, i) => (
                <a key={i} href={l.url}>
                  {l.label}
                </a>
              ))}
              <a href="#" data-cookie-settings>
                Настройки cookie
              </a>
            </div>
          </div>
        </div>
      </footer>
      <button className="scroll-top" id="scrollTop" aria-label="Наверх">
        <i className="fas fa-chevron-up"></i>
      </button>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: COOKIE_BANNER_HTML }} />
    </>
  )
}
