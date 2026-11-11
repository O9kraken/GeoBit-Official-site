import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { analyze, scoreColor, type Kind } from '@/lib/seo-analysis'

const COLS: { slug: string; label: string; kind: Kind; path: (s: string) => string }[] = [
  { slug: 'services', label: 'Услуга', kind: 'service', path: (s) => `/services/${s}/` },
  { slug: 'posts', label: 'Статья', kind: 'post', path: (s) => `/${s}/` },
  { slug: 'projects', label: 'Кейс', kind: 'project', path: (s) => `/project/${s}/` },
  { slug: 'pages', label: 'Документ', kind: 'page', path: (s) => `/${s}/` },
  { slug: 'categories', label: 'Рубрика блога', kind: 'term', path: (s) => `/category/${s}/` },
  { slug: 'service-categories', label: 'Рубрика услуг', kind: 'term', path: (s) => `/service-category/${s}/` },
  { slug: 'portfolio-categories', label: 'Рубрика портфолио', kind: 'term', path: (s) => `/portfolio-category/${s}/` },
]
const GLOBALS: { slug: string; label: string; path: string }[] = [
  { slug: 'home', label: 'Главная', path: '/' },
  { slug: 'services-page', label: 'Страница «Услуги»', path: '/services/' },
  { slug: 'about-page', label: 'Страница «О нас»', path: '/about/' },
  { slug: 'portfolio-page', label: 'Страница «Портфолио»', path: '/portfolio/' },
  { slug: 'blog-page', label: 'Страница «Блог»', path: '/blog/' },
  { slug: 'contacts-page', label: 'Страница «Контакты»', path: '/contacts/' },
  { slug: 'faq-page', label: 'Страница «FAQ»', path: '/faq/' },
]

type Row = {
  name: string
  type: string
  path: string
  edit: string
  scores: { seo: number; read: number; ai: number }
  issues: string[]
  focus?: string
  title?: string
  hasDesc: boolean
  noindex: boolean
  hasAnswer: boolean
}

const Pill = ({ v }: { v: number }) => (
  <span className="gb-audit__pill" style={{ background: scoreColor(v) }}>
    {v}
  </span>
)

