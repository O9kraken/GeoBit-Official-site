import { FaqList, Html, JsonLd, MaxIcon, faqSchema, topFaq, type FaqItem } from '@/components/Common'
import { paths, typo } from '@/lib/util'
import { BlogCard, PfCard, TestimonialsSlider } from './Cards'
import Founder from './Founder'

const actionHref = (action?: string, custom?: string) => {
  switch (action) {
    case 'portfolio':
      return '/portfolio/'
    case 'contacts':
      return '/contacts/'
    case 'calculator':
      return '#calculator'
    case 'custom':
      return custom || '/'
    default:
      return null // popup
  }
}

function HeroButton({ text, action, custom, primary }: { text: string; action?: string; custom?: string; primary?: boolean }) {
  const href = actionHref(action, custom)
  const cls = `btn ${primary ? 'btn-primary' : 'btn-outline'} btn-lg`
  const external = href?.startsWith('http')
  if (!href)
    return (
      <button type="button" className={cls} data-lead-open>
        <span>{text}</span>
        {primary && <i className="fas fa-arrow-right"></i>}
      </button>
    )
  return (
    <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
      {!primary && external && href.includes('t.me') && <i className="fab fa-telegram"></i>}
      <span>{text}</span>
      {primary && <i className="fas fa-arrow-right"></i>}
    </a>
  )
}

