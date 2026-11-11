import type { Metadata } from 'next'
import { FaqSection, Html } from '@/components/Common'
import LegacyScripts from '@/components/LegacyScripts'
import Founder from '@/components/sections/Founder'
import Cta from '@/components/sections/Cta'
import { PortfolioSection, TestimonialsSection } from '@/components/sections/Home'
import { Newsletter, PageHero, pageFaqs } from '@/components/sections/Pages'
import { getGlobal, getProjects, getTeam, getTestimonials, usedPortfolioCats } from '@/lib/payload'
import { buildMeta } from '@/lib/seo'
import { mediaUrl } from '@/lib/util'


export async function generateMetadata(): Promise<Metadata> {
  const g = await getGlobal<any>('about-page')
  return buildMeta({ path: '/about/', title: g?.seo?.title || 'О веб-студии GeoBit', description: g?.seo?.description, image: g?.seo?.image })
}

const COLORS = ['var(--accent-cyan)', 'var(--accent-purple)', 'var(--accent-pink)', 'var(--accent-green)', 'var(--accent-cyan)', 'var(--accent-purple)']
const fa = (i?: string, def = 'fa-check') => (i && /^fa[srbl]? /.test(i) ? i : `fas ${i || def}`)

const DEF_WHY = [
  { icon: 'fa-bolt', title: 'Скорость', text: 'Сдаём проекты в срок без потери качества — от лендинга за неделю до магазина за месяц.' },
  { icon: 'fa-gem', title: 'Качество', text: 'Чистый код, современный адаптивный дизайн и высокая производительность на всех устройствах.' },
  { icon: 'fa-headset', title: 'Поддержка 24/7', text: 'Сопровождаем проект после запуска и всегда остаёмся на связи по любым вопросам.' },
  { icon: 'fa-chart-line', title: 'SEO с нуля', text: 'Оптимизируем каждый сайт под поисковые системы, чтобы он приводил клиентов из поиска.' },
  { icon: 'fa-ruble-sign', title: 'Честные цены', text: 'Фиксируем стоимость и сроки в договоре — никаких скрытых платежей в процессе.' },
  { icon: 'fa-shield-halved', title: 'Гарантия результата', text: 'Даём гарантию на работу сайта и бесплатно исправляем любые недочёты после сдачи.' },
]
const DEF_VALUES = [
  { title: 'Результат, а не процесс', text: 'Мы фокусируемся на измеримом результате для вашего бизнеса.' },
  { title: 'Прозрачность', text: 'Никаких скрытых платежей. Фиксируем стоимость и сроки в договоре.' },
  { title: 'Качество без компромиссов', text: 'Пишем чистый поддерживаемый код. Тестируем всё до сдачи.' },
  { title: 'Долгосрочное партнёрство', text: 'Мы не просто делаем сайт и уходим. Остаёмся на связи.' },
  { title: 'Глубокое погружение', text: 'Изучаем ваш бизнес и конкурентов перед началом работы.' },
  { title: 'Непрерывное развитие', text: 'Постоянно изучаем новые технологии. Наши клиенты всегда впереди.' },
]
const DEF_GUAR = [
  { icon: 'fa-file-contract', title: 'Договор и гарантии', text: 'Работаем официально по договору с фиксацией стоимости, сроков и объёма работ.' },
  { icon: 'fa-clock-rotate-left', title: 'Соблюдение сроков', text: 'Составляем прозрачный план проекта и придерживаемся согласованного графика.' },
  { icon: 'fa-code-branch', title: 'Исходники — ваши', text: 'Передаём полный доступ к сайту, коду и всем материалам проекта.' },
  { icon: 'fa-life-ring', title: 'Бесплатная поддержка', text: 'Первый месяц после запуска сопровождаем и правим недочёты бесплатно.' },
]

