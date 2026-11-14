import type { Payload } from 'payload'
import { fmtMsk, getSchedule, weekdayMsk } from './data'
import { Chips } from './Chips'

const BASE = '/admin/collections/posts'

/** Над таблицей блога: счётчики-фильтры, ближайшая публикация и частые действия */
export async function PostsToolbar({ payload }: { payload: Payload }) {
  const schedule = await getSchedule(payload)
  const [all, live] = await Promise.all([
    payload.count({ collection: 'posts', overrideAccess: true }),
    payload.count({ collection: 'posts', where: { _status: { equals: 'published' } }, overrideAccess: true }),
  ])
  const planned = [...schedule.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  const plannedIds = planned.map(([id]) => id)
  const draftDocs = await payload.find({ collection: 'posts', where: { _status: { equals: 'draft' } }, limit: 1000, depth: 0, pagination: false, overrideAccess: true, select: { id: true } as any })
  const draftIds = draftDocs.docs.map((d: any) => String(d.id)).filter((id) => !schedule.has(id))
  const next = planned[0]
  const nextDoc = next ? await payload.findByID({ collection: 'posts', id: next[0], depth: 0, draft: true, overrideAccess: true, select: { title: true } as any }).catch(() => null) : null

  const chips = [
    { key: 'all', label: 'Все', n: all.totalDocs, href: BASE },
    { key: 'live', label: 'На сайте', n: live.totalDocs, href: `${BASE}?where[_status][equals]=published` },
    { key: 'plan', label: 'В расписании', n: plannedIds.length, href: plannedIds.length ? `${BASE}?where[id][in]=${plannedIds.join(',')}` : BASE },
    { key: 'draft', label: 'Черновики без даты', n: draftIds.length, href: `${BASE}?where[id][in]=${draftIds.join(',') || '0'}&draftsOnly=1` },
  ]

  return (
    <div className="gb-tb">
      <Chips items={chips} />
      <div className="gb-tb__side">
        {next && (
          <a className="gb-tb__next" href={`${BASE}/${next[0]}`} title={nextDoc?.title || ''}>
            <span>Ближайшая публикация</span>
            <b>
              {weekdayMsk(next[1])}, {fmtMsk(next[1])} МСК
            </b>
            {nextDoc?.title && <em>{nextDoc.title}</em>}
          </a>
        )}
        <div className="gb-tb__actions">
          <a className="gb-tb__btn gb-tb__btn--main" href={`${BASE}/create`}>
            + Новая статья
          </a>
          <a className="gb-tb__btn" href="/blog/" target="_blank" rel="noopener">
            Блог на сайте ↗
          </a>
          <a className="gb-tb__btn" href="/admin/collections/categories">
            Рубрики
          </a>
        </div>
      </div>
    </div>
  )
}
