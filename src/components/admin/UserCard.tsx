import type { Payload } from 'payload'

/** Колонка «Пользователь»: круглый аватар, имя и почта — без названия файла картинки */
export async function UserCardCell({ rowData, payload }: { rowData?: any; payload: Payload }) {
  if (!rowData) return null
  let av = rowData.avatar
  if (av && typeof av !== 'object') av = await payload.findByID({ collection: 'media', id: av, depth: 0, overrideAccess: true }).catch(() => null)
  const src = av ? av.sizes?.thumbnail?.url || av.sizes?.small?.url || av.url : null
  const name = rowData.name || rowData.email
  const initials = String(name || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('')
  return (
    <a className="gb-user" href={`/admin/collections/users/${rowData.id}`}>
      {src ? <img src={src} alt="" width={40} height={40} loading="lazy" /> : <span className="gb-user__ini">{initials}</span>}
      <span>
        <b>{name}</b>
        {rowData.name && <small>{rowData.email}</small>}
      </span>
    </a>
  )
}

/** Если колонку «Аватар» включат отдельно — только круглая картинка */
export async function AvatarCell({ cellData, payload }: { cellData?: any; payload: Payload }) {
  let av = cellData
  if (av && typeof av !== 'object') av = await payload.findByID({ collection: 'media', id: av, depth: 0, overrideAccess: true }).catch(() => null)
  const src = av ? av.sizes?.thumbnail?.url || av.url : null
  return src ? <img className="gb-user__av" src={src} alt="" width={40} height={40} loading="lazy" /> : <span className="gb-user__ini">—</span>
}
