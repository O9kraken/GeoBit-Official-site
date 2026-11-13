import { FaqList, Html, JsonLd, MaxIcon, faqSchema, type FaqItem } from '@/components/Common'
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
          <div className="hero-card">
            <div className="card-glow"></div>
            <div className="card-inner">
              <div className="card-screen">
                <div className="screen-bar">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="screen-content">
                  <div className="code-line">
                    <span className="c-blue">.geobit</span> <span className="c-white">{'{'}</span>
                  </div>
                  <div className="code-line pad">
                    <span className="c-cyan">city</span>
                    <span className="c-white">: </span>
                    <span className="c-green">Севастополь</span>
                    <span className="c-white">;</span>
                  </div>
                  <div className="code-line pad">
                    <span className="c-cyan">design</span>
                    <span className="c-white">: </span>
                    <span className="c-green">с нуля</span>
                    <span className="c-white">;</span>
                  </div>
                  <div className="code-line pad">
                    <span className="c-cyan">price</span>
                    <span className="c-white">: </span>
                    <span className="c-green">в договоре</span>
                    <span className="c-white">;</span>
                  </div>
                  <div className="code-line pad">
                    <span className="c-cyan">landing</span>
                    <span className="c-white">: </span>
                    <span className="c-pink">от {landingPrice || '29 900 ₽'}</span>
                    <span className="c-white">;</span>
                  </div>
                  <div className="code-line">
                    <span className="c-white">{'}'}</span>
                  </div>
                </div>
              </div>
              <div className="card-metrics">
                <div className="metric">
                  <i className="fas fa-bolt c-green"></i>
                  <span>Лендинг 1–2 недели</span>
                </div>
                <div className="metric">
                  <i className="fas fa-search c-cyan"></i>
                  <span>SEO с первого дня</span>
                </div>
                <div className="metric">
                  <i className="fas fa-mobile-alt c-pink"></i>
                  <span>Адаптив</span>
                </div>
              </div>
            </div>
          </div>
          {badges.slice(0, 3).map((b, i) => (
            <div key={i} className={`floating-badge fb${i + 1}`}>
              <i className={b.icon || 'fas fa-check'}></i>
              <span>{b.text}</span>
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
          <span className="section-tag">{h?.servicesTag || 'Что мы делаем'}</span>
          <Html as="h2" className="section-title" html={h?.servicesTitle || 'Наши <span class="gradient-text">услуги</span>'} />
          <p className="section-desc">{h?.servicesDesc || 'Полный цикл создания веб-присутствия — от идеи до запуска и продвижения'}</p>
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
              <h3>Не нашли нужную услугу?</h3>
              <p>Ознакомьтесь со всеми нашими предложениями</p>
              <a href="/services/" className="btn btn-primary">
                Больше услуг
              </a>
            </div>
            <div className="cta-card-bg"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

const DEFAULT_ABOUT_FEATURES = [
  { icon: 'fa-bolt', title: 'Скорость', text: 'Сдаём проекты в срок без потери качества' },
  { icon: 'fa-gem', title: 'Качество', text: 'Чистый код, современный дизайн, высокая производительность' },
  { icon: 'fa-headset', title: 'Поддержка', text: 'Сопровождаем проект после запуска, всегда на связи' },
  { icon: 'fa-chart-line', title: 'SEO с нуля', text: 'Оптимизируем каждый сайт под поисковые системы' },
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
              <Html as="h2" className="gb-ab-title" html={h?.aboutTitle || 'Мы создаём <span class="gradient-text">цифровые продукты</span> с душой'} />
              <p className="gb-ab-text">{h?.aboutText1}</p>
              <p className="gb-ab-text">{h?.aboutText2}</p>
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
                <strong>Хотите узнать больше?</strong>
                <span>Расскажем о подходе и наших проектах</span>
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
  { num: '01', title: 'Анализ', text: 'Изучаем ваш бизнес, конкурентов и целевую аудиторию. Определяем цели проекта и стратегию.', duration: '1–2 дня' },
  { num: '02', title: 'Дизайн', text: 'Создаём прототипы и уникальный дизайн. Согласовываем с вами каждый экран до старта разработки.', duration: '3–5 дней' },
  { num: '03', title: 'Разработка', text: 'Верстаем и программируем по утверждённому дизайну. Пишем чистый, оптимизированный код.', duration: '5–14 дней' },
  { num: '04', title: 'Тестирование', text: 'Проверяем работу на всех устройствах и браузерах. Оптимизируем скорость и исправляем баги.', duration: '1–2 дня' },
  { num: '05', title: 'Запуск', text: 'Публикуем сайт, настраиваем аналитику и передаём вам с инструкцией по управлению.', duration: '1 день' },
]

export function ProcessSection({ h }: { h: any }) {
  const steps = h?.processSteps?.length ? h.processSteps : DEFAULT_STEPS
  return (
    <section className="process section-padding" id="process">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{h?.processTag || 'Как мы работаем'}</span>
          <Html as="h2" className="section-title" html={h?.processTitle || 'Процесс <span class="gradient-text">работы</span>'} />
          <p className="section-desc">{h?.processDesc || 'Прозрачный процесс на каждом этапе — знаете, что происходит с вашим проектом'}</p>
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
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: 'Наши <span class="gradient-text">работы</span>' }} />
          <p className="section-desc">Каждый проект — уникальное решение под конкретный бизнес</p>
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

const DEFAULT_ADVANTAGES = [{"icon": "fa-tachometer-alt", "title": "Скорость загрузки", "text": "Оптимизируем каждый сайт до показателя Google PageSpeed ≥ 90. Быстрый сайт = больше клиентов.", "metricValue": 95, "metricLabel": "PageSpeed 95/100"}, {"icon": "fa-mobile-alt", "title": "Адаптивность", "text": "Mobile-first подход. Сайт идеально работает на смартфонах, планшетах и десктопах.", "metricValue": 100, "metricLabel": "100% адаптивность"}, {"icon": "fa-search", "title": "SEO с первого дня", "text": "Каждый сайт создаётся с учётом требований поисковых систем: мета-теги, семантика, скорость.", "metricValue": 90, "metricLabel": "SEO Score 90+"}, {"icon": "fa-shield-alt", "title": "Безопасность", "text": "HTTPS, защита от спама и взлома, регулярные бэкапы — ваш сайт под надёжной защитой 24/7.", "metricValue": 100, "metricLabel": "Security 100%"}, {"icon": "fa-clock", "title": "Сроки", "text": "Фиксируем сроки в договоре и соблюдаем их. Лендинг — от 7 дней, корпоративный — от 14.", "metricValue": 88, "metricLabel": "88% сдача в срок"}, {"icon": "fa-headset", "title": "Поддержка 24/7", "text": "После сдачи проекта остаёмся на связи. Бесплатная поддержка 30 дней, далее — по договору.", "metricValue": 98, "metricLabel": "98% решений за 24ч"}]

export function AdvantagesSection({ items: raw }: { items: any[] }) {
  const items = raw?.length ? raw : DEFAULT_ADVANTAGES
  const ic = (s?: string) => (s && /^fa[srbl]? /.test(s) ? s : `fas ${s || 'fa-check'}`)
  return (
    <section className="advantages section-padding" id="advantages">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Почему мы</span>
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: 'Наши <span class="gradient-text">преимущества</span>' }} />
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
          <p className="section-desc">Делимся знаниями о веб-разработке, дизайне и SEO</p>
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

export function HomeFaq({ h, faqs }: { h: any; faqs: FaqItem[] }) {
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