export default async function AboutPage() {
  const [g, team, testimonials, projects] = await Promise.all([getGlobal<any>('about-page'), getTeam(), getTestimonials(), getProjects()])
  const [cats, faqs] = await Promise.all([usedPortfolioCats(projects), pageFaqs(g?.faq)])
  const stats = g?.stats?.length
    ? g.stats.map((s: any, i: number) => ({ icon: s.icon || 'fa-star', val: s.value, lbl: s.label, color: COLORS[i] }))
    : [
        { icon: 'fa-star', val: '50+', lbl: 'Проектов', color: COLORS[0] },
        { icon: 'fa-clock', val: '5+', lbl: 'Лет опыта', color: COLORS[1] },
        { icon: 'fa-smile', val: '98%', lbl: 'Довольных клиентов', color: COLORS[2] },
      ]
  const storyImg = mediaUrl(g?.storyImage, 'card') || mediaUrl(g?.storyImage)
  const why = g?.why?.length ? g.why : DEF_WHY
  const values = g?.values?.length ? g.values : DEF_VALUES
  const guarantees = g?.guarantees?.length ? g.guarantees : DEF_GUAR
  const tech: any[] = g?.tech || []
  const timeline: any[] = g?.timeline || []
  return (
    <main id="main" role="main">
      <PageHero
        crumbs={[{ label: 'О нас' }]}
        tag={g?.tag || 'О студии'}
        title={g?.title || 'Мы создаём <span class="gradient-text">цифровые продукты</span> с душой'}
        subtitle={g?.subtitle || 'Веб-студия GeoBit — команда профессионалов с многолетним опытом'}
      />

      <section className="section-padding bg-dark-2">
        <div className="container">
          <div className="about-story-grid">
            <div>
              <span className="section-tag">Наша история</span>
              <Html as="h2" className="section-title about-story-title" html={g?.storyTitle || 'Кто такие <span class="gradient-text">GeoBit</span>'} />
              <p className="about-story-p">{g?.storyText1 || 'GeoBit — студия веб-разработки и дизайна, основанная с одной целью: помогать бизнесу расти в цифровом пространстве.'}</p>
              {g?.storyText2 && <p className="about-story-p">{g.storyText2}</p>}
              <div className="about-stats" style={{ ['--about-stats-cols' as any]: 1 }}>
                {stats.map((st: any, i: number) => (
                  <div key={i} className="about-stat" style={{ ['--stat-color' as any]: st.color }}>
                    {st.icon && <i className={fa(st.icon, 'fa-star')}></i>}
                    <div className="about-stat-val">{st.val}</div>
                    <div className="about-stat-lbl">{st.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              {storyImg ? (
                <img src={storyImg} alt={g?.storyImage?.alt || 'Студия GeoBit'} width={600} height={600} className="about-story-img" loading="lazy" />
              ) : (
                <div className="about-story-img gb-img-placeholder" aria-hidden="true"></div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="about-mission section-padding">
        <div className="container">
          <div className="about-mission-inner">
            <span className="about-mission-quote" aria-hidden="true">
              “
            </span>
            <span className="section-tag">Наша миссия</span>
            <p className="about-mission-text">
              {g?.missionText ||
                'Мы верим, что хороший сайт — это не про красивую картинку, а про рабочий инструмент, который приводит клиентов и приносит прибыль. Каждый проект для нас — это партнёрство, где успех клиента становится нашим успехом.'}
            </p>
            <div className="about-mission-author">
              <span className="about-mission-line"></span>
              {g?.missionAuthor || 'Команда GeoBit'}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-dark-2" id="why">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Почему мы</span>
            <Html as="h2" className="section-title" html={g?.whyTitle || 'Почему выбирают <span class="gradient-text">GeoBit</span>'} />
            <p className="section-desc">Шесть причин доверить нам ваш проект</p>
          </div>
          <div className="about-why-grid">
            {why.map((w: any, i: number) => (
              <div key={i} className="about-why-card" data-aos="fade-up">
                <div className="about-why-icon">
                  <i className={fa(w.icon)}></i>
                </div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Founder />

      <section className="section-padding bg-dark-2" id="values">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Ценности</span>
            <Html as="h2" className="section-title" html={g?.valuesTitle || 'Наш <span class="gradient-text">подход</span>'} />
          </div>
          <div className="values-grid">
            {values.map((v: any, i: number) => (
              <div key={i} className="value-card" data-aos="fade-up">
                <div className="value-num">{String(i + 1).padStart(2, '0')}</div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {tech.length > 0 && (
        <section className="section-padding" id="tech">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Стек</span>
              <h2 className="section-title">{g?.techTitle || 'Технологии которые мы используем'}</h2>
            </div>
            <div className="about-tech-grid">
              {tech.map((t, i) => (
                <div key={i} className="about-tech-card">
                  <div className="about-tech-head">
                    <i className={t.icon || 'fab fa-wordpress'}></i>
                    <span className="about-tech-label">{t.label}</span>
                    <span className="about-tech-level">{t.level ?? 80}%</span>
                  </div>
                  <div className="about-tech-track">
                    <div className="metric-fill about-tech-fill" data-width={t.level ?? 80}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="section-padding bg-dark-2" id="timeline">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Хронология</span>
              <h2 className="section-title" dangerouslySetInnerHTML={{ __html: 'Наш <span class="gradient-text">путь</span>' }} />
            </div>
            <div className="about-timeline">
              <div className="about-timeline-line"></div>
              {timeline.map((tl, idx) => (
                <div key={idx} className={`about-tl-row ${idx % 2 === 0 ? 'tl-left' : 'tl-right'}`}>
                  <div className="about-tl-card">
                    {tl.year && <div className="about-tl-year">{tl.year}</div>}
                    <h3 className="about-tl-title">{tl.title}</h3>
                    {tl.text && <p className="about-tl-text">{tl.text}</p>}
                  </div>
                  <div className="about-tl-dot"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-padding" id="guarantees">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Гарантии</span>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: 'Работаем <span class="gradient-text">честно и открыто</span>' }} />
            <p className="section-desc">Что мы гарантируем каждому клиенту</p>
          </div>
          <div className="about-guarantee-grid">
            {guarantees.map((gg: any, i: number) => (
              <div key={i} className="about-guarantee-card" data-aos="fade-up">
                <div className="about-guarantee-icon">
                  <i className={fa(gg.icon, 'fa-shield-halved')}></i>
                </div>
                <div>
                  <h3>{gg.title}</h3>
                  <p>{gg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection items={testimonials} />
      <PortfolioSection projects={projects} categories={cats} />
      <Newsletter />
      <FaqSection faqs={faqs} />
      <Cta />
      <LegacyScripts src={['/legacy/js/newsletter.js', '/legacy/js/inline-cta-0.js']} />
    </main>
  )
}
