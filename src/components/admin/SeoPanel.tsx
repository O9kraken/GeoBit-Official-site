'use client'

import { useAllFormFields, useDocumentInfo, useField } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { analyze, scoreColor, suggestDescription, type Check, type Group, type Kind } from '@/lib/seo-analysis'

const DOMAIN = 'getgeobit.ru'

const KIND: Record<string, Kind> = {
  posts: 'post', services: 'service', projects: 'project', pages: 'page',
  categories: 'term', tags: 'term', 'service-categories': 'term', 'portfolio-categories': 'term',
}
const PATH: Record<string, (s: string) => string> = {
  posts: (s) => `/${s}/`, pages: (s) => `/${s}/`, services: (s) => `/services/${s}/`, projects: (s) => `/project/${s}/`,
  categories: (s) => `/category/${s}/`, tags: (s) => `/tag/${s}/`, 'service-categories': (s) => `/service-category/${s}/`,
  'portfolio-categories': (s) => `/portfolio-category/${s}/`,
}
const GLOBAL_PATH: Record<string, string> = {
  home: '/', 'services-page': '/services/', 'about-page': '/about/', 'contacts-page': '/contacts/',
  'portfolio-page': '/portfolio/', 'blog-page': '/blog/', 'faq-page': '/faq/',
}
const GROUPS: { id: Group; label: string; hint: string }[] = [
  { id: 'seo', label: 'SEO', hint: 'Найдут ли страницу в Яндексе и Google по нужному запросу' },
  { id: 'read', label: 'Читаемость', hint: 'Удобно ли читать текст человеку — от этого зависят отказы и позиции' },
  { id: 'ai', label: 'ИИ-поиск', hint: 'GEO/AEO: процитируют ли страницу ChatGPT, Алиса, Perplexity и «быстрые ответы»' },
]

let ctx: CanvasRenderingContext2D | null = null
function px(text: string, font: string) {
  if (typeof document === 'undefined') return text.length * 9
  ctx = ctx || document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * 9
  ctx.font = font
  return Math.round(ctx.measureText(text).width)
}

const plain = (s: any) => String(s ?? '').replace(/<[^>]*>/g, '').trim()

