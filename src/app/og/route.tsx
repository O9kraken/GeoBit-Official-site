/**
 * Картинки для соцсетей (Open Graph, 1200×630) — генерируются для каждой страницы.
 * /og/?t=Заголовок&s=Подпись&k=Метка&b=Плашка&img=/media/обложка.webp&v=версия
 * Логотип — src/assets/og-logo.svg, шрифт Unbounded (OFL) — src/assets/fonts.
 * Обложка берётся только с этого сайта (/media/…), чужие адреса игнорируются.
 */
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { clientIpFrom, overLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ASSETS = path.join(process.cwd(), 'src', 'assets')
type F = { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }
let fontsP: Promise<F[]> | null = null
const fonts = () =>
  (fontsP ??= Promise.all(
    [
      ['Unbounded', 'unbounded-700.ttf', 700],
      ['Unbounded', 'unbounded-400.ttf', 400],
      // в Unbounded нет знака ₽ — берём его из DejaVu Sans
      ['Ruble', 'ruble-bold.ttf', 700],
      ['Ruble', 'ruble-regular.ttf', 400],
    ].map(async ([name, file, weight]) => ({
      name: name as string,
      weight: weight as 400 | 700,
      style: 'normal' as const,
      data: await readFile(path.join(ASSETS, 'fonts', file as string)),
    })),
  ))
let logoP: Promise<string> | null = null
const logo = () => (logoP ??= readFile(path.join(ASSETS, 'og-logo.svg')).then((b) => `data:image/svg+xml;base64,${b.toString('base64')}`))

/** Небольшой кэш готовых PNG в памяти процесса */
const cache = new Map<string, Buffer>()
const MAX_CACHE = 300

const clip = (s: string | null, n: number) => {
  const v = String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return v.length > n ? v.slice(0, n - 1).replace(/[\s,.:;—–-]+\S*$/, '') + '…' : v
}

async function cover(src: string | null): Promise<string | null> {
  if (!src || !/^\/(media|api\/media\/file)\/[^?#]+$/.test(src) || src.includes('..')) return null
  try {
    const port = process.env.PORT || '3000'
    const r = await fetch(`http://127.0.0.1:${port}${src}`, { cache: 'no-store' })
    if (!r.ok) return null
    const png = await sharp(Buffer.from(await r.arrayBuffer())).resize(720, 720, { fit: 'cover' }).png().toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url)
  const key = u.search
  const hit = cache.get(key)
  const headers = { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' }
  if (hit) return new Response(new Uint8Array(hit), { headers })

  // рисование картинки нагружает процессор: новых картинок — не больше 40 в минуту с одного IP
  if (overLimit(`og:${clientIpFrom(req.headers)}`, 40, 60_000)) return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } })

  const [img, logoSrc, fontList] = await Promise.all([cover(u.searchParams.get('img')), logo(), fonts()])
  const title = clip(u.searchParams.get('t'), 80) || 'GeoBit'
  const sub = clip(u.searchParams.get('s'), img ? 105 : 130)
  const kind = clip(u.searchParams.get('k'), 30)
  const badge = clip(u.searchParams.get('b'), 40)

  const textW = img ? 640 : 1040
  const len = title.length
  const size = img ? (len > 50 ? 40 : len > 30 ? 48 : 58) : len > 60 ? 50 : len > 36 ? 60 : 72

  const res = new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', background: '#080808', fontFamily: 'Unbounded, Ruble', color: '#fff' }}>
        {/* фоновые свечения в фирменных цветах */}
        <div style={{ position: 'absolute', left: -180, top: -220, width: 620, height: 620, borderRadius: 620, background: 'radial-gradient(circle, rgba(255,0,102,.32), rgba(255,0,102,0) 70%)' }} />
        <div style={{ position: 'absolute', right: -160, bottom: -260, width: 700, height: 700, borderRadius: 700, background: 'radial-gradient(circle, rgba(124,0,255,.38), rgba(124,0,255,0) 70%)' }} />
        <div style={{ position: 'absolute', right: 220, top: -200, width: 420, height: 420, borderRadius: 420, background: 'radial-gradient(circle, rgba(0,212,255,.16), rgba(0,212,255,0) 70%)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, background: 'linear-gradient(90deg,#ff0066,#7c00ff 55%,#00d4ff)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 72px 60px', width: textW + 144, height: '100%' }}>
          <img src={logoSrc} width={203} height={70} style={{ width: 203, height: 70 }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {kind ? (
              <div style={{ display: 'flex', marginBottom: 18 }}>
                <div style={{ display: 'flex', padding: '9px 18px', borderRadius: 40, border: '1.5px solid rgba(0,212,255,.55)', color: '#00d4ff', fontSize: 20, letterSpacing: 1 }}>{kind.toUpperCase()}</div>
              </div>
            ) : null}
            <div style={{ display: 'flex', fontSize: size, fontWeight: 700, lineHeight: 1.12, width: textW, letterSpacing: -0.5 }}>{title}</div>
            {sub ? <div style={{ display: 'flex', marginTop: 20, fontSize: 21, lineHeight: 1.5, color: '#b9b6c9', width: textW, fontWeight: 400 }}>{sub}</div> : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: '#8f8ca3' }}>
            <div style={{ display: 'flex' }}>getgeobit.ru</div>
            {badge ? (
              <div style={{ display: 'flex', marginLeft: 22, padding: '10px 20px', borderRadius: 14, background: 'linear-gradient(90deg,#ff0066,#7c00ff)', color: '#fff', fontSize: 20, fontWeight: 700 }}>{badge}</div>
            ) : null}
          </div>
        </div>

        {img ? (
          <div style={{ position: 'absolute', right: 64, top: 95, width: 360, height: 440, display: 'flex', borderRadius: 28, overflow: 'hidden', border: '2px solid rgba(255,255,255,.12)', boxShadow: '0 30px 80px rgba(124,0,255,.35)' }}>
            <img src={img} width={360} height={440} style={{ width: 360, height: 440, objectFit: 'cover' }} />
          </div>
        ) : null}
      </div>
    ),
    { width: 1200, height: 630, fonts: fontList },
  )
  const buf = Buffer.from(await res.arrayBuffer())
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!)
  cache.set(key, buf)
  return new Response(new Uint8Array(buf), { headers })
}
