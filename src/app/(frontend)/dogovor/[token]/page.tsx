import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { payload as getPayload } from '@/lib/payload'
import { buildModel } from '@/lib/contracts/render'
import { PrintButton } from './PrintButton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Договор | GeoBit',
  robots: { index: false, follow: false, nocache: true },
}

async function load(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null
  const p = await getPayload()
  const r = await p.find({ collection: 'contracts' as any, where: { token: { equals: token } }, limit: 1, depth: 0, overrideAccess: true })
  const c: any = r.docs[0]
  if (!c || c.status === 'cancelled') return null
  const settings: any = await p.findGlobal({ slug: 'contract-settings' as any, overrideAccess: true, depth: 0 }).catch(() => ({}))
  return { c, m: buildModel(c, settings) }
}

function Parties({ m, compact }: { m: ReturnType<typeof buildModel>; compact?: boolean }) {
  const ps: [string, { title: string; lines: string[]; sign: string }][] = [
    ['Исполнитель', m.parties.executor],
    ['Заказчик', m.parties.client],
  ]
  return (
    <div className="dg-parties">
      {ps.map(([role, p]) => (
        <div key={role} className="dg-party">
          <p className="dg-party__role">{role}</p>
          <p className="dg-party__name">{p.title}</p>
          {!compact && p.lines.map((l) => <p key={l}>{l}</p>)}
        </div>
      ))}
      {ps.map(([role, p]) => (
        <p key={`s-${role}`} className="dg-sign">
          _______________ / {p.sign}
          <small>подпись</small>
        </p>
      ))}
    </div>
  )
}

export default async function ContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const got = await load(token)
  if (!got) notFound()
  const { m } = got
  return (
    <main id="main" role="main" className="dg">
      <style>{CSS}</style>
      <div className="dg-bar">
        <span>
          Договор № {m.number} от {m.date}
          {m.draft ? ' · проект' : ''}
        </span>
        <span className="dg-bar__btns">
          <a className="dg-btn dg-btn--accent" href={`/api/contracts/doc/${token}/docx/`} download>
            Скачать Word
          </a>
          <PrintButton />
        </span>
      </div>

      <article className="dg-doc">
        {m.draft && <p className="dg-draft">ПРОЕКТ</p>}
        <h1>{m.title}</h1>
        {m.subtitle && <p className="dg-sub">{m.subtitle}</p>}
        <div className="dg-place">
          <span>г. {m.city}</span>
          <span>{m.date}</span>
        </div>
        <p className="dg-p">{m.preamble}</p>

        {m.sections.map((s) => (
          <section key={s.no}>
            <h2>
              {s.no}. {s.title}
            </h2>
            {s.clauses.length ? (
              <div className="dg-clauses">
                {s.clauses.map((c, i) =>
                  c.kind === 'num' ? (
                    <p key={i} className="dg-p">
                      <b>{c.no}</b> {c.text}
                    </p>
                  ) : c.kind === 'bullet' ? (
                    <p key={i} className="dg-li">
                      – {c.text}
                    </p>
                  ) : (
                    <p key={i} className="dg-p">
                      {c.text}
                    </p>
                  ),
                )}
              </div>
            ) : (
              <Parties m={m} />
            )}
          </section>
        ))}

        <section className="dg-appendix">
          <p className="dg-right">{m.appendix.title}</p>
          <h2>Техническое задание и график оплаты</h2>
          <h3>1. Состав работ (услуг)</h3>
          {m.appendix.scope.map((s, i) => (
            <p key={i} className="dg-p">
              <b>1.{i + 1}.</b> {s}
            </p>
          ))}
          <h3>2. Основные условия</h3>
          {m.appendix.terms.map((s, i) => (
            <p key={i} className="dg-p">
              <b>2.{i + 1}.</b> {s}
            </p>
          ))}
          <h3>3. График оплаты</h3>
          {m.appendix.payments.map((s, i) => (
            <p key={i} className="dg-p">
              <b>3.{i + 1}.</b> {s}
            </p>
          ))}
          <h2>Подписи Сторон</h2>
          <Parties m={m} compact />
        </section>
      </article>
    </main>
  )
}

const CSS = `
.dg { padding: 110px 16px 80px; }
.dg-bar { position: sticky; top: 76px; z-index: 5; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; max-width: 860px; margin: 0 auto 16px; padding: 10px 14px; border-radius: 14px; background: rgba(20,20,28,.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.08); color: #ddd; font-size: 14px; }
.dg-bar__btns { display: flex; gap: 8px; }
.dg-btn { display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18); background: transparent; color: #fff; font: inherit; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; }
.dg-btn--accent { border: 0; background: linear-gradient(135deg, #7c3aed, #4f46e5); }
.dg-doc { max-width: 860px; margin: 0 auto; padding: 64px 72px; background: #fff; color: #111; border-radius: 6px; box-shadow: 0 20px 60px rgba(0,0,0,.35); font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.5; }
.dg-doc h1 { margin: 0; text-align: center; font-size: 20px; font-weight: 700; letter-spacing: .02em; color: #111; }
.dg-sub { margin: 4px 0 22px; text-align: center; font-weight: 700; }
.dg-draft { margin: 0 0 8px; text-align: right; font-size: 13px; font-weight: 700; color: #b00; letter-spacing: .1em; }
.dg-place { display: flex; justify-content: space-between; margin-bottom: 18px; }
.dg-doc h2 { margin: 22px 0 8px; text-align: center; font-size: 16px; font-weight: 700; text-transform: uppercase; color: #111; break-after: avoid; }
.dg-doc h3 { margin: 16px 0 6px; font-size: 16px; font-weight: 700; color: #111; break-after: avoid; }
.dg-p { margin: 0 0 6px; text-align: justify; }
.dg-li { margin: 0 0 4px; padding-left: 28px; text-align: justify; }
.dg-right { text-align: right; font-size: 14px; }
.dg-appendix { margin-top: 48px; padding-top: 28px; border-top: 1px dashed #bbb; break-before: page; }
.dg-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 0 28px; margin-top: 8px; break-inside: avoid; }
.dg-party p { margin: 0 0 2px; font-size: 14.5px; text-align: left; }
.dg-party__role { font-weight: 700; margin-bottom: 4px !important; }
.dg-party__name { font-weight: 700; }
.dg-sign { margin: 28px 0 0 !important; font-size: 14.5px; }
.dg-sign small { display: block; padding-left: 40px; font-size: 11px; font-style: italic; color: #666; }
@media (max-width: 720px) { .dg-doc { padding: 28px 18px; font-size: 15px; } .dg-parties { gap: 0 14px; } .dg-party p, .dg-sign { font-size: 12.5px !important; } }
@media print {
  @page { size: A4; margin: 20mm 15mm 18mm 20mm; }
  body * { visibility: hidden; }
  .dg-doc, .dg-doc * { visibility: visible; }
  .dg { padding: 0; }
  .dg-doc { position: absolute; left: 0; top: 0; width: 100%; max-width: none; margin: 0; padding: 0; box-shadow: none; border-radius: 0; font-size: 12pt; }
  .dg-appendix { border-top: 0; margin-top: 0; }
}
`
