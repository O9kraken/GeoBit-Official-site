import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { payload as getPayload } from '@/lib/payload'
import { buildOffer } from '@/lib/prospects/offer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Предварительное предложение | GeoBit',
  robots: { index: false, follow: false },
}

const STEPS = [
  ['Созвон 15 минут', 'Уточняю задачу, показываю примеры, называю точную цену.'],
  ['Макет', 'Дизайн главной страницы под ваш бренд — до начала разработки.'],
  ['Разработка', 'Сайт под ключ: тексты, фото, мобильная версия, SEO-база.'],
  ['Запуск', 'Домен, хостинг, Яндекс Карты и Метрика. Учу обновлять сайт самостоятельно.'],
]

async function load(token: string) {
  if (!/^[a-z0-9]{16,40}$/i.test(token)) return null
  const p = await getPayload()
  const r = await p.find({ collection: 'prospects', where: { kpToken: { equals: token } }, limit: 1, depth: 0, overrideAccess: true })
  return r.docs[0] ? { p, doc: r.docs[0] as any } : null
}

export default async function KpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const got = await load(token)
  if (!got) notFound()
  const { p, doc } = got
  const o = await buildOffer(p, doc)

  // первый просмотр клиентом (свои просмотры из админки не считаем)
  const admin = (await cookies()).get('payload-token')
  if (!admin && !doc.kpViewedAt) {
    await p.update({ collection: 'prospects', id: doc.id, data: { kpViewedAt: new Date().toISOString() } as any, overrideAccess: true, context: { skipScore: true } }).catch(() => {})
  }
  const date = new Date(doc.updatedAt || Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' })

  return (
    <main id="main" role="main" className="kp">
      <style>{CSS}</style>
      <section className="kp-hero">
        <div className="container">
          <span className="kp-tag">Предварительное предложение · {date}</span>
          <h1>
            Сайт для <span className="gradient-text">«{o.company}»</span>
          </h1>
          <p className="kp-lead">{o.pitch}.</p>
        </div>
      </section>

      <section className="container kp-grid">
        <div className="kp-card kp-card--warn">
          <h2>Что я заметил</h2>
          <p>{o.finding}</p>
        </div>
        <div className="kp-card">
          <h2>Что даст сайт</h2>
          <ul>
            {o.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </section>

      {o.service && (
        <section className="container">
          <div className="kp-offer">
            <div>
              <span className="kp-tag">Рекомендую</span>
              <h2>{o.service.title}</h2>
              {o.service.features.length > 0 && (
                <ul>
                  {o.service.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
              <div className="kp-links">
                <a href={o.service.url} target="_blank" rel="noopener">
                  Подробнее об услуге →
                </a>
                {o.landingUrl && (
                  <a href={o.landingUrl} target="_blank" rel="noopener">
                    Как я делаю сайты для вашей сферы →
                  </a>
                )}
              </div>
            </div>
            <div className="kp-price">
              {o.service.price && (
                <>
                  <small>ориентир по цене</small>
                  <b>от {o.service.price.replace(/^от\s*/i, '')}</b>
                </>
              )}
              {o.service.duration && <span>срок — {o.service.duration}</span>}
              <em>Точная стоимость — после короткого разговора: зависит от числа страниц и функций.</em>
            </div>
          </div>
        </section>
      )}

      {o.cases.length > 0 && (
        <section className="container">
          <h2 className="kp-h">Примеры работ</h2>
          <div className="kp-cases">
            {o.cases.map((c) => (
              <a key={c.url} href={c.url} target="_blank" rel="noopener" className="kp-case">
                <b>{c.title}</b>
                {c.label && <span>{c.label}</span>}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="container">
        <h2 className="kp-h">Как работаем</h2>
        <ol className="kp-steps">
          {STEPS.map(([t, d]) => (
            <li key={t}>
              <b>{t}</b>
              <span>{d}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="container kp-cta">
        <h2>Обсудим?</h2>
        <p>Отвечу на вопросы и назову точную цену. Ни к чему не обязывает.</p>
        <div className="kp-btns">
          {o.studio.telegram && (
            <a className="btn btn-primary btn-lg" href={o.studio.telegram} target="_blank" rel="noopener">
              Написать в Telegram
            </a>
          )}
          {o.studio.max && (
            <a className="btn btn-outline btn-lg" href={o.studio.max} target="_blank" rel="noopener">
              Написать в MAX
            </a>
          )}
          {o.studio.phone && (
            <a className="btn btn-outline btn-lg" href={`tel:${o.studio.phone.replace(/[^\d+]/g, '')}`}>
              {o.studio.phone}
            </a>
          )}
        </div>
        <p className="kp-note">Предложение подготовлено по открытым данным о компании (карты и справочники). Если оно вам неактуально — просто закройте страницу.</p>
      </section>
    </main>
  )
}

const CSS = `
.kp{padding-bottom:80px}
.kp-hero{padding:150px 0 40px}
.kp-hero h1{font-size:clamp(30px,5vw,54px);line-height:1.1;margin:14px 0 16px}
.kp-lead{font-size:clamp(17px,2vw,21px);max-width:760px;opacity:.85}
.kp-tag{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.65}
.kp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;margin-bottom:18px}
.kp-card,.kp-offer,.kp-case,.kp-steps li{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);border-radius:20px}
.kp-card{padding:26px}
.kp-card--warn{border-color:rgba(255,80,140,.35);background:linear-gradient(135deg,rgba(255,0,128,.08),rgba(120,40,255,.06))}
.kp h2{font-size:22px;margin:0 0 12px}
.kp ul{margin:0;padding:0;list-style:none;display:grid;gap:9px;line-height:1.5}.kp ul li{position:relative;padding-left:26px}.kp ul li::before{content:'✓';position:absolute;left:0;top:0;font-weight:800;color:#ff3d9a}
.kp-offer{display:grid;grid-template-columns:1.6fr 1fr;gap:28px;padding:30px;margin-bottom:46px}
.kp-offer h2{font-size:28px;margin:8px 0 14px}
.kp-links{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:18px}
.kp-links a{font-weight:700}
.kp-price{display:flex;flex-direction:column;justify-content:center;gap:6px;padding:22px;border-radius:16px;background:linear-gradient(135deg,rgba(255,0,128,.18),rgba(0,200,255,.12))}
.kp-price small{opacity:.7;text-transform:uppercase;letter-spacing:.06em;font-size:12px}
.kp-price b{font-size:clamp(28px,4vw,40px);line-height:1.1}
.kp-price em{font-style:normal;font-size:13px;opacity:.7;margin-top:6px;line-height:1.45}
.kp-h{font-size:26px!important;margin:0 0 16px!important}
.kp-cases{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:46px}
.kp-case{display:grid;gap:4px;padding:20px;color:inherit;text-decoration:none;transition:border-color .2s}
.kp-case:hover{border-color:rgba(255,80,140,.6)}
.kp-case span{font-size:13px;opacity:.65}
.kp-steps{list-style:none;padding:0;margin:0 0 46px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;counter-reset:s}
.kp-steps li{padding:20px;display:grid;gap:6px;counter-increment:s}
.kp-steps li::before{content:counter(s);font-weight:800;font-size:28px;background:linear-gradient(90deg,#ff0080,#7928ca,#00c8ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.kp-steps span{opacity:.75;line-height:1.5;font-size:15px}
.kp-cta{text-align:center;padding:40px 24px;border-radius:24px;background:linear-gradient(135deg,rgba(255,0,128,.12),rgba(0,200,255,.08))}
.kp-cta h2{font-size:32px}
.kp-btns{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:22px 0 12px}
.kp-note{font-size:13px;opacity:.55;max-width:620px;margin:16px auto 0}
@media(max-width:760px){.kp-offer{grid-template-columns:1fr}.kp-hero{padding-top:120px}}
@media print{.kp-hero{padding-top:20px}header,footer,.cookie,.chat-widget{display:none!important}}
`