export async function SeoAudit({ initPageResult, params, searchParams }: any) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/admin/login')
  const payload = req.payload
  const sort = (searchParams?.sort as string) || 'seo'

  let aiOpen: boolean | undefined
  try {
    const s: any = await payload.findGlobal({ slug: 'seo-settings', depth: 0 })
    aiOpen = s?.aiSearch !== false
  } catch {}

  const raw: { name: string; type: string; kind: Kind; path: string; edit: string; doc: any; meta: any; slug?: string }[] = []
  for (const c of COLS) {
    try {
      const r = await payload.find({ collection: c.slug as any, limit: 300, depth: 0, draft: false, overrideAccess: true })
      for (const d of r.docs as any[]) {
        raw.push({ name: d.title || d.name || `#${d.id}`, type: c.label, kind: c.kind, path: d.slug ? c.path(d.slug) : '', edit: `/admin/collections/${c.slug}/${d.id}`, doc: d, meta: d.meta || {}, slug: d.slug })
      }
    } catch {}
  }
  for (const g of GLOBALS) {
    try {
      const d: any = await payload.findGlobal({ slug: g.slug as any, depth: 0 })
      raw.push({ name: g.label, type: 'Страница', kind: 'global', path: g.path, edit: `/admin/globals/${g.slug}`, doc: d, meta: d?.seo || {} })
    } catch {}
  }

  const norm = (s?: string) => String(s || '').trim().toLowerCase()
  const focusCount = new Map<string, number>()
  const titleCount = new Map<string, number>()
  for (const r of raw) {
    if (norm(r.meta.focusKeyword)) focusCount.set(norm(r.meta.focusKeyword), (focusCount.get(norm(r.meta.focusKeyword)) || 0) + 1)
    if (norm(r.meta.title)) titleCount.set(norm(r.meta.title), (titleCount.get(norm(r.meta.title)) || 0) + 1)
  }

  const rows: Row[] = raw.map((r) => {
    const m = r.meta
    const faqCount = (Array.isArray(m.faq) ? m.faq.length : 0) + (Array.isArray(r.doc?.faq) ? r.doc.faq.length : 0)
    const a = analyze({
      kind: r.kind,
      h1: String(r.doc?.title || r.doc?.name || r.doc?.heroTitle || r.name).replace(/<[^>]*>/g, ''),
      slug: r.slug,
      metaTitle: m.title,
      metaDesc: m.description,
      focus: m.focusKeyword,
      synonyms: m.synonyms,
      hasImage: Boolean(m.image || r.doc?.cover || r.doc?.image),
      answer: m.answer,
      faqCount,
      noindex: Boolean(m.noindex || r.doc?.noindex),
      canonical: m.canonical,
      authorSet: Boolean(r.doc?.author),
      updatedAt: r.doc?.updatedAt,
      aiOpen,
      dupFocus: norm(m.focusKeyword) ? (focusCount.get(norm(m.focusKeyword)) || 1) - 1 : 0,
      dupTitle: norm(m.title) ? (titleCount.get(norm(m.title)) || 1) - 1 : 0,
      data: r.doc,
    })
    const issues = a.checks
      .filter((c) => c.status !== 'good')
      .sort((x, y) => (x.status === 'bad' ? 0 : 1) - (y.status === 'bad' ? 0 : 1))
      .map((c) => c.title)
    return {
      name: r.name,
      type: r.type,
      path: r.path,
      edit: r.edit,
      scores: a.scores,
      issues,
      focus: m.focusKeyword,
      title: m.title,
      hasDesc: Boolean(String(m.description || '').trim()),
      noindex: Boolean(m.noindex || r.doc?.noindex),
      hasAnswer: Boolean(String(m.answer || '').trim()),
    }
  })

  const key = (sort === 'ai' ? 'ai' : sort === 'read' ? 'read' : 'seo') as 'seo' | 'read' | 'ai'
  rows.sort((a, b) => a.scores[key] - b.scores[key])
  const avg = (k: 'seo' | 'read' | 'ai') => (rows.length ? Math.round(rows.reduce((n, r) => n + r.scores[k], 0) / rows.length) : 0)
  const stats = [
    { n: rows.filter((r) => !r.focus).length, label: 'без ключевой фразы' },
    { n: rows.filter((r) => !r.hasDesc).length, label: 'без описания' },
    { n: [...titleCount.values()].filter((v) => v > 1).length, label: 'повторяющихся title' },
    { n: rows.filter((r) => !r.hasAnswer).length, label: 'без короткого ответа для ИИ' },
    { n: rows.filter((r) => r.noindex).length, label: 'закрыто от поиска' },
  ]

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div className="gb-audit">
          <div className="gb-audit__head">
            <div>
              <h1>SEO-аудит сайта</h1>
              <p>Все страницы сразу: что мешает им попасть в поиск и в ответы ИИ. Сверху — самые слабые. Нажмите на страницу, чтобы исправить.</p>
            </div>
            <div className="gb-audit__links">
              <a href="/admin/globals/seo-settings">Настройки SEO и ИИ</a>
              <a href="/llms.txt" target="_blank" rel="noopener">llms.txt ↗</a>
              <a href="/robots.txt" target="_blank" rel="noopener">robots.txt ↗</a>
              <a href="/sitemap.xml" target="_blank" rel="noopener">sitemap.xml ↗</a>
            </div>
          </div>

          <div className="gb-audit__cards">
            <div className="gb-audit__card">
              <span>Средний балл</span>
              <div className="gb-audit__avgs">
                <div><Pill v={avg('seo')} /> SEO</div>
                <div><Pill v={avg('read')} /> Читаемость</div>
                <div><Pill v={avg('ai')} /> ИИ-поиск</div>
              </div>
            </div>
            {stats.map((s) => (
              <div key={s.label} className={`gb-audit__card ${s.n ? 'is-warn' : ''}`}>
                <b>{s.n}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="gb-audit__sort">
            Сортировать по:{' '}
            <a className={key === 'seo' ? 'on' : ''} href="?sort=seo">SEO</a>
            <a className={key === 'read' ? 'on' : ''} href="?sort=read">читаемости</a>
            <a className={key === 'ai' ? 'on' : ''} href="?sort=ai">ИИ-поиску</a>
          </div>

          <table className="gb-audit__table">
            <thead>
              <tr>
                <th>Страница</th>
                <th>SEO</th>
                <th>Чит.</th>
                <th>ИИ</th>
                <th>Ключевая фраза</th>
                <th>Что исправить в первую очередь</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.edit}>
                  <td>
                    <a href={r.edit} className="gb-audit__name">{r.name}</a>
                    <div className="gb-audit__meta">
                      {r.type}
                      {r.path && (
                        <>
                          {' · '}
                          <a href={r.path} target="_blank" rel="noopener">{decodeURIComponent(r.path)}</a>
                        </>
                      )}
                      {r.noindex && <em> · скрыта от поиска</em>}
                    </div>
                  </td>
                  <td><Pill v={r.scores.seo} /></td>
                  <td><Pill v={r.scores.read} /></td>
                  <td><Pill v={r.scores.ai} /></td>
                  <td>{r.focus || <span className="gb-audit__muted">—</span>}</td>
                  <td>
                    {r.issues.length ? (
                      <ul className="gb-audit__issues">
                        {r.issues.slice(0, 3).map((i) => <li key={i}>{i}</li>)}
                        {r.issues.length > 3 && <li className="gb-audit__muted">и ещё {r.issues.length - 3}</li>}
                      </ul>
                    ) : (
                      <span style={{ color: '#16a34a' }}>Всё хорошо</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
