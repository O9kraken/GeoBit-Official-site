'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type OfferRes = {
  message: string
  subject: string
  kpUrl?: string
  viewedAt?: string | null
  links: { whatsapp?: string; telegram?: string; vk?: string; instagram?: string; email?: string; phone?: string }
}

async function getOffer(id: string | number): Promise<OfferRes> {
  const r = await fetch(`/api/prospects/${id}/offer`, { method: 'POST', credentials: 'include' })
  const j = await r.json()
  if (!r.ok) throw new Error(j?.error || `Ошибка ${r.status}`)
  return j
}

/** Окно «Написать»: готовый текст, кнопки мессенджеров, ссылка на КП и отметка «написал» */
function WritePanel({ id, onClose, inline }: { id: string | number; onClose?: () => void; inline?: boolean }) {
  const router = useRouter()
  const [o, setO] = useState<OfferRes | null>(null)
  const [err, setErr] = useState('')
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getOffer(id)
      .then((r) => {
        setO(r)
        setText(r.message)
      })
      .catch((e) => setErr(e.message))
  }, [id])

  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  const mark = async () => {
    await fetch(`/api/prospects/${id}/contacted`, { method: 'POST', credentials: 'include' })
    setDone(true)
    router.refresh()
  }
  // в мессенджерах, где нельзя подставить текст, сначала копируем его
  const openWithCopy = async (url: string) => {
    await copy()
    window.open(url, '_blank', 'noopener')
  }
  const enc = encodeURIComponent

  return (
    <div className={`gb-write${inline ? ' gb-write--inline' : ''}`} onClick={(e) => e.stopPropagation()}>
      {!inline && (
        <button type="button" className="gb-write__x" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      )}
      {err && <p className="gb-write__err">{err}</p>}
      {!o && !err && <p>Готовлю текст и КП…</p>}
      {o && (
        <>
          <div className="gb-write__head">
            <b>Первое сообщение</b>
            {o.kpUrl && (
              <a href={o.kpUrl} target="_blank" rel="noopener">
                Открыть КП ↗
              </a>
            )}
            {o.viewedAt && <span className="gb-write__seen">👁 клиент открыл КП {new Date(o.viewedAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} />
          <div className="gb-write__btns">
            {o.links.whatsapp && (
              <a className="gb-act__b gb-act__b--go" href={`${o.links.whatsapp.split('?')[0]}?text=${enc(text)}`} target="_blank" rel="noopener">
                WhatsApp
              </a>
            )}
            {o.links.telegram && (
              <button type="button" className="gb-act__b" onClick={() => openWithCopy(o.links.telegram!)}>
                Telegram
              </button>
            )}
            {o.links.vk && (
              <button type="button" className="gb-act__b" onClick={() => openWithCopy(o.links.vk!)}>
                VK
              </button>
            )}
            {o.links.instagram && (
              <button type="button" className="gb-act__b" onClick={() => openWithCopy(o.links.instagram!)}>
                Instagram
              </button>
            )}
            {o.links.email && (
              <a className="gb-act__b" href={`${o.links.email.split('&body=')[0]}&body=${enc(text)}`}>
                Почта
              </a>
            )}
            {o.links.phone && (
              <a className="gb-act__b" href={o.links.phone}>
                Позвонить
              </a>
            )}
            <button type="button" className="gb-act__b" onClick={copy}>
              {copied ? 'Скопировано ✓' : 'Скопировать'}
            </button>
          </div>
          <div className="gb-write__foot">
            <span>Telegram, VK и Instagram не дают подставить текст — он копируется, вставьте его в чат.</span>
            <button type="button" className="gb-act__b gb-act__b--muted" disabled={done} onClick={mark}>
              {done ? 'Отмечено ✓' : 'Я написал — отметить'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** Кнопки в строке списка; «Написать» открывает окно поверх страницы (таблица его не обрезает) */
export function ActionsCell({ rowData }: { rowData?: any }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open])
  if (!rowData?.id) return null
  const skip = rowData.status === 'skip'
  return (
    <div className="gb-act gb-act--pr" onClick={(e) => e.stopPropagation()}>
      {rowData.kpToken && (
        <a className="gb-act__b" href={`/kp/${rowData.kpToken}/`} target="_blank" rel="noopener" title="Предварительное КП — эту ссылку получает клиент">
          КП{rowData.kpViewedAt ? ' 👁' : ''}
        </a>
      )}
      <button type="button" className={`gb-act__b${skip ? '' : ' gb-act__b--go'}`} onClick={() => setOpen(true)}>
        Написать
      </button>
      {open &&
        createPortal(
          <div className="gb-write-bg" onMouseDown={() => setOpen(false)}>
            <div onMouseDown={(e) => e.stopPropagation()}>
              <div className="gb-write-title">{rowData.name}</div>
              <WritePanel id={rowData.id} onClose={() => setOpen(false)} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

/** Блок в карточке компании */
export function ActionsField() {
  const { id } = useDocumentInfo()
  if (!id) return null
  return (
    <div className="gb-write-field">
      <WritePanel id={id} inline />
    </div>
  )
}
