import type { Payload } from 'payload'

const ADMIN = '/admin'
const fmt = (d: string) => new Date(d).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** «Сегодня»: кому перезвонить, кто открыл КП, какие заявки ждут ответа */
export async function DashToday({ payload }: { payload: Payload }) {
  const now = new Date()
  const endOfDay = new Date(now.getTime() + 24 * 3600_000).toISOString()
  const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString()
  const [calls, opened, waiting] = await Promise.all([
    payload.find({ collection: 'prospects', where: { and: [{ nextAt: { less_than_equal: endOfDay } }, { status: { in: ['contacted', 'interested', 'offer'] } }] }, sort: 'nextAt', limit: 8, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'prospects', where: { and: [{ kpViewedAt: { greater_than: weekAgo } }, { status: { not_in: ['client', 'rejected', 'skip'] } }] }, sort: '-kpViewedAt', limit: 8, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'leads', where: { status: { equals: 'new' } }, sort: 'createdAt', limit: 8, depth: 0, overrideAccess: true }),
  ])
  const col = (title: string, hint: string, items: { href: string; name: string; meta: string; late?: boolean }[], empty: string, more?: string) => (
    <div className="gb-today__col">
      <h4>
        {title} <b>{items.length}</b>
      </h4>
      <p className="gb-today__hint">{hint}</p>
      {items.length ? (
        <ul>
          {items.map((i) => (
            <li key={i.href}>
              <a href={i.href}>{i.name}</a>
              <span className={i.late ? 'is-late' : ''}>{i.meta}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="gb-today__empty">{empty}</p>
      )}
      {more && items.length > 0 && <a className="gb-today__more" href={more}>Все →</a>}
    </div>
  )
  return (
    <section className="gb-today">
      <h3 className="gb-dash__title">Сегодня</h3>
      <div className="gb-today__grid">
        {col(
          'Заявки ждут ответа',
          'Ответ в первый час заметно повышает шанс договора',
          (waiting.docs as any[]).map((l) => ({ href: `${ADMIN}/collections/leads/${l.id}`, name: l.name || `Заявка №${l.id}`, meta: fmt(l.createdAt), late: now.getTime() - new Date(l.createdAt).getTime() > 3600_000 })),
          'Все заявки разобраны 👍',
          `${ADMIN}/collections/leads?where[status][equals]=new`,
        )}
        {col(
          'Перезвонить',
          'Срок «следующего контакта» — сегодня или уже прошёл',
          (calls.docs as any[]).map((p) => ({ href: `${ADMIN}/collections/prospects/${p.id}`, name: p.name, meta: fmt(p.nextAt), late: new Date(p.nextAt) < now })),
          'На сегодня перезвонов нет',
          `${ADMIN}/collections/prospects?where[status][in]=contacted,interested,offer&sort=nextAt`,
        )}
        {col(
          'Открыли КП',
          'Посмотрели предложение за неделю — самое время позвонить',
          (opened.docs as any[]).map((p) => ({ href: `${ADMIN}/collections/prospects/${p.id}`, name: p.name, meta: `👁 ${fmt(p.kpViewedAt)}` })),
          'Пока никто не открывал',
          `${ADMIN}/collections/prospects?where[kpViewedAt][exists]=true&sort=-kpViewedAt`,
        )}
      </div>
    </section>
  )
}

/** Откуда заявки: страницы сайта и UTM за 90 дней, сколько из них дошло до договора */
export async function DashSources({ payload }: { payload: Payload }) {
  const since = new Date(Date.now() - 90 * 86400_000).toISOString()
  const r = await payload.find({
    collection: 'leads',
    where: { and: [{ createdAt: { greater_than: since } }, { status: { not_equals: 'spam' } }] },
    limit: 5000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { page: true, utm: true, status: true } as any,
  })
  const map = new Map<string, { n: number; won: number }>()
  for (const l of r.docs as any[]) {
    let key = 'не указано'
    if (l.utm) key = `UTM: ${(String(l.utm).match(/utm_source=([^&\s,;]+)/)?.[1] || String(l.utm).split(/[,&;\s]/)[0]).slice(0, 40)}`
    else if (l.page) {
      try {
        key = new URL(l.page, 'https://getgeobit.ru').pathname
      } catch {
        key = String(l.page).slice(0, 60)
      }
    }
    const v = map.get(key) || { n: 0, won: 0 }
    v.n++
    if (l.status === 'won') v.won++
    map.set(key, v)
  }
  const rows = [...map.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 10)
  const max = Math.max(1, ...rows.map((x) => x[1].n))
  return (
    <section className="gb-src">
      <h3 className="gb-dash__title">Откуда заявки · 90 дней</h3>
      {rows.length ? (
        <div className="gb-src__list">
          {rows.map(([k, v]) => (
            <div key={k} className="gb-src__row">
              <span className="gb-src__name">
                {k.startsWith('/') ? (
                  <a href={k} target="_blank" rel="noopener">
                    {k === '/' ? 'Главная' : k}
                  </a>
                ) : (
                  k
                )}
              </span>
              <span className="gb-src__bar">
                <i style={{ width: `${(v.n / max) * 100}%` }} />
              </span>
              <span className="gb-src__num">
                {v.n} {v.won ? <em>· {v.won} догов.</em> : null}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="gb-today__empty">За 90 дней заявок нет — статистика появится с первыми заявками.</p>
      )}
    </section>
  )
}
