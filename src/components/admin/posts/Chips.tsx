'use client'
import { useSearchParams } from 'next/navigation'

/** Чипы-фильтры: активный определяется по текущему адресу */
export function Chips({ items }: { items: { label: string; n: number; href: string; key: string }[] }) {
  const sp = useSearchParams()
  const q = decodeURIComponent(sp?.toString() || '')
  const active = q.includes('draftsOnly=1') ? 'draft' : q.includes('[id][in]') ? 'plan' : q.includes('[_status][equals]=published') ? 'live' : 'all'
  return (
    <div className="gb-tb__chips">
      {items.map((c) => (
        <a key={c.key} href={c.href} className={`gb-tb__chip${active === c.key ? ' is-on' : ''}`}>
          {c.label} <b>{c.n}</b>
        </a>
      ))}
    </div>
  )
}
