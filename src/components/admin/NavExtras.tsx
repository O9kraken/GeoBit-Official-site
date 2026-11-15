import type { Payload } from 'payload'
import { can, ROLE_LABEL, roleOf } from '@/access/roles'
import { CommandK } from './CommandK'

/** Верх боковой панели: панель, новые заявки, SEO-аудит, сайт и личное оформление */
export async function NavExtras({ payload, user }: { payload?: Payload; user?: any }) {
  const sales = can(user, 'admin', 'manager')
  const content = can(user, 'admin', 'editor')
  let fresh = 0
  try {
    if (payload && sales) fresh = (await payload.count({ collection: 'leads', where: { status: { equals: 'new' } }, overrideAccess: true })).totalDocs
  } catch {}
  const ic = (name: string) => <i aria-hidden style={{ ['--gbi' as any]: `var(--gbi-${name})` }} />
  return (
    <div className="gb-nav-extras">
      {user && roleOf(user) !== 'admin' && <span className="gb-nav-extras__role">Роль: {ROLE_LABEL[roleOf(user)!]}</span>}
      <CommandK />
      <a href="/admin" className="gb-nav-extras__home">
        {ic('grid')} Панель
      </a>
      {sales && (
        <a href="/admin/collections/leads?where[status][equals]=new" className={`gb-nav-extras__leads ${fresh ? 'is-hot' : ''}`}>
          {ic('inbox')} Новые заявки
          <b>{fresh}</b>
        </a>
      )}
      {content && (
        <a href="/admin/seo">
          {ic('search')} SEO-аудит
        </a>
      )}
      <div className="gb-nav-extras__row">
        <a href="/" target="_blank" rel="noopener" title="Открыть сайт в новой вкладке">
          {ic('globe')} Сайт
        </a>
        <a href="/admin/account" title="Цвет, плотность и размер меню">
          {ic('palette')} Вид
        </a>
      </div>
    </div>
  )
}
