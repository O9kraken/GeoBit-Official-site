import { cache } from 'react'
import type { Payload } from 'payload'

export const TZ = 'Europe/Moscow'

/** Даты в админке — всегда по Москве */
export const fmtMsk = (d: string | Date, withTime = true) =>
  new Date(d).toLocaleString('ru-RU', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : { year: 'numeric' }),
  })

export const weekdayMsk = (d: string | Date) => new Date(d).toLocaleString('ru-RU', { timeZone: TZ, weekday: 'short' })

/** Запланированные публикации статей: id статьи → время выхода (один запрос на страницу списка) */
export const getSchedule = cache(async (payload: Payload): Promise<Map<string, string>> => {
  const map = new Map<string, string>()
  try {
    const r = await payload.find({
      collection: 'payload-jobs' as any,
      where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }, { hasError: { not_equals: true } }] },
      limit: 1000,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    for (const j of r.docs as any[]) {
      const doc = j?.input?.doc
      if (doc?.relationTo !== 'posts' || !j.waitUntil || j?.input?.type === 'unpublish') continue
      const id = String(doc.value)
      const prev = map.get(id)
      if (!prev || j.waitUntil < prev) map.set(id, j.waitUntil)
    }
  } catch {
    /* очередь недоступна — просто не показываем расписание */
  }
  return map
})

/** Имена авторов: id пользователя → имя (или почта, если имя не заполнено) */
export const getAuthors = cache(async (payload: Payload): Promise<Map<string, string>> => {
  const map = new Map<string, string>()
  const r = await payload.find({ collection: 'users', limit: 200, depth: 0, pagination: false, overrideAccess: true, select: { name: true, email: true } as any })
  for (const u of r.docs as any[]) map.set(String(u.id), u.name || u.email)
  return map
})
