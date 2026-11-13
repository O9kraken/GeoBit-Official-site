import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LandingView } from '@/components/sections/Landing'
import { findBySlug } from '@/lib/payload'
import { docMeta } from '@/lib/seo'
import { LANDING_HUB, paths } from '@/lib/util'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const d = await findBySlug('landings', LANDING_HUB)
  return d ? docMeta(d, paths.landing(LANDING_HUB)) : {}
}

/** «Создание сайтов в Крыму» — общая страница региона со ссылками на города и отрасли */
export default async function LandingHub() {
  const d = await findBySlug('landings', LANDING_HUB)
  if (!d) notFound()
  return <LandingView doc={d} />
}
