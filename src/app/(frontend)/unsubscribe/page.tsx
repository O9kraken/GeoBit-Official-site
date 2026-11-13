import type { Metadata } from 'next'
import { payload } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Отписка от рассылки — GeoBit', robots: { index: false, follow: false } }

/** Отписка по ссылке из письма: /unsubscribe/?t=<токен подписчика> */
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams
  let done = false
  if (t && /^[0-9a-f-]{36}$/i.test(t)) {
    const p = await payload()
    const r = await p.find({ collection: 'subscribers', where: { token: { equals: t } }, limit: 1, overrideAccess: true, depth: 0 })
    const s: any = r.docs[0]
    if (s) {
      if (s.status !== 'unsubscribed') await p.update({ collection: 'subscribers', id: s.id, data: { status: 'unsubscribed' } as any, overrideAccess: true })
      done = true
    }
  }
  return (
    <main id="main" role="main">
      <section className="section-padding" style={{ paddingTop: 160, minHeight: '60vh' }}>
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <h1 className="section-title">{done ? 'Вы отписались от рассылки' : 'Ссылка недействительна'}</h1>
          <p style={{ color: 'var(--gray-2)', marginTop: 16, lineHeight: 1.7 }}>
            {done
              ? 'Больше писем от GeoBit не будет. Если передумаете — подпишитесь снова в блоге.'
              : 'Не удалось найти подписку по этой ссылке. Чтобы отписаться, напишите нам — удалим адрес вручную.'}
          </p>
          <a href="/" className="btn btn-primary btn-lg" style={{ marginTop: 28 }}>
            <span>На главную</span>
          </a>
        </div>
      </section>
    </main>
  )
}
