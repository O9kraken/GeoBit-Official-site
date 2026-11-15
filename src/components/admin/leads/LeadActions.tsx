'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const intlPhone = (p?: string) => {
  const d = (p || '').replace(/\D/g, '').replace(/^8(?=\d{10}$)/, '7')
  return d.length === 10 ? '7' + d : d
}

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `${m} мин`
  const h = Math.round(m / 60)
  return h < 48 ? `${h} ч` : `${Math.round(h / 24)} дн`
}

/** Быстрые действия в строке заявки: связаться и сменить статус без открытия карточки */
export function LeadActions({ rowData }: { rowData?: any }) {
  const router = useRouter()
  const [busy, setBusy] = useState('')
  if (!rowData?.id) return null
  const phone = intlPhone(rowData.phone)
  const st = rowData.status || 'new'

  const go = async (to: string, ask?: string) => {
    if (ask && !window.confirm(ask)) return
    setBusy(to)
    try {
      const r = await fetch(`/api/leads/${rowData.id}/status?to=${to}`, { method: 'POST', credentials: 'include' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || `Ошибка ${r.status}`)
      router.refresh()
    } catch (e: any) {
      window.alert(`Не получилось: ${e?.message || e}`)
    } finally {
      setBusy('')
    }
  }
  const wait = st === 'new' && rowData.createdAt ? ago(rowData.createdAt) : ''
  const late = st === 'new' && rowData.createdAt && Date.now() - new Date(rowData.createdAt).getTime() > 3600_000

  return (
    <div className="gb-act gb-act--lead" onClick={(e) => e.stopPropagation()}>
      {wait && <span className={`gb-lead-wait${late ? ' is-late' : ''}`} title="Сколько заявка ждёт ответа">⏱ {wait}</span>}
      {phone && (
        <>
          <a className="gb-act__b gb-act__b--icon" href={`tel:+${phone}`} title={`Позвонить +${phone}`}>📞</a>
          <a className="gb-act__b gb-act__b--icon" href={`https://t.me/+${phone}`} target="_blank" rel="noopener" title="Открыть в Telegram">✈️</a>
          <a className="gb-act__b gb-act__b--icon" href={`https://wa.me/${phone}`} target="_blank" rel="noopener" title="Открыть в WhatsApp">💬</a>
        </>
      )}
      {rowData.email && <a className="gb-act__b gb-act__b--icon" href={`mailto:${rowData.email}`} title={`Написать на ${rowData.email}`}>✉️</a>}
      {st === 'new' && (
        <button type="button" className="gb-act__b gb-act__b--go" disabled={!!busy} onClick={() => go('progress')}>
          {busy === 'progress' ? '…' : 'В работу'}
        </button>
      )}
      {st === 'progress' && (
        <>
          <button type="button" className="gb-act__b gb-act__b--go" disabled={!!busy} onClick={() => go('won')} title="Закрыта: договор">
            {busy === 'won' ? '…' : 'Договор'}
          </button>
          <button type="button" className="gb-act__b gb-act__b--muted" disabled={!!busy} onClick={() => go('lost')} title="Закрыта: отказ">
            {busy === 'lost' ? '…' : 'Отказ'}
          </button>
        </>
      )}
      {(st === 'won' || st === 'lost' || st === 'spam') && (
        <button type="button" className="gb-act__b gb-act__b--muted" disabled={!!busy} onClick={() => go('progress')} title="Вернуть в работу">
          ↺
        </button>
      )}
      {st !== 'spam' && st !== 'won' && (
        <button type="button" className="gb-act__b gb-act__b--icon gb-act__b--muted" disabled={!!busy} onClick={() => go('spam', 'Пометить заявку как спам?')} title="Спам">
          🚫
        </button>
      )}
    </div>
  )
}
