import type { Payload } from 'payload'
import { fmtMsk, getSchedule, weekdayMsk } from './data'

/** Колонка «Выход»: опубликована / запланирована на … / без даты */
export async function ReleaseCell({ rowData, payload }: { rowData?: any; payload: Payload }) {
  if (!rowData) return null
  const status = rowData._displayStatus || rowData._status
  if (status === 'published' || status === 'changed') {
    return (
      <span className="gb-rel gb-rel--live">
        <i />
        <span>
          Опубликована
          {rowData.publishedAt && <small>{fmtMsk(rowData.publishedAt, false)}</small>}
          {status === 'changed' && <small className="gb-rel__warn">есть неопубликованные правки</small>}
        </span>
      </span>
    )
  }
  const at = (await getSchedule(payload)).get(String(rowData.id))
  if (at) {
    return (
      <span className="gb-rel gb-rel--soon">
        <i />
        <span>
          <span className="gb-rel__nw">Выйдет {fmtMsk(at, false).replace(/\s?\d{4}.*$/, '')}, {weekdayMsk(at)}</span>
          <small>в {new Date(at).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' })} МСК</small>
        </span>
      </span>
    )
  }
  return (
    <span className="gb-rel gb-rel--draft">
      <i />
      <span>
        Черновик
        <small>дата выхода не назначена</small>
      </span>
    </span>
  )
}
