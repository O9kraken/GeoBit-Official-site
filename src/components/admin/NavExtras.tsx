import type { Payload } from 'payload'

/** Верх боковой панели: переход на сайт и счётчик новых заявок */
export async function NavExtras({ payload }: { payload?: Payload }) {
  let fresh = 0
  try {
    if (payload) fresh = (await payload.count({ collection: 'leads', where: { status: { equals: 'new' } }, overrideAccess: true })).totalDocs
  } catch {}
  return (
    <div className="gb-nav-extras">
      <a href="/admin" className="gb-nav-extras__home">
        <span aria-hidden>⌂</span> Панель
      </a>
      <a href="/admin/collections/leads?where[status][equals]=new" className={`gb-nav-extras__leads ${fresh ? 'is-hot' : ''}`}>
        <span aria-hidden>✉</span> Новые заявки
        <b>{fresh}</b>
      </a>
      <a href="/admin/seo" className="gb-nav-extras__home">
        <span aria-hidden>◎</span> SEO-аудит
      </a>
      <a href="/" target="_blank" rel="noopener" className="gb-nav-extras__site">
        <span aria-hidden>↗</span> Открыть сайт
      </a>
    </div>
  )
}
