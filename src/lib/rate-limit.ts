/**
 * Простое ограничение частоты в памяти процесса (сайт работает одним контейнером).
 * IP берётся из X-Real-IP: Caddy всегда перезаписывает его настоящим адресом клиента,
 * подделать его из браузера нельзя (см. Caddyfile → header_up X-Real-IP).
 */
const buckets = new Map<string, number[]>()

export function clientIpFrom(headers: Headers | undefined | null): string {
  const h = headers
  if (!h) return 'unknown'
  const xff = h.get('x-forwarded-for')
  return (h.get('x-real-ip') || (xff ? xff.split(',').pop() : '') || '').trim() || 'unknown'
}

/** true — лимит превышен. key — что ограничиваем (например, 'login:1.2.3.4') */
export function overLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const list = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  list.push(now)
  buckets.set(key, list)
  if (buckets.size > 20000) for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k)
  return list.length > max
}
