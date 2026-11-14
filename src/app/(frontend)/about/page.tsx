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
  return buildMeta({ path: '/about/', seo: g?.seo, title: 'О веб-студии GeoBit' })
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
          <div className="ab2-story">
            <div className="ab2-story__text">
              <span className="section-tag">Наша история</span>
              <Html as="h2" className="section-title ab2-left" html={g?.storyTitle || 'Кто такие <span class="gradient-text">GeoBit</span>'} />
              <p>{g?.storyText1 || 'GeoBit — студия веб-разработки и дизайна, основанная с одной целью: помогать бизнесу расти в цифровом пространстве.'}</p>
              {g?.storyText2 && <p>{g.storyText2}</p>}
            </div>
            <div className="ab2-story__media">
              {storyImg ? (
                <img src={storyImg} alt={g?.storyImage?.alt || 'Студия GeoBit'} width={600} height={600} loading="lazy" />
              ) : (
                <div className="gb-img-placeholder" aria-hidden="true"></div>
              )}
            </div>
            <div className="ab2-stats">
              {stats.map((st: any, i: number) => (
                <div key={i} className="ab2-stat">
                  <span className="ab2-stat__ico" style={{ color: st.color }}>
                    {st.icon && <i className={fa(st.icon, 'fa-star')}></i>}
                  </span>
                  <div>
                    <div className="ab2-stat__val">{st.val}</div>
                    <div className="ab2-stat__lbl">{st.lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Founder />

      <section className="section-padding bg-dark-2">
        <div className="container">
          <figure className="ab2-mission">
            <span className="ab2-mission__mark" aria-hidden="true">
              <i className="fas fa-quote-left"></i>
            </span>
            <div>
              <span className="section-tag">Миссия</span>
              <blockquote>
                {g?.missionText ||
                  'Хороший сайт — это не про красивую картинку, а про рабочий инструмент, который приводит клиентов и приносит прибыль. Каждый проект — это партнёрство, где успех клиента становится общим успехом.'}
              </blockquote>
              <figcaption>{g?.missionAuthor || 'Георгий Каляков, GeoBit'}</figcaption>
            </div>
          </figure>
        </div>
      </section>

      <section className="section-padding" id="why">
        <div className="container">
          <div className="ab2-head">
            <div>
              <span className="section-tag">Почему GeoBit</span>
              <Html as="h2" className="section-title ab2-left" html={g?.whyTitle || 'Почему выбирают <span class="gradient-text">GeoBit</span>'} />
            </div>
            <p>Что вы получаете, когда заказываете сайт здесь</p>
          </div>
          <div className="ab2-why">
            {why.map((w: any, i: number) => (
              <div key={i} className={'ab2-why__card' + (i < 2 ? ' is-big' : '')} data-aos="fade-up">
                <span className="ab2-why__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="ab2-why__ico">
                  <i className={fa(w.icon)}></i>
                </span>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-dark-2" id="values">
        <div className="container">
          <div className="ab2-split">
            <div className="ab2-split__aside">
              <span className="section-tag">Ценности</span>
              <Html as="h2" className="section-title ab2-left" html={g?.valuesTitle || 'Мой <span class="gradient-text">подход</span>'} />
              <p>Принципы, по которым идёт работа над каждым проектом.</p>
            </div>
            <ol className="ab2-values">
              {values.map((v: any, i: number) => (
                <li key={i}>
                  <span className="ab2-values__num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{v.title}</h3>
                    <p>{v.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {tech.length > 0 && (
        <section className="section-padding" id="tech">
          <div className="container">
            <div className="ab2-head">
              <div>
                <span className="section-tag">Стек</span>
                <h2 className="section-title ab2-left">{g?.techTitle || 'Технологии'}</h2>
              </div>
              <p>Инструменты, на которых собираются проекты</p>
            </div>
            <div className="ab2-tech">
              {tech.map((t, i) => (
                <div key={i} className="ab2-tech__chip">
                  <i className={t.icon || 'fas fa-code'}></i>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="section-padding bg-dark-2" id="timeline">
          <div className="container">
            <div className="ab2-head">
              <div>
                <span className="section-tag">Хронология</span>
                <h2 className="section-title ab2-left" dangerouslySetInnerHTML={{ __html: 'Мой <span class="gradient-text">путь</span>' }} />
              </div>
            </div>
            <ol className="ab2-tl" style={{ ['--n' as any]: timeline.length }}>
              {timeline.map((tl, idx) => (
                <li key={idx}>
                  <span className="ab2-tl__dot" aria-hidden="true"></span>
                  {tl.year && <div className="ab2-tl__year">{tl.year}</div>}
                  <h3>{tl.title}</h3>
                  {tl.text && <p>{tl.text}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="section-padding" id="guarantees">
        <div className="container">
          <div className="ab2-head">
            <div>
              <span className="section-tag">Гарантии</span>
              <h2 className="section-title ab2-left" dangerouslySetInnerHTML={{ __html: 'Работаю <span class="gradient-text">честно и открыто</span>' }} />
            </div>
            <p>Что гарантировано каждому клиенту</p>
          </div>
          <div className="ab2-guar">
            {guarantees.map((gg: any, i: number) => (
              <div key={i} className="ab2-guar__card" data-aos="fade-up">
                <span className="ab2-guar__ico">
                  <i className={fa(gg.icon, 'fa-shield-halved')}></i>
                </span>
                <h3>{gg.title}</h3>
                <p>{gg.text}</p>
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
