'use client'
import { useDocumentInfo, useRowLabel } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const ST: Record<string, [string, string]> = {
  draft: ['Черновик', '#8a8a8a'],
  sent: ['Отправлен', '#f5a524'],
  signed: ['Подписан', '#17c964'],
  done: ['Исполнен', '#7828c8'],
  cancelled: ['Отменён', '#f31260'],
}

/** Кнопки в карточке договора: Word, страница-документ, ссылка клиенту, пересборка из шаблона */
export function ContractActions() {
  const { id, data, initialData } = useDocumentInfo() as any
  const router = useRouter()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const token = data?.token || initialData?.token
  if (!id) return <p className="gb-q__muted">Сохраните договор — появятся кнопки «Скачать Word» и «Открыть документ». Удобнее начинать с кнопки «Составить договор» в списке.</p>
  const url = token ? `${window.location.origin}/dogovor/${token}/` : ''

  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {})
    setMsg('Ссылка скопирована: клиент увидит договор и сможет скачать Word')
  }
  const regen = async () => {
    if (!confirm('Пересобрать текст из шаблона по текущим условиям? Ручные правки в разделах и техзадании заменятся.')) return
    setBusy(true)
    const r = await fetch(`/api/contracts/${id}/regenerate`, { method: 'POST', credentials: 'include' })
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return setMsg(j?.error || `Ошибка ${r.status}`)
    setMsg('Текст пересобран из шаблона')
    router.refresh()
    setTimeout(() => window.location.reload(), 400)
  }

  return (
    <div className="gb-cact">
      <a className="gb-btn gb-btn--accent" href={`/api/contracts/${id}/docx/`} download>
        ⬇ Скачать Word
      </a>
      {token && (
        <a className="gb-btn" href={`/dogovor/${token}/`} target="_blank" rel="noopener">
          📄 Открыть документ
        </a>
      )}
      {token && (
        <button type="button" className="gb-btn" onClick={copy}>
          🔗 Ссылка для клиента
        </button>
      )}
      <button type="button" className="gb-btn" disabled={busy} onClick={regen}>
        ↻ Пересобрать из шаблона
      </button>
      <span className="gb-q__muted">{msg || 'Сначала сохраните правки — Word и страница собираются из сохранённой версии.'}</span>
    </div>
  )
}

export function ContractCell({ rowData }: { rowData?: any }) {
  if (!rowData?.id) return null
  return (
    <span className="gb-ccell" onClick={(e) => e.stopPropagation()}>
      <a href={`/api/contracts/${rowData.id}/docx/`} download title="Скачать Word">
        Word
      </a>
      {rowData.token && (
        <a href={`/dogovor/${rowData.token}/`} target="_blank" rel="noopener" title="Открыть как документ">
          Документ
        </a>
      )}
    </span>
  )
}

export function StatusCell({ cellData }: { cellData?: string }) {
  const [l, c] = ST[cellData || 'draft'] || ST.draft
  return (
    <span className="gb-cst" style={{ color: c, borderColor: c }}>
      {l}
    </span>
  )
}

export function SectionLabel() {
  const { data, rowNumber } = useRowLabel<{ title?: string }>()
  return <span>{`${(rowNumber ?? 0) + 1}. ${data?.title || 'Раздел'}`}</span>
}
