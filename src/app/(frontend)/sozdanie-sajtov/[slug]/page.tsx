import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { LandingView } from '@/components/sections/Landing'
import { cmsRedirect, findBySlug } from '@/lib/payload'
import { docMeta } from '@/lib/seo'
import { LANDING_HUB, paths } from '@/lib/util'

type P = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params
  const d = await findBySlug('landings', decodeURIComponent(slug))
  return d ? docMeta(d, paths.landing(d.slug)) : {}
}

export default async function LandingPage({ params }: P) {
  const { slug } = await params
  const s = decodeURIComponent(slug)
  if (s === LANDING_HUB) permanentRedirect(paths.landing(LANDING_HUB))
  const d = await findBySlug('landings', s)
  if (!d) {
    const to = await cmsRedirect(`/sozdanie-sajtov/${slug}/`)
    if (to) permanentRedirect(to)
    notFound()
  }
  return <LandingView doc={d} />
}
