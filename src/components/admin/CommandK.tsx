'use client'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Hit = { group: string; title: string; sub?: string; href: string }

/** Где искать: раздел, поля, подпись. Доступ проверяет сам API — лишнего по роли не покажет */
const SOURCES: { slug: string; group: string; fields: string[]; title: (d: any) => string; sub?: (d: any) => string; draft?: boolean }[] = [
  { slug: 'leads', group: 'Заявки', fields: ['name', 'phone', 'email'], title: (d) => d.name, sub: (d) => [d.service, d.phone].filter(Boolean).join(' · ') },
  { slug: 'prospects', group: 'Поиск клиентов', fields: ['name', 'phone', 'website'], title: (d) => d.name, sub: (d) => [d.niche, d.city].filter(Boolean).join(' · ') },
  { slug: 'posts', group: 'Блог', fields: ['title', 'slug'], title: (d) => d.title, sub: (d) => (d._status === 'published' ? 'опубликована' : 'черновик'), draft: true },
  { slug: 'services', group: 'Услуги', fields: ['title', 'slug'], title: (d) => d.title, sub: (d) => d.price },
  { slug: 'landings', group: 'Города и отрасли', fields: ['title', 'slug'], title: (d) => d.title, sub: (d) => `/sozdanie-sajtov/${d.slug}/` },
  { slug: 'projects', group: 'Портфолио', fields: ['title', 'slug'], title: (d) => d.title },
  { slug: 'pages', group: 'Документы', fields: ['title', 'slug'], title: (d) => d.title },
  { slug: 'users', group: 'Пользователи', fields: ['name', 'email'], title: (d) => d.name || d.email, sub: (d) => d.email },
]

/** Разделы админки — чтобы прыгать по меню с клавиатуры */
const PLACES: [string, string][] = [
  ['Панель', '/admin'],
  ['Заявки', '/admin/collections/leads'],
  ['Поиск клиентов', '/admin/collections/prospects'],
  ['Блог — новая статья', '/admin/collections/posts/create'],
  ['Блог', '/admin/collections/posts'],
  ['Услуги', '/admin/collections/services'],
  ['Города и отрасли', '/admin/collections/landings'],
  ['Портфолио', '/admin/collections/projects'],
  ['Отзывы', '/admin/collections/testimonials'],
  ['Медиафайлы', '/admin/collections/media'],
  ['Главная страница', '/admin/globals/home'],
  ['Настройки сайта', '/admin/globals/settings'],
  ['SEO и ИИ-поиск', '/admin/globals/seo-settings'],
  ['Калькулятор', '/admin/globals/calculator'],
  ['Меню сайта', '/admin/globals/navigation'],
  ['Пользователи и роли', '/admin/collections/users'],
  ['История изменений', '/admin/collections/audit-log'],
  ['SEO-аудит', '/admin/seo'],
  ['Мой профиль', '/admin/account'],
]

export function CommandK() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const [i, setI] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'л' || e.code === 'KeyK')) {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 30)
    else {
      setQ('')
      setHits([])
    }
  }, [open])

  useEffect(() => {
    const term = q.trim()
    const places: Hit[] = PLACES.filter(([t]) => !term || t.toLowerCase().includes(term.toLowerCase()))
      .slice(0, term ? 6 : 8)
      .map(([t, href]) => ({ group: 'Разделы', title: t, href }))
    if (term.length < 2) {
      setHits(places)
      setI(0)
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      const res = await Promise.all(
        SOURCES.map(async (s) => {
          const p = new URLSearchParams({ limit: '5', depth: '0' })
          s.fields.forEach((f, n) => p.set(`where[or][${n}][${f}][like]`, term))
          if (s.draft) p.set('draft', 'true')
          try {
            const r = await fetch(`/api/${s.slug}?${p}`, { credentials: 'include', signal: ctrl.signal })
            if (!r.ok) return []
            const j = await r.json()
            return (j.docs || []).map((d: any) => ({ group: s.group, title: s.title(d) || `#${d.id}`, sub: s.sub?.(d), href: `/admin/collections/${s.slug}/${d.id}` }))
          } catch {
            return []
          }
        }),
      )
      if (!ctrl.signal.aborted) {
        setHits([...places, ...res.flat()])
        setI(0)
        setLoading(false)
      }
    }, 220)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [q])

  const go = useCallback(
    (h?: Hit) => {
      if (!h) return
      setOpen(false)
      router.push(h.href)
    },
    [router],
  )

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setI((v) => Math.min(v + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setI((v) => Math.max(v - 1, 0))
    } else if (e.key === 'Enter') go(hits[i])
  }

  let lastGroup = ''
  return (
    <>
      <button type="button" className="gb-cmdk-btn" onClick={() => setOpen(true)} title="Поиск по админке (Ctrl+K)">
        <span>🔎 Поиск</span>
        <kbd>Ctrl K</kbd>
      </button>
      {open &&
        createPortal(
          <div className="gb-cmdk" onMouseDown={() => setOpen(false)}>
            <div className="gb-cmdk__box" onMouseDown={(e) => e.stopPropagation()}>
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Заявка, клиент, статья, услуга, раздел…" />
              <div className="gb-cmdk__list">
                {hits.map((h, n) => {
                  const head = h.group !== lastGroup ? (lastGroup = h.group) : null
                  return (
                    <div key={h.href + n}>
                      {head && <div className="gb-cmdk__group">{head}</div>}
                      <button type="button" className={`gb-cmdk__item${n === i ? ' is-on' : ''}`} onMouseEnter={() => setI(n)} onClick={() => go(h)}>
                        <b>{h.title}</b>
                        {h.sub && <span>{h.sub}</span>}
                      </button>
                    </div>
                  )
                })}
                {!hits.length && !loading && <p className="gb-cmdk__empty">Ничего не нашлось</p>}
                {loading && <p className="gb-cmdk__empty">Ищу…</p>}
              </div>
              <div className="gb-cmdk__foot">↑↓ выбрать · Enter открыть · Esc закрыть</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
