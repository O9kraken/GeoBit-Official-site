/**
 * Приём форм сайта. Совместим со скриптами старой темы: они шлют FormData
 * на adelfAjax.ajaxUrl (= /ajax/) с action=adelf_contact | adelf_subscribe
 * и ждут ответ в формате WordPress: { success, data: { message } }.
 */
import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { notifyLead } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const ok = (message: string) => Response.json({ success: true, data: { message } })
const fail = (message: string, status = 200) => Response.json({ success: false, data: { message } }, { status })

// --- простое ограничение частоты: 5 отправок за 10 минут с одного IP (в памяти процесса) ---
const hits = new Map<string, number[]>()
function limited(ip: string, max = 5, windowMs = 10 * 60_000) {
  const now = Date.now()
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(ip, list)
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  return list.length > max
}

const str = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined)

const LeadSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(100),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'Проверьте номер телефона'),
  email: z
    .string()
    .trim()
    .max(150)
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, 'Проверьте email'),
  service: str(200),
  service_title: str(200),
  plan_name: str(100),
  plan_price: str(100),
  budget: str(50),
  message: str(5000),
  contact_method: z.enum(['telegram', 'max', 'call']).optional().catch(undefined),
  page: str(300),
})

function clientIp(req: Request) {
  const h = req.headers
  return (h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0] || '').trim() || 'unknown'
}

function utmFrom(req: Request) {
  try {
    const ref = new URL(req.headers.get('referer') || '')
    const utm = [...ref.searchParams].filter(([k]) => k.startsWith('utm_') || k === 'yclid' || k === 'gclid')
    return { page: ref.pathname, utm: utm.length ? Object.fromEntries(utm) : undefined }
  } catch {
    return { page: undefined, utm: undefined }
  }
}

export async function POST(req: Request) {
  // формы маленькие: всё, что больше 64 КБ, не разбираем
  if (Number(req.headers.get('content-length') || 0) > 64 * 1024) return fail('Слишком большой запрос', 413)
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return fail('Некорректный запрос', 400)
  }
  const data = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']))
  const action = data.action

  // Ловушки для ботов: скрытое поле и слишком быстрое заполнение. Боту отвечаем «успехом» и ничего не сохраняем.
  const ts = Number(data.form_ts || 0)
  const tooFast = ts > 0 && Date.now() / 1000 - ts < 3
  if (data.website || tooFast) return ok('Спасибо! Мы свяжемся с вами в ближайшее время.')

  const ip = clientIp(req)
  if (limited(ip)) return fail('Слишком много отправок. Попробуйте через несколько минут или напишите нам в мессенджер.', 429)

  const payload = await getPayload({ config })
  const settings: any = await payload.findGlobal({ slug: 'settings' as any }).catch(() => ({}))
  const { page: refPage, utm } = utmFrom(req)

  if (action === 'adelf_subscribe') {
    const email = z.string().trim().email().max(150).safeParse(data.email)
    if (!email.success) return fail('Проверьте email.')
    if (data.consent !== '1') return fail('Необходимо согласие на обработку персональных данных.')
    const exists = await payload.find({ collection: 'subscribers', where: { email: { equals: email.data.toLowerCase() } }, limit: 1, overrideAccess: true })
    if (!exists.docs.length) {
      await payload.create({
        collection: 'subscribers',
        overrideAccess: true,
        data: { email: email.data.toLowerCase(), status: 'active', ip, consentAt: new Date().toISOString(), token: crypto.randomUUID() } as any,
      })
    }
    return ok('Вы подписались! Спасибо.')
  }

  if (action !== 'adelf_contact') return fail('Неизвестное действие', 400)
  if (data.consent !== '1') return fail('Необходимо согласие на обработку персональных данных.')

  const parsed = LeadSchema.safeParse(data)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Проверьте поля формы.')
  const v = parsed.data
  const baseService = v.service || v.service_title
  const plan = v.plan_name && !baseService?.includes(v.plan_name) ? `тариф «${v.plan_name}»${v.plan_price ? ` (${v.plan_price})` : ''}` : undefined
  const service = [baseService, plan].filter(Boolean).join(', ') || undefined
  if (v.message) v.message = v.message.replace(/\r\n?/g, '\n')
  // сводка калькулятора приходит в начале сообщения — выделяем её отдельно
  const calcMatch = v.message?.match(/^(Расч[её]т[\s\S]*?)(?:\n\n|$)/)

  const lead: any = await payload.create({
    collection: 'leads',
    overrideAccess: true,
    data: {
      name: v.name,
      phone: v.phone,
      email: v.email || undefined,
      method: v.contact_method,
      service,
      budget: v.budget,
      message: v.message,
      calc: calcMatch?.[1],
      status: 'new',
      page: v.page || refPage,
      utm: utm ? Object.entries(utm).map(([k, v]) => `${k}=${v}`).join(", ") : undefined,
      ip,
      consentAt: new Date().toISOString(),
      consentDoc: settings?.consentDocLabel || '/soglasie-pd/',
    } as any,
  })

  // уведомления не задерживают ответ посетителю дольше ~8 секунд и не ломают сохранение заявки
  const notify = await notifyLead(payload, { ...lead, service }, settings?.leadEmail || process.env.LEAD_EMAIL).catch((e) => ({ error: String(e) }))
  await payload.update({ collection: 'leads', id: lead.id, overrideAccess: true, data: { notify } as any }).catch(() => {})

  return ok(settings?.leadSuccessText || 'Спасибо! Заявка отправлена — свяжемся с вами в течение часа в рабочее время.')
}

export function GET() {
  return fail('Method not allowed', 405)
}
