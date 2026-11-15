import type { TaskConfig } from 'payload'
import { notifyStaff } from '../lib/notify'
import { SITE } from '../lib/email-layout'

const HOUR = 3600_000

/**
 * Каждые 15 минут:
 * 1) напоминает в Telegram/MAX о заявках, которые висят «Новыми» больше часа (один раз; в сообщении — только номер и ссылка);
 * 2) удаляет записи истории изменений старше 180 дней.
 */
export const housekeepingTask: TaskConfig<any> = {
  slug: 'gbHousekeeping',
  label: 'Напоминания о заявках и чистка истории',
  schedule: [{ cron: '0 */15 * * * *', queue: 'default' }],
  retries: 0,
  handler: async ({ req }) => {
    const p = req.payload
    const stale = await p.find({
      collection: 'leads',
      where: { and: [{ status: { equals: 'new' } }, { createdAt: { less_than: new Date(Date.now() - HOUR).toISOString() } }, { remindedAt: { exists: false } }] },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })
    for (const l of stale.docs as any[]) {
      const h = Math.max(1, Math.round((Date.now() - new Date(l.createdAt).getTime()) / HOUR))
      await notifyStaff(`⏰ Заявка №${l.id} ждёт ответа уже ${h} ч${l.service ? ` — ${l.service}` : ''}\n${SITE}/admin/collections/leads/${l.id}`).catch(() => {})
      await p.update({ collection: 'leads', id: l.id, data: { remindedAt: new Date().toISOString() } as any, overrideAccess: true, req, context: { skipAudit: true } })
    }
    await p
      .delete({ collection: 'audit-log' as any, where: { createdAt: { less_than: new Date(Date.now() - 180 * 24 * HOUR).toISOString() } }, overrideAccess: true, req })
      .catch(() => {})
    return { output: { reminded: stale.docs.length } }
  },
}
