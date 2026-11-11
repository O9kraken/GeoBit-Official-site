import config from '@payload-config'
import { getPayload } from 'payload'
import { SITE_URL, paths, stripTags } from '@/lib/util'

export const dynamic = 'force-dynamic'

const clean = (s?: string | null) => stripTags(s || '').replace(/\s+/g, ' ').trim()

/**
 * llms.txt — «визитка» сайта для ИИ-ассистентов (формат llmstxt.org):
 * кто мы, услуги с ценами, кейсы, статьи и частые вопросы со ссылками.
 */
export async function GET() {
  const p = await getPayload({ config })
  const s: any = await p.findGlobal({ slug: 'seo-settings', depth: 0 }).catch(() => ({}))
  if (s?.llmsEnabled === false) return new Response('Not found', { status: 404 })
  const [site, home, faqPage, services, projects, posts]: any[] = await Promise.all([
    p.findGlobal({ slug: 'settings', depth: 0 }).catch(() => ({})),
    p.findGlobal({ slug: 'home', depth: 0 }).catch(() => ({})),
    p.findGlobal({ slug: 'faq-page', depth: 0 }).catch(() => ({})),
    p.find({ collection: 'services', limit: 50, depth: 0, sort: 'order' }).then((r) => r.docs),
    p.find({ collection: 'projects', limit: 50, depth: 0, sort: 'order' }).then((r) => r.docs),
    p.find({ collection: 'posts', limit: 100, depth: 0, sort: '-publishedAt', where: { _status: { equals: 'published' } } }).then((r) => r.docs),
  ])
  const visible = (d: any) => !d?.meta?.noindex
  const u = (path: string) => `${SITE_URL}${path}`
  const out: string[] = []
  out.push('# GeoBit — веб-студия', '')
  const intro = clean(s?.llmsIntro) || clean(home?.seo?.answer) || clean(home?.seo?.description) || clean(site?.footerDescription)
  if (intro) out.push(`> ${intro}`, '')
  const contacts = [site?.phone && `телефон ${site.phone}`, site?.email && `email ${site.email}`, site?.telegramUrl && `Telegram ${site.telegramUrl}`, site?.address && `адрес: ${site.address}`].filter(Boolean)
  if (contacts.length) out.push(`Контакты: ${contacts.join(', ')}.`, '')

  out.push('## Услуги', '')
  for (const sv of services.filter(visible)) {
    const facts = [sv.price && `от ${sv.price}`, sv.duration && `срок от ${sv.duration}`].filter(Boolean).join(', ')
    const about = clean(sv.meta?.answer) || clean(sv.meta?.description) || clean(sv.shortDesc) || clean(sv.excerpt)
    out.push(`- [${sv.title}](${u(paths.service(sv.slug))})${facts ? ` (${facts})` : ''}: ${about}`)
  }
  out.push('')

  if (projects.length) {
    out.push('## Портфолио', '')
    for (const pr of projects.filter(visible)) out.push(`- [${pr.title}](${u(paths.project(pr.slug))}): ${clean(pr.meta?.description) || clean(pr.excerpt)}`)
    out.push('')
  }
  if (posts.length) {
    out.push('## Статьи', '')
    for (const po of posts.filter(visible)) out.push(`- [${po.title}](${u(paths.post(po.slug))}): ${clean(po.meta?.answer) || clean(po.meta?.description) || clean(po.excerpt)}`)
    out.push('')
  }
  const faq = (faqPage?.faq?.length ? faqPage.faq : home?.faq || []).slice(0, 15)
  if (faq.length) {
    out.push('## Частые вопросы', '')
    for (const f of faq) out.push(`### ${clean(f.q)}`, clean(f.a), '')
  }
  out.push('## Страницы', '', `- [О студии](${u('/about/')})`, `- [Контакты](${u('/contacts/')})`, `- [Все вопросы и ответы](${u('/faq/')})`, `- [Блог](${u('/blog/')})`, '')
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
