'use client'
import { useFormFields } from '@payloadcms/ui'

const SITE: Record<string, [string, string]> = {
  unchecked: ['Не проверен', 'gray'],
  none: ['Нет сайта', 'hot'],
  social: ['Только соцсети', 'hot'],
  down: ['Не открывается', 'hot'],
  old: ['Устаревший', 'warm'],
  weak: ['Слабый', 'mild'],
  ok: ['Нормальный', 'cold'],
}

const WORK: Record<string, [string, string]> = {
  new: ['Новый', 'new'],
  contacted: ['Связались', 'progress'],
  interested: ['Интересно', 'progress'],
  offer: ['КП отправлено', 'progress'],
  client: ['Клиент', 'won'],
  rejected: ['Отказ', 'lost'],
  skip: ['Не подходит', 'lost'],
}

const tel = (p?: string) => (p ? `tel:${p.replace(/[^\d+]/g, '')}` : undefined)
const host = (u?: string) => {
  try {
    return u ? new URL(u).hostname.replace(/^www\./, '') : ''
  } catch {
    return u || ''
  }
}

export function SiteCell({ cellData, rowData }: { cellData?: string; rowData?: any }) {
  const [label, mod] = SITE[cellData || 'unchecked'] || SITE.unchecked
  return (
    <span className={`gb-pr-site gb-pr-site--${mod}`} title={rowData?.siteNotes || ''}>
      <b>{label}</b>
      {rowData?.siteNotes && cellData !== 'none' && <small>{rowData.siteNotes}</small>}
    </span>
  )
}

export function ScoreCell({ cellData }: { cellData?: number }) {
  if (cellData == null || cellData < 0) return <span className="gb-pr-score gb-pr-score--na">—</span>
  const mod = cellData >= 80 ? 'hot' : cellData >= 55 ? 'warm' : cellData >= 35 ? 'mild' : 'cold'
  return (
    <span className={`gb-pr-score gb-pr-score--${mod}`}>
      <i style={{ width: `${cellData}%` }} />
      <b>{cellData}</b>
    </span>
  )
}

export function WorkCell({ cellData }: { cellData?: string }) {
  const [label, mod] = WORK[cellData || 'new'] || WORK.new
  return <span className={`gb-dash__st gb-dash__st--${mod}`}>{label}</span>
}

function Links({ phone, website, email, socials, compact }: { phone?: string; website?: string; email?: string; socials?: string; compact?: boolean }) {
  const soc = (socials || '').split(/\s+/).filter(Boolean)
  return (
    <span className={`gb-pr-links${compact ? ' gb-pr-links--c' : ''}`} onClick={(e) => e.stopPropagation()}>
      {phone && <a href={tel(phone)}>📞 {phone}</a>}
      {website && (
        <a href={website} target="_blank" rel="noopener noreferrer">
          🌐 {host(website)}
        </a>
      )}
      {email && <a href={`mailto:${email}`}>✉ {email}</a>}
      {soc.slice(0, compact ? 2 : 6).map((s) => (
        <a key={s} href={s.startsWith('http') ? s : `https://${s}`} target="_blank" rel="noopener noreferrer">
          {/t\.me|telegram/.test(s) ? '✈ TG' : /vk\.(com|ru)/.test(s) ? 'VK' : /instagram/.test(s) ? 'IG' : /wa\.me|whatsapp/.test(s) ? 'WA' : host(s)}
        </a>
      ))}
      {!phone && !website && !email && !soc.length && <em>контактов нет</em>}
    </span>
  )
}

export function ContactsCell({ rowData }: { rowData?: any }) {
  if (!rowData) return null
  return <Links {...rowData} compact />
}

/** В карточке компании: быстрые ссылки позвонить / написать / открыть сайт и карту */
export function ContactsField() {
  const f = useFormFields(([fields]) => fields)
  const v = (k: string) => (f?.[k]?.value as string) || undefined
  const lat = f?.lat?.value as number | undefined
  const lon = f?.lon?.value as number | undefined
  const name = v('name') || ''
  const address = v('address') || ''
  const sourceKey = v('sourceKey') || ''
  // Открываем карточку организации, а не голую метку: поиск по названию и адресу рядом с точкой
  const q = encodeURIComponent([name, address].filter(Boolean).join(', '))
  const ll = lat && lon ? `${lon},${lat}` : ''
  const yandexUrl = `https://yandex.ru/maps/?mode=search&text=${q}${ll ? `&ll=${ll}&sll=${ll}&z=17` : ''}`
  const gisId = sourceKey.startsWith('2gis:') ? sourceKey.slice(5) : ''
  const gisUrl = gisId
    ? `https://2gis.ru/firm/${gisId}`
    : `https://2gis.ru/search/${encodeURIComponent(name || address)}${ll ? `?m=${ll}%2F17` : ''}`
  return (
    <div className="gb-pr-card">
      <Links phone={v('phone')} website={v('website')} email={v('email')} socials={v('socials')} />
      {(name || (lat && lon)) && (
        <span className="gb-pr-links">
          <a href={yandexUrl} target="_blank" rel="noopener noreferrer">
            📍 На Яндекс Картах
          </a>
          <a href={gisUrl} target="_blank" rel="noopener noreferrer">
            📍 В 2ГИС
          </a>
        </span>
      )}
    </div>
  )
}

/** Потенциал: стоит ли тратить время на компанию */
export function PotentialCell({ cellData, rowData }: { cellData?: number; rowData?: any }) {
  if (cellData == null || cellData < 0) return <span className="gb-pot gb-pot--na">считается…</span>
  const [label, mod] = cellData >= 70 ? ['Звонить первым', 'hot'] : cellData >= 50 ? ['Можно попробовать', 'maybe'] : ['Не тратить время', 'cold']
  return (
    <span className={`gb-pot gb-pot--${mod}`} title={rowData?.potentialWhy || ''}>
      <span className="gb-pot__top">
        <b>{cellData}</b> {label}
      </span>
      {rowData?.potentialWhy && <small>{rowData.potentialWhy}</small>}
    </span>
  )
}