function Ring({ value, label, active, onClick }: { value: number; label: string; active: boolean; onClick: () => void }) {
  const c = scoreColor(value)
  const r = 22
  const len = 2 * Math.PI * r
  return (
    <button type="button" className={`gb-seo-ring ${active ? 'is-active' : ''}`} onClick={onClick}>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--theme-elevation-100)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(len * value) / 100} ${len}`} transform="rotate(-90 28 28)" />
        <text x="28" y="33" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--theme-text)">
          {value}
        </text>
      </svg>
      <span>{label}</span>
    </button>
  )
}

function Bar({ value, min, max, limit, label }: { value: number; min: number; max: number; limit: number; label: string }) {
  const pct = Math.min(100, (value / limit) * 100)
  const st = value === 0 ? 'bad' : value < min || value > max ? 'ok' : 'good'
  const color = st === 'good' ? '#16a34a' : st === 'ok' ? '#f59e0b' : '#dc2626'
  return (
    <div className="gb-seo-bar">
      <div className="gb-seo-bar__track">
        <div style={{ width: `${pct}%`, background: color }} />
      </div>
      <span>{label}</span>
    </div>
  )
}

function CheckRow({ c }: { c: Check }) {
  return (
    <li className={`gb-seo-check is-${c.status}`}>
      <span className="gb-seo-dot" aria-hidden />
      <div>
        <b>{c.title}</b>
        {c.tip && c.status !== 'good' && <p>{c.tip}</p>}
      </div>
    </li>
  )
}

export function SeoPanel(props: any) {
  const [fields] = useAllFormFields()
  const { collectionSlug, globalSlug, id } = useDocumentInfo() as any
  const fieldPath: string = props?.path || props?.field?.name || 'meta.panel'
  const prefix = fieldPath.includes('.') ? fieldPath.split('.').slice(0, -1).join('.') : 'meta'

  const titleF = useField<string>({ path: `${prefix}.title` })
  const descF = useField<string>({ path: `${prefix}.description` })

  const live = useMemo(() => reduceFieldsToValues(fields as any, true) as any, [fields])
  const data = useDeferredValue(live)
  const meta = prefix.split('.').reduce((o: any, k) => o?.[k], data) || {}

  const kind: Kind = globalSlug ? 'global' : KIND[collectionSlug] || 'page'
  const slug: string | undefined = data?.slug ?? undefined
  const h1 = plain(data?.title || data?.name || data?.heroTitle || '')
  const path = globalSlug ? GLOBAL_PATH[globalSlug] || '/' : slug ? (PATH[collectionSlug] || ((s: string) => `/${s}/`))(slug) : '/'

  const [engine, setEngine] = useState<'google' | 'yandex'>('google')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [tab, setTab] = useState<Group>('seo')
  const [ext, setExt] = useState<{ aiOpen?: boolean; template: string; dupFocus?: number; dupTitle?: number }>({ template: '%s — GeoBit' })

  // Настройки сайта (шаблон title, открыт ли сайт для ИИ)
  useEffect(() => {
    fetch('/api/globals/seo-settings?depth=0', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setExt((e) => ({ ...e, aiOpen: s.aiSearch !== false, template: s.titleTemplate || '%s — GeoBit' })))
      .catch(() => {})
  }, [])

  // Дубли ключевой фразы и title на других страницах
  const focus = String(meta.focusKeyword || '').trim()
  const metaTitle = String(meta.title || '').trim()
  const timer = useRef<any>(null)
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const cols = ['posts', 'services', 'landings', 'projects', 'pages']
      const count = async (field: string, value: string) => {
        if (!value) return 0
        let n = 0
        await Promise.all(
          cols.map(async (c) => {
            try {
              const q = new URLSearchParams({ [`where[meta.${field}][equals]`]: value, limit: '20', depth: '0' })
              const r = await fetch(`/api/${c}?${q}`, { credentials: 'include' })
              if (!r.ok) return
              const j = await r.json()
              n += (j.docs || []).filter((d: any) => !(c === collectionSlug && String(d.id) === String(id))).length
            } catch {}
          }),
        )
        return n
      }
      const [dupFocus, dupTitle] = await Promise.all([count('focusKeyword', focus), count('title', metaTitle)])
      setExt((e) => ({ ...e, dupFocus, dupTitle }))
    }, 700)
    return () => clearTimeout(timer.current)
  }, [focus, metaTitle, collectionSlug, id])

  const faqCount = (Array.isArray(meta.faq) ? meta.faq.length : 0) + (Array.isArray(data?.faq) ? data.faq.length : 0)
  const res = useMemo(
    () =>
      analyze({
        kind,
        h1,
        slug,
        metaTitle,
        metaDesc: meta.description,
        focus,
        synonyms: meta.synonyms,
        hasImage: Boolean(meta.image || data?.cover || data?.image),
        answer: meta.answer,
        faqCount,
        noindex: Boolean(meta.noindex || data?.noindex),
        canonical: meta.canonical,
        authorSet: Boolean(data?.author),
        updatedAt: data?.updatedAt,
        aiOpen: ext.aiOpen,
        dupFocus: ext.dupFocus,
        dupTitle: ext.dupTitle,
        data,
      }),
    [data, kind, h1, slug, metaTitle, focus, faqCount, ext, meta.description, meta.synonyms, meta.image, meta.answer, meta.noindex, meta.canonical],
  )

  const shownTitle = metaTitle || (h1 ? ext.template.replace('%s', h1) : 'Заголовок страницы')
  const shownDesc = String(meta.description || '').trim() || suggestDescription(data, 160)
  const crumbs = path.split('/').filter(Boolean)
  const titlePx = px(shownTitle, '20px arial')
  const list = res.checks.filter((c) => c.group === tab)
  const problems = list.filter((c) => c.status !== 'good').sort((a, b) => (a.status === 'bad' ? -1 : 1) - (b.status === 'bad' ? -1 : 1))
  const good = list.filter((c) => c.status === 'good')
  const w = device === 'mobile' ? 360 : 600

  return (
    <div className="gb-seo">
      <div className="gb-seo__head">
        <div>
          <div className="gb-seo__title">Как страницу увидят в поиске</div>
          <div className="gb-seo__sub">Обновляется на лету, пока вы печатаете</div>
        </div>
        <div className="gb-seo__seg">
          <button type="button" className={engine === 'google' ? 'on' : ''} onClick={() => setEngine('google')}>Google</button>
          <button type="button" className={engine === 'yandex' ? 'on' : ''} onClick={() => setEngine('yandex')}>Яндекс</button>
          <span />
          <button type="button" className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')}>Компьютер</button>
          <button type="button" className={device === 'mobile' ? 'on' : ''} onClick={() => setDevice('mobile')}>Телефон</button>
        </div>
      </div>

      <div className={`gb-serp gb-serp--${engine}`} style={{ maxWidth: w + 40 }}>
        <div className="gb-serp__site">
          <span className="gb-serp__fav">G</span>
          <div>
            <div className="gb-serp__name">GeoBit</div>
            <div className="gb-serp__url">
              {DOMAIN}
              {crumbs.map((c) => ` › ${decodeURIComponent(c)}`)}
            </div>
          </div>
        </div>
        <div className="gb-serp__t" style={{ maxWidth: w }}>
          {shownTitle}
        </div>
        <div className={`gb-serp__d ${meta.description ? '' : 'is-auto'}`} style={{ maxWidth: w }}>
          {shownDesc || 'Описание не заполнено — поисковик возьмёт случайный кусок текста.'}
        </div>
      </div>

      <div className="gb-seo__meters">
        <div>
          <div className="gb-seo__mlabel">
            Title <button type="button" onClick={() => titleF.setValue(ext.template.replace('%s', h1))} disabled={!h1}>Взять из заголовка</button>
          </div>
          <Bar value={metaTitle ? titlePx : 0} min={300} max={580} limit={620} label={metaTitle ? `${metaTitle.length} симв. · ${titlePx} из 600 px` : 'не заполнен'} />
        </div>
        <div>
          <div className="gb-seo__mlabel">
            Description <button type="button" onClick={() => descF.setValue(suggestDescription(data))}>Собрать из текста</button>
          </div>
          <Bar value={String(meta.description || '').length} min={110} max={165} limit={180} label={meta.description ? `${String(meta.description).length} из 120–160 симв.` : 'не заполнено'} />
        </div>
      </div>

      <div className="gb-seo__scores">
        {GROUPS.map((g) => (
          <Ring key={g.id} value={res.scores[g.id]} label={g.label} active={tab === g.id} onClick={() => setTab(g.id)} />
        ))}
        <div className="gb-seo__facts">
          <span>Слов: <b>{res.wordCount}</b></span>
          {focus && <span>Плотность фразы: <b>{res.density.toFixed(1)}%</b></span>}
          {res.readingEase != null && <span>Простота: <b>{res.readingEase}/100</b></span>}
        </div>
      </div>

      <div className="gb-seo__hint">{GROUPS.find((g) => g.id === tab)?.hint}</div>
      <ul className="gb-seo__checks">
        {problems.map((c) => (
          <CheckRow key={c.id} c={c} />
        ))}
        {!problems.length && <li className="gb-seo__allgood">Всё отлично — замечаний нет</li>}
      </ul>
      {good.length > 0 && (
        <details className="gb-seo__good">
          <summary>Уже хорошо: {good.length}</summary>
          <ul className="gb-seo__checks">
            {good.map((c) => (
              <CheckRow key={c.id} c={c} />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
