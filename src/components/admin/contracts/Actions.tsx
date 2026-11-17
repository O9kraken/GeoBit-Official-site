'use client'
import { useDocumentInfo, useFormFields, useRowLabel } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const ST: Record<string, [string, string]> = {
  draft: ['Черновик', '#8a8a8a'],
  sent: ['Отправлен', '#f5a524'],
  signed: ['Подписан', '#17c964'],
  done: ['Исполнен', '#7828c8'],
  cancelled: ['Отменён', '#f31260'],
}

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

/** Акт сдачи-приёмки: номер, дата, сумма, для SEO — период. Собирается в Word из договора */
function ActPanel({ id }: { id: string | number }) {
  const kind = useFormFields(([f]) => f.kind?.value as string) || 'dev'
  const number = useFormFields(([f]) => f.number?.value as string) || ''
  const price = useFormFields(([f]) => f['terms.price']?.value as number) || 0
  const today = new Date()
  const [n, setN] = useState(`${number || id}/1`)
  const [date, setDate] = useState(iso(today))
  const [amount, setAmount] = useState(String(price || ''))
  const [from, setFrom] = useState(iso(new Date(today.getTime() - 30 * 86400000)))
  const [to, setTo] = useState(iso(today))
  const [name, setName] = useState('')
  const q = new URLSearchParams({ n, date, amount, ...(kind === 'seo' ? { from, to } : {}), ...(name.trim() ? { name: name.trim() } : {}) })
  return (
    <div className="gb-actp">
      <div className="gb-q__grid">
        <label className="gb-q__f">
          <span>Номер акта</span>
          <input value={n} onChange={(e) => setN(e.target.value)} />
        </label>
        <label className="gb-q__f">
          <span>Дата акта</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="gb-q__f">
          <span>Сумма, ₽</span>
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <small>{kind === 'seo' ? 'За месяц' : 'Обычно вся стоимость договора; для акта по этапу — сумма этапа'}</small>
        </label>
        {kind === 'seo' && (
          <>
            <label className="gb-q__f">
              <span>Период с</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="gb-q__f">
              <span>по</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </>
        )}
      </div>
      <label className="gb-q__f">
        <span>Наименование работ</span>
        <input value={name} placeholder={kind === 'seo' ? 'Услуги по поисковому продвижению сайта … за период …' : 'Работы по договору: разработка сайта (тариф …)'} onChange={(e) => setName(e.target.value)} />
        <small>Можно оставить пустым — подставится из договора. Для акта по этапу впишите, например: «Разработка дизайн-макета»</small>
      </label>
      <a className="gb-btn gb-btn--accent" href={`/api/contracts/${id}/act/?${q}`} download>
        ⬇ Скачать акт (Word)
      </a>
    </div>
  )
}

/** Кнопки в карточке договора: Word, страница-документ, ссылка клиенту, пересборка из шаблона, акт */
export function ContractActions() {
  const { id, data, initialData } = useDocumentInfo() as any
  const router = useRouter()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [act, setAct] = useState(false)
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
      <button type="button" className={`gb-btn${act ? ' is-on' : ''}`} onClick={() => setAct(!act)}>
        🧾 Акт выполненных работ
      </button>
      <button type="button" className="gb-btn" disabled={busy} onClick={regen}>
        ↻ Пересобрать из шаблона
      </button>
      <span className="gb-q__muted">{msg || 'Сначала сохраните правки — Word и страница собираются из сохранённой версии.'}</span>
      {act && <ActPanel id={id} />}
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