export function Hero({ h, landingPrice }: { h: any; landingPrice?: string }) {
  const t1: string = h?.heroTitle1 || 'Сайты для бизнеса'
  const t2: string = h?.heroTitle2 || 'в Севастополе и Крыму'
  const stats: { value: number; suffix?: string; label: string }[] = h?.heroStats?.length
    ? h.heroStats
    : [
        { value: 10, suffix: '+', label: 'Сайтов запущено' },
        { value: 5, suffix: '', label: 'Лет в разработке' },
        { value: 14, suffix: '', label: 'Дней на лендинг' },
      ]
  const badges: { icon?: string; text: string }[] = h?.heroBadges?.length
    ? h.heroBadges
    : [
        { icon: 'fas fa-pen-ruler', text: 'Дизайн с нуля' },
        { icon: 'fas fa-file-signature', text: 'Цена в договоре' },
        { icon: 'fas fa-map-marker-alt', text: 'Севастополь' },
      ]
  return (
    <section className="hero" id="hero">
      <canvas id="heroCanvas"></canvas>
      <div className="hero-bg-grid"></div>
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>{h?.heroBadge || 'Севастополь, Крым и вся Россия'}</span>
          </div>
          <h1 className={`hero-title${(t1 + t2).length > 22 ? ' hero-title--long' : ''}`}>
            <span className="line">{typo(t1)}</span>
            <span className="line gradient-text">{typo(t2)}</span>
          </h1>
          <p className="hero-subtitle">
            {h?.heroSubtitle ||
              'Лендинги и корпоративные сайты с уникальным дизайном, без шаблонов. Цена фиксируется в договоре, вы работаете напрямую с разработчиком.'}
          </p>
          <div className="hero-actions">
            <HeroButton primary text={h?.heroCta1Text || 'Рассчитать стоимость'} action={h?.heroCta1Action || 'calculator'} custom={h?.heroCta1ActionCustom} />
            <HeroButton text={h?.heroCta2Text || 'Написать в Telegram'} action={h?.heroCta2Action || 'custom'} custom={h?.heroCta2ActionCustom || 'https://t.me/KRAKENO9'} />
          </div>
          <div className="hero-stats">
            {stats.map((st, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && <div className="stat-divider"></div>}
                <div className="stat-item">
                  <span className="stat-num" data-count={st.value}>
                    {st.value}
                  </span>
                  <span>{st.suffix || ''}</span>
                  <span className="stat-label">{st.label}</span>
                </div>
              </span>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card hcode">
            <div className="card-glow"></div>
            <div className="card-inner">
              <div className="hcode__bar">
                <span className="hcode__dots" aria-hidden="true">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
                <span className="hcode__tab">
                  <i className="fab fa-js" aria-hidden="true"></i>geobit.config.js
                </span>
              </div>
              <div className="hcode__body">
                <ol className="hcode__code" aria-label="Коротко о студии">
                  <li>
                    <span className="t-com">{'// студия веб-разработки'}</span>
                  </li>
                  <li>
                    <span className="t-key">export const </span><span className="t-var">studio </span><span className="t-pun">= {'{'}</span>
                  </li>
                  <li className="in">
                    <span className="t-prop">city</span>
                    <span className="t-pun">: </span>
                    <span className="t-str">{"'Севастополь'"}</span>
                    <span className="t-pun">,</span>
                  </li>
                  <li className="in">
                    <span className="t-prop">design</span>
                    <span className="t-pun">: </span>
                    <span className="t-str">{"'с нуля'"}</span>
                    <span className="t-pun">,</span>
                  </li>
                  <li className="in">
                    <span className="t-prop">price</span>
                    <span className="t-pun">: </span>
                    <span className="t-str">{"'в договоре'"}</span>
                    <span className="t-pun">,</span>
                  </li>
                  <li className="in">
                    <span className="t-prop">landing</span>
                    <span className="t-pun">: </span>
                    <span className="t-num">{`'от ${landingPrice || '29 900 ₽'}'`}</span>
                    <span className="t-pun">,</span>
                  </li>
                  <li>
                    <span className="t-pun">{'}'}</span>
                    <span className="hcode__cursor" aria-hidden="true"></span>
                  </li>
                </ol>
              </div>
              <div className="hcode__status">
                <span>
                  <i className="fas fa-bolt" aria-hidden="true"></i>Лендинг 1–2 недели
                </span>
                <span>
                  <i className="fas fa-search" aria-hidden="true"></i>SEO с первого дня
                </span>
                <span>
                  <i className="fas fa-mobile-alt" aria-hidden="true"></i>Адаптив
                </span>
              </div>
            </div>
          </div>
          {badges.slice(0, 3).map((b, i) => (
            <div key={i} className={`floating-badge hbadge fb${i + 1}`}>
              <span className="hbadge__ico" aria-hidden="true">
                <i className={b.icon || 'fas fa-check'}></i>
              </span>
              <span className="hbadge__txt">{b.text}</span>
              {i === 0 && <span className="hbadge__ping" aria-hidden="true"></span>}
            </div>
          ))}
        </div>
      </div>
      <div className="scroll-hint">
        <div className="scroll-line"></div>
        <span>Скролл</span>
      </div>
    </section>
  )
}

export function ServicesSection({ h, services }: { h: any; services: any[] }) {
  return (
    <section className="services section-padding" id="services">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{h?.servicesTag || 'Услуги'}</span>
          <Html as="h2" className="section-title" html={h?.servicesTitle || 'Создание сайтов <span class="gradient-text">под ключ</span>'} />
          <p className="section-desc">{h?.servicesDesc || 'Делаю сайты для бизнеса в Севастополе, по Крыму и удалённо по всей России — от лендинга за неделю до интернет-магазина. Цена известна заранее.'}</p>
        </div>
        <div className="services-grid">
          {services.slice(0, 5).map((s, i) => (
            <div key={s.id} className={'service-card ' + (s.featured ? 'featured' : '')} data-aos="fade-up" data-delay={i * 100}>
              <div className="service-icon">
                <i className={s.icon || 'fas fa-code'}></i>
              </div>
              <div className="service-num">{s.number || String(i + 1).padStart(2, '0')}</div>
              <h3>{s.title}</h3>
              <p>{s.excerpt}</p>
              {s.features?.length > 0 && (
                <ul className="service-features">
                  {s.features.map((f: any) => (
                    <li key={f.id || f.text}>
                      <i className="fas fa-check"></i> {f.text}
                    </li>
                  ))}
                </ul>
              )}
              {s.price && (
                <div className="service-card-price">
                  <span className="service-card-price-value">от</span>
                  <span className="service-card-price-value">{s.price}</span>
                </div>
              )}
              <a href={paths.service(s.slug)} className="btn btn-outline">
                <span>Подробнее</span>
                <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          ))}
          <div className="service-cta-card" data-aos="fade-up" data-delay={Math.min(services.length, 5) * 100}>
            <div className="cta-card-content">
              <h3>Нужно что-то другое?</h3>
              <p>Логотип, фирменный стиль, дизайн или доработка готового сайта — всё в разделе услуг</p>
              <a href="/services/" className="btn btn-primary">
                Все услуги
              </a>
            </div>
            <div className="cta-card-bg"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

const ABOUT_TITLE = 'Сайты, которые <span class="gradient-text">приводят клиентов</span>'
const ABOUT_TEXT1 =
  'GeoBit — небольшая студия из Севастополя. Я делаю сайты для малого и среднего бизнеса: лендинги, сайты-визитки, корпоративные сайты и интернет-магазины. Каждый рисую с нуля под задачу, а не собираю из шаблона, — поэтому он выглядит как ваш бренд, а не как соседний сайт в выдаче.'
const ABOUT_TEXT2 =
  'Для меня сайт — не картинка, а рабочий инструмент: он должен быстро открываться, находиться в Яндексе и превращать посетителей в заявки. Поэтому адаптив под телефоны, базовое SEO и аналитика входят в каждый проект. Если нужно, сделаю логотип и фирменный стиль и займусь продвижением.'

const DEFAULT_ABOUT_FEATURES = [
  { icon: 'fa-bolt', title: 'Точно в срок', text: 'Сроки прописываю в договоре и держу их' },
  { icon: 'fa-gem', title: 'Быстрые сайты', text: 'Страницы открываются за секунды даже с телефона' },
  { icon: 'fa-headset', title: 'На связи', text: 'Первый месяц после запуска правлю бесплатно' },
  { icon: 'fa-chart-line', title: 'Видно в поиске', text: 'Структура и SEO под Яндекс с первого дня' },
]

export function AboutSection({ h, team }: { h: any; team: any[] }) {
  const features = h?.aboutFeatures?.length ? h.aboutFeatures : DEFAULT_ABOUT_FEATURES
  const used = 6 + 2 + features.length
  let ctaSpan = (4 - (used % 4)) % 4
  if (ctaSpan < 2) ctaSpan = 4
  let d = 0
  const ic = (s?: string) => (s && /^fa[srbl]? /.test(s) ? s : `fas ${s || 'fa-check'}`)
  return (
    <>
      <section className="about section-padding" id="about">
        <canvas id="cubesCanvas" className="about-cubes"></canvas>
        <div className="about-veil" aria-hidden="true"></div>
        <div className="container">
          <div className="gb-about" id="gbAbout">
            <div className="gb-ab-card gb-ab-intro" style={{ ['--d' as any]: d++ }}>
              <span className="section-tag">{h?.aboutTag || 'О студии'}</span>
              <Html as="h2" className="gb-ab-title" html={h?.aboutTitle || ABOUT_TITLE} />
              <p className="gb-ab-text">{h?.aboutText1 || ABOUT_TEXT1}</p>
              <p className="gb-ab-text">{h?.aboutText2 || ABOUT_TEXT2}</p>
            </div>
            <div className="gb-ab-card gb-ab-stat" style={{ ['--d' as any]: d++ }}>
              <span className="gb-ab-stat-ico c-gold">
                <i className="fas fa-award"></i>
              </span>
              <strong className="gb-ab-stat-num" data-count={h?.aboutYears || '5+'}>
                {h?.aboutYears || '5+'}
              </strong>
              <span className="gb-ab-stat-lbl">лет в разработке</span>
            </div>
            <div className="gb-ab-card gb-ab-stat" style={{ ['--d' as any]: d++ }}>
              <span className="gb-ab-stat-ico c-cyan">
                <i className="fas fa-star"></i>
              </span>
              <strong className="gb-ab-stat-num" data-count={h?.aboutProjects || '10+'}>
                {h?.aboutProjects || '10+'}
              </strong>
              <span className="gb-ab-stat-lbl">сайтов</span>
            </div>
            {features.map((f: any, i: number) => (
              <div className="gb-ab-card gb-ab-feat" style={{ ['--d' as any]: d++ }} key={i}>
                <span className="gb-ab-ico">
                  <i className={ic(f.icon)}></i>
                </span>
                <h4>{f.title}</h4>
                {f.text && <p>{f.text}</p>}
              </div>
            ))}
            <a href="/about/" className="gb-ab-card gb-ab-cta" style={{ ['--cta-span' as any]: ctaSpan, ['--d' as any]: d++ }}>
              <span className="gb-ab-cta-text">
                <strong>Как я работаю и что уже сделал</strong>
                <span>Подробнее обо мне, подходе и проектах</span>
              </span>
              <span className="gb-ab-cta-btn">
                Узнать больше <i className="fas fa-arrow-right"></i>
              </span>
            </a>
          </div>
        </div>
      </section>
      <Founder />
    </>
  )
}

const DEFAULT_STEPS = [
  { num: '01', title: 'Знакомство', text: 'Созваниваемся, разбираю ваш бизнес, клиентов и конкурентов. Договариваемся о задачах, цене и сроках — всё фиксируем в договоре.', duration: '1–2 дня' },
  { num: '02', title: 'Дизайн', text: 'Рисую дизайн с нуля: сначала главная, потом остальные страницы. Вносим правки, пока вам не понравится.', duration: '3–5 дней' },
  { num: '03', title: 'Разработка', text: 'Собираю сайт по утверждённому дизайну, подключаю формы, админку и всё, что нужно для заявок.', duration: '5–14 дней' },
  { num: '04', title: 'Проверка', text: 'Проверяю на телефонах и компьютерах, ускоряю загрузку, настраиваю SEO: мета-теги, разметку, карту сайта.', duration: '1–2 дня' },
  { num: '05', title: 'Запуск', text: 'Публикую сайт, подключаю Метрику и Вебмастер, показываю, как самому менять тексты, цены и фото.', duration: '1 день' },
]

export function ProcessSection({ h }: { h: any }) {
  const steps = h?.processSteps?.length ? h.processSteps : DEFAULT_STEPS
  return (
    <section className="process section-padding" id="process">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{h?.processTag || 'Как я работаю'}</span>
          <Html as="h2" className="section-title" html={h?.processTitle || 'Как проходит <span class="gradient-text">работа</span>'} />
          <p className="section-desc">{h?.processDesc || 'Пять понятных шагов: на каждом вы видите результат и решаете, идём ли дальше'}</p>
        </div>
        <div className="gb-proc" id="gbProc" data-count={steps.length}>
          <svg className="gb-proc-wire" preserveAspectRatio="none" aria-hidden="true">
            <line className="gb-proc-wire-base" x1="0" y1="0" x2="0" y2="0" />
            <line className="gb-proc-wire-current" x1="0" y1="0" x2="0" y2="0" />
          </svg>
          <div className="gb-proc-track">
            {steps.map((st: any, i: number) => (
              <div className="gb-proc-step" data-index={i} key={i}>
                <div className="gb-proc-node">
                  <span className="gb-proc-num">{st.num || String(i + 1).padStart(2, '0')}</span>
                  <span className="gb-proc-ring" aria-hidden="true"></span>
                </div>
                <div className="gb-proc-card">
                  <h3>{st.title}</h3>
                  <p>{st.text}</p>
                  {st.duration && (
                    <span className="gb-proc-dur">
                      <i className="far fa-clock"></i> {st.duration}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function PortfolioSection({ projects, categories }: { projects: any[]; categories: any[] }) {
  return (
    <section className="portfolio section-padding" id="portfolio">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Портфолио</span>
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: 'Последние <span class="gradient-text">работы</span>' }} />
          <p className="section-desc">Сайты для бизнеса, логотипы и собственные проекты — в каждом кейсе задача, решение и результат</p>
        </div>
        <div className="portfolio-filter">
          <button className="filter-btn active" data-filter="all">
            Все
          </button>
          {categories.map((c) => (
            <button className="filter-btn" data-filter={c.slug} key={c.id}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="pf-grid">
          {projects.slice(0, 6).map((p) => (
            <PfCard p={p} key={p.id} />
          ))}
        </div>
        <div className="section-cta">
          <a href="/portfolio/" className="btn btn-outline btn-lg">
            Смотреть все проекты
          </a>
        </div>
      </div>
    </section>
  )
}

const DEFAULT_ADVANTAGES = [{"icon": "fa-tachometer-alt", "title": "Быстрый сайт", "text": "Сжимаю картинки, убираю лишний код и проверяю скорость в PageSpeed до сдачи. Быстрые страницы выше в поиске и меньше теряют посетителей."}, {"icon": "fa-mobile-alt", "title": "Удобно с телефона", "text": "Большинство клиентов заходят со смартфона, поэтому сначала продумываю мобильную версию, а потом — компьютерную."}, {"icon": "fa-search", "title": "SEO с первого дня", "text": "Структура страниц под запросы, мета-теги, микроразметка, карта сайта, Яндекс Метрика и Вебмастер — уже в цене."}, {"icon": "fa-shield-alt", "title": "Безопасность", "text": "HTTPS, защита форм от спама и резервные копии. Заявки клиентов хранятся в России, как требует 152-ФЗ."}, {"icon": "fa-clock", "title": "Цена и сроки в договоре", "text": "Лендинг — от 7 дней, корпоративный сайт — от 30. Цену называю заранее, и она не растёт по ходу работы."}, {"icon": "fa-headset", "title": "Поддержка после запуска", "text": "Первый месяц исправляю недочёты бесплатно. Дальше — поддержка по договорённости, без обязательной абонентской платы."}]

export function AdvantagesSection({ items: raw }: { items: any[] }) {
  const items = raw?.length ? raw : DEFAULT_ADVANTAGES
  const ic = (s?: string) => (s && /^fa[srbl]? /.test(s) ? s : `fas ${s || 'fa-check'}`)
  return (
    <section className="advantages section-padding" id="advantages">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Что входит</span>
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: 'Что вы получаете <span class="gradient-text">в каждом проекте</span>' }} />
        </div>
        <div className="advantages-grid">
          {items.map((a, i) => (
            <div className="adv-item" data-aos="fade-up" key={i}>
              <div className="adv-icon">
                <i className={ic(a.icon)}></i>
              </div>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
              {a.metricLabel && (
                <div className="adv-metric">
                  <div className="metric-bar">
                    <div className="metric-fill" data-width={a.metricValue ?? 80}></div>
                  </div>
                  <span>{a.metricLabel}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection({ items }: { items: any[] }) {
  if (!items?.length) return null
  return (
    <section className="testimonials section-padding" id="testimonials">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Отзывы</span>
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: 'Что говорят <span class="gradient-text">клиенты</span>' }} />
        </div>
        <TestimonialsSlider items={items} />
      </div>
    </section>
  )
}

export function BlogPreviewSection({ posts }: { posts: any[] }) {
  return (
    <section className="blog-preview section-padding" id="blog">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Блог</span>
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: 'Полезные <span class="gradient-text">статьи</span>' }} />
          <p className="section-desc">Простым языком о том, сколько стоит сайт, как выбрать подрядчика и как получать клиентов из поиска</p>
        </div>
        <div className="blog-grid">
          {posts.length ? (
            posts.slice(0, 3).map((p) => <BlogCard post={p} key={p.id} />)
          ) : (
            <p style={{ color: 'var(--gray-2)', textAlign: 'center', gridColumn: 'span 2' }}>Статьи пока не добавлены.</p>
          )}
        </div>
        <div className="section-cta">
          <a href="/blog/" className="btn btn-outline btn-lg">
            Все статьи
          </a>
        </div>
      </div>
    </section>
  )
}

export function HomeFaq({ h, faqs: all }: { h: any; faqs: FaqItem[] }) {
  const faqs = topFaq(all)
  if (!faqs?.length) return null
  return (
    <>
      <section className="faq section-padding" id="faq">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{h?.faqTag || 'Вопросы и ответы'}</span>
            <Html as="h2" className="section-title" html={h?.faqTitle || 'Частые <span class="gradient-text">вопросы</span>'} />
          </div>
          <FaqList faqs={faqs} />
        </div>
      </section>
      <JsonLd data={faqSchema(faqs)} />
    </>
  )
}

export { MaxIcon }
