import type { Payload } from 'payload'

const BASE = '/admin/collections/leads'
const plural = (n: number, one: string, few: string, many: string) => {
  const a = n % 10, b = n % 100
  return `${n} ${a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many}`
}

/** Над списком заявок: статусы со счётчиками и конверсия за 30 дней */
export async function LeadsToolbar({ payload }: { payload: Payload }) {
  const c = (where: any) => payload.count({ collection: 'leads', where, overrideAccess: true }).then((r) => r.totalDocs)
  const since = new Date(Date.now() - 30 * 86400_000).toISOString()
  const [all, fresh, progress, won, lost, spam, m30, w30] = await Promise.all([
    c({}),
    c({ status: { equals: 'new' } }),
    c({ status: { equals: 'progress' } }),
    c({ status: { equals: 'won' } }),
    c({ status: { equals: 'lost' } }),
    c({ status: { equals: 'spam' } }),
    c({ and: [{ createdAt: { greater_than: since } }, { status: { not_equals: 'spam' } }] }),
    c({ and: [{ createdAt: { greater_than: since } }, { status: { equals: 'won' } }] }),
  ])
  const chips: [string, number, string, string][] = [
    ['Новые', fresh, `${BASE}?where[status][equals]=new`, fresh ? 'hot' : ''],
    ['В работе', progress, `${BASE}?where[status][equals]=progress`, ''],
    ['Договор', won, `${BASE}?where[status][equals]=won`, ''],
    ['Отказ', lost, `${BASE}?where[status][equals]=lost`, ''],
    ['Спам', spam, `${BASE}?where[status][equals]=spam`, ''],
    ['Все', all, BASE, ''],
  ]
  return (
    <div className="gb-tb">
      <div className="gb-tb__chips">
        {chips.map(([l, n, h, mod]) => (
          <a key={l} href={h} className={`gb-tb__chip${mod ? ' gb-tb__chip--hot' : ''}`}>
            {l} <b>{n}</b>
          </a>
        ))}
      </div>
      <div className="gb-tb__next gb-tb__next--stat">
        <span>За 30 дней</span>
        <b>
          {plural(m30, 'заявка', 'заявки', 'заявок')} · {plural(w30, 'договор', 'договора', 'договоров')}{m30 ? ` · ${Math.round((w30 / m30) * 100)}%` : ''}
        </b>
        <em>без спама</em>
      </div>
    </div>
  )
}
