import { getGlobal } from '@/lib/payload'

/** Блок «Привет, я Георгий» — вместо старого блока «Команда». */
export default async function Founder() {
  const [s, h] = await Promise.all([getGlobal<any>('settings'), getGlobal<any>('home')])
  const stats: { value: number; suffix?: string; label: string }[] = h?.heroStats?.length
    ? h.heroStats
    : [
        { value: 10, suffix: '+', label: 'сайтов запущено' },
        { value: 5, label: 'лет в разработке' },
        { value: 14, label: 'дней на лендинг' },
      ]
  const tg = s?.telegramUrl || 'https://t.me/KRAKENO9'
  const does = [
    { icon: 'fa-pen-ruler', tone: 'pink', title: 'Дизайн', text: 'Рисую макет с нуля в Figma под ваш бизнес, без шаблонов.' },
    { icon: 'fa-code', tone: 'purple', title: 'Разработка', text: 'Собираю быстрый адаптивный сайт и удобную админку.' },
    { icon: 'fa-chart-line', tone: 'cyan', title: 'SEO и запуск', text: 'Настраиваю аналитику, мета-теги и индексацию с первого дня.' },
  ]
  const skills = ['Figma', 'WordPress', 'PHP', 'JavaScript', 'Next.js', 'SEO']
  return (
    <section className="section-padding" id="team">
      <div className="container">
        <div className="gb-founder">
          <div className="gb-founder__photo-wrap">
            <div className="gb-founder__glow" aria-hidden="true"></div>
            <div className="gb-founder__frame">
              <div className="gb-founder__photo">
                <img src="/legacy/img/founder.webp" alt="Георгий Каляков" width={1119} height={1406} loading="lazy" />
                <div className="gb-founder__scrim" aria-hidden="true"></div>
                <div className="gb-founder__id">
                  <span className="gb-founder__status">
                    <span className="gb-founder__dot"></span>На связи в Telegram
                  </span>
                  <div className="gb-founder__name">Георгий Каляков</div>
                  <div className="gb-founder__role">Основатель GeoBit · дизайнер и разработчик</div>
                </div>
              </div>
            </div>
          </div>
          <div className="gb-founder__body">
            <div className="gb-founder__head">
              <span className="section-tag">Кто делает ваш сайт</span>
              <h2 className="section-title">
                Привет, я <span className="gradient-text">Георгий</span>
              </h2>
              <p className="gb-founder__lead">
                GeoBit — это я. Сам веду проект от первого созвона до запуска: придумываю дизайн, верстаю, программирую и
                настраиваю SEO. Вы общаетесь напрямую с тем, кто делает сайт, — без менеджеров и испорченного телефона.
              </p>
            </div>
            <div className="gb-founder__stats">
              {stats.map((st, i) => (
                <div className="gb-founder__stat" key={i}>
                  <div className="gb-founder__stat-num">
                    {st.value}
                    <span>{st.suffix || ''}</span>
                  </div>
                  <div className="gb-founder__stat-label">{st.label}</div>
                </div>
              ))}
            </div>
            <div className="gb-founder__does">
              {does.map((d) => (
                <div className="gb-founder__card" key={d.title}>
                  <span className={`gb-founder__ico gb-tone-${d.tone}`}>
                    <i className={`fas ${d.icon}`}></i>
                  </span>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                </div>
              ))}
            </div>
            <div className="gb-founder__skills">
              {skills.map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            <div className="gb-founder__actions">
              <a href={tg} target="_blank" rel="noopener" className="btn btn-primary btn-lg">
                <i className="fab fa-telegram"></i>
                <span>Написать мне в Telegram</span>
              </a>
              <a href="https://vk.com/kraken_o9" target="_blank" rel="noopener" aria-label="VK" className="gb-founder__soc">
                <i className="fab fa-vk"></i>
              </a>
              <a href="https://github.com/O9kraken" target="_blank" rel="noopener" aria-label="GitHub" className="gb-founder__soc">
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
