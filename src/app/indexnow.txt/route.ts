import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

/** Файл-ключ IndexNow: поисковик проверяет, что пинг пришёл от владельца сайта */
export async function GET() {
  const p = await getPayload({ config })
  const s: any = await p.findGlobal({ slug: 'seo-settings', depth: 0 }).catch(() => null)
  if (!s?.indexNowKey) return new Response('Not found', { status: 404 })
  return new Response(s.indexNowKey, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
