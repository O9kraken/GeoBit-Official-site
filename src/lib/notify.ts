/**
 * Уведомления о новой заявке.
 *
 * Персональные данные (имя, телефон, email, текст) уходят ТОЛЬКО письмом на почту
 * в российском почтовом сервисе (SMTP_* в .env). В Telegram и MAX — только номер заявки,
 * услуга и ссылка в админку: так переписка в мессенджерах не становится
 * «передачей ПДн третьим лицам», а Telegram из РФ может быть недоступен.
 */
import type { Payload } from 'payload'
import { emailLayout, esc, SITE } from './email-layout'
import { overLimit } from './rate-limit'


type Lead = { id: number | string; name?: string; phone?: string; email?: string; method?: string; service?: string; budget?: string; message?: string; page?: string }
type Result = Record<string, 'ok' | 'skip' | string>

async function withTimeout(p: Promise<Response>, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await p
  } finally {
    clearTimeout(t)
  }
}

async function telegram(text: string): Promise<string> {
  const token = process.env.TG_BOT_TOKEN
  const chat = process.env.TG_CHAT_ID
  if (!token || !chat) return 'skip'
  // TG_API_BASE — если api.telegram.org недоступен с сервера, можно указать свой Bot API-сервер/прокси
  const base = (process.env.TG_API_BASE || 'https://api.telegram.org').replace(/\/$/, '')
  try {
    const r = await withTimeout(
      fetch(`${base}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      }),
    )
    return r.ok ? 'ok' : `http ${r.status}`
  } catch (e: any) {
    return `error: ${e?.message || e}`
  }
}

async function max(text: string): Promise<string> {
  const token = process.env.MAX_BOT_TOKEN
  const chat = process.env.MAX_CHAT_ID
  if (!token || !chat) return 'skip'
  const base = (process.env.MAX_API_BASE || 'https://platform-api.max.ru').replace(/\/$/, '')
  try {
    const r = await withTimeout(
      fetch(`${base}/messages?chat_id=${encodeURIComponent(chat)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: token },
        body: JSON.stringify({ text }),
      }),
    )
    return r.ok ? 'ok' : `http ${r.status}`
  } catch (e: any) {
    return `error: ${e?.message || e}`
  }
}

async function email(payload: Payload, to: string | undefined, lead: Lead): Promise<string> {
  if (!to || !process.env.SMTP_HOST) return 'skip'
  const method = { telegram: 'Telegram', max: 'MAX', call: 'Звонок' }[lead.method || ''] || lead.method
  const { html, text } = emailLayout({
    preheader: [lead.name, lead.phone, lead.service].filter(Boolean).join(' · ') || 'Новая заявка с сайта',
    title: `Заявка №${lead.id}`,
    paragraphs: [`Новая заявка с сайта${lead.service ? ` — ${lead.service}` : ''}.`],
    rows: [
      ['Имя', lead.name],
      ['Телефон', lead.phone],
      ['Email', lead.email],
      ['Как связаться', method],
      ['Услуга', lead.service],
      ['Бюджет', lead.budget],
      ['Сообщение', lead.message],
      ['Страница', lead.page],
    ],
    button: { href: `${SITE}/admin/collections/leads/${lead.id}`, text: 'Открыть в админке' },
    footer: 'Уведомление сайта getgeobit.ru о новой заявке.',
  })
  try {
    await payload.sendEmail({
      to,
      subject: `Заявка №${lead.id}${lead.service ? ' — ' + lead.service : ''}${lead.name ? ' — ' + lead.name : ''}`,
      html,
      text,
      ...(lead.email ? { replyTo: lead.email } : {}),
    })
    return 'ok'
  } catch (e: any) {
    return `error: ${e?.message || e}`
  }
}

type Contacts = { phone?: string; email?: string; telegramUrl?: string; maxUrl?: string }

/**
 * Подтверждение клиенту «заявка получена». Включается в .env: LEAD_CONFIRM=on.
 * Уходит только если клиент сам указал email. Без его данных в теле — только номер и что дальше.
 */
async function confirmClient(payload: Payload, lead: Lead, c: Contacts): Promise<string> {
  if (process.env.LEAD_CONFIRM !== 'on' || !process.env.SMTP_HOST) return 'skip'
  const to = String(lead.email || '').trim()
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to)) return 'skip'
  // Письмо уходит на адрес, который ввёл посетитель, — защищаемся от рассылки спама через форму:
  // не больше 30 подтверждений в час на весь сайт и 2 в сутки на один адрес,
  // имя в обращении — только если это похоже на имя (без ссылок и прочего текста)
  if (overLimit('confirm:all', 30, 3600_000) || overLimit(`confirm:${to.toLowerCase()}`, 2, 24 * 3600_000)) return 'skip: limit'
  const first = lead.name ? String(lead.name).trim().split(/\s+/)[0] : ''
  const name = /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё-]{1,29}$/.test(first) ? first : ''
  const contacts = [
    c.phone && `Телефон: [${c.phone}](tel:${c.phone.replace(/[^\d+]/g, '')})`,
    c.telegramUrl && `Telegram: [написать](${c.telegramUrl})`,
    c.maxUrl && `MAX: [написать](${c.maxUrl})`,
    c.email && `Почта: [${c.email}](mailto:${c.email})`,
  ].filter(Boolean) as string[]
  const { html, text } = emailLayout({
    preheader: `Заявка №${lead.id} получена — свяжемся в течение часа в рабочее время`,
    title: name ? `${name}, спасибо за заявку!` : 'Спасибо за заявку!',
    paragraphs: [
      `Мы получили вашу заявку №${lead.id}${lead.service ? ` — ${lead.service}` : ''}.`,
      'Свяжемся с вами в течение часа в рабочее время: уточним задачу и назовём сроки и стоимость.',
    ],
    button: { href: `${SITE}/portfolio/`, text: 'Посмотреть наши работы' },
    after: [...(contacts.length ? ['Если удобнее написать самим:', ...contacts] : []), 'С уважением, Георгий Каляков, GeoBit'],
    footer: `Вы получили это письмо, потому что оставили заявку на сайте getgeobit.ru. Если это были не вы — просто проигнорируйте его.`,
  })
  try {
    await payload.sendEmail({ to, subject: `Заявка №${lead.id} получена — GeoBit`, html, text })
    return 'ok'
  } catch (e: any) {
    return `error: ${e?.message || e}`
  }
}

export async function notifyLead(payload: Payload, lead: Lead, leadEmail?: string, contacts: Contacts = {}): Promise<Result> {
  const short = `🔔 Новая заявка №${lead.id}${lead.service ? ` — ${lead.service}` : ''}\n${SITE}/admin/collections/leads/${lead.id}`
  const [e, t, m, cl] = await Promise.all([email(payload, leadEmail, lead), telegram(esc(short)), max(short), confirmClient(payload, lead, contacts)])
  return { email: e, telegram: t, max: m, client: cl }
}
