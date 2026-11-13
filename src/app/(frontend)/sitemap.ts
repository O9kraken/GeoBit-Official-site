export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { getLandings, getPosts, getProjects, getServices, getTerms, payload } from '@/lib/payload'
import { SITE_URL, paths } from '@/lib/util'


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const p = await payload()
  const [services, projects, posts, pages, scats, pcats, cats, landings] = await Promise.all([
    getServices(),
    getProjects(),
    getPosts(),
    p.find({ collection: 'pages', limit: 100, depth: 0, where: { noindex: { not_equals: true } } }),
    getTerms('service-categories'),
    getTerms('portfolio-categories'),
    getTerms('categories'),
    getLandings(),
  ])
  // страницы с «Не индексировать» или чужим каноническим адресом в карту сайта не попадают
  const open = (d: any) => !d?.meta?.noindex && !d?.meta?.canonical
  const u = (path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: lastModified ? new Date(lastModified) : undefined,
    priority,
  })
  return [
    u('/', undefined, 1),
    u('/services/', undefined, 0.9),
    u('/portfolio/', undefined, 0.8),
    u('/about/', undefined, 0.7),
    u('/contacts/', undefined, 0.8),
    u('/blog/', undefined, 0.7),
    u('/faq/', undefined, 0.5),
    ...services.filter(open).map((s: any) => u(paths.service(s.slug), s.updatedAt, 0.9)),
    ...landings.filter(open).map((x: any) => u(paths.landing(x.slug), x.updatedAt, 0.8)),
    ...projects.filter(open).map((x: any) => u(paths.project(x.slug), x.updatedAt, 0.6)),
    ...posts.filter(open).map((x: any) => u(paths.post(x.slug), x.updatedAt, 0.7)),
    ...pages.docs.filter(open).map((x: any) => u(paths.page(x.slug), x.updatedAt, 0.3)),
    ...scats.filter(open).map((x: any) => u(paths.serviceCategory(x.slug), x.updatedAt, 0.5)),
    ...pcats.filter(open).map((x: any) => u(paths.portfolioCategory(x.slug), x.updatedAt, 0.4)),
    ...cats.filter(open).map((x: any) => u(paths.category(x.slug), x.updatedAt, 0.4)),
  ]
}
