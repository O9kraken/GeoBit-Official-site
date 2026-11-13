/**
 * Фирменный шаблон писем GeoBit: подстраивается под светлую/тёмную тему почтового клиента.
 * Логотип: logo.png (чёрные «eo» с белой обводкой — виден на любом фоне, в т.ч. при
 * автоперекраске Gmail), logo-dark.png (белые «eo») подставляется в тёмной теме.
 * Вёрстка таблицами и inline-стилями — так письмо одинаково выглядит в Gmail, Яндекс Почте,
 * Mail.ru, Outlook и Apple Mail. Для каждого письма собирается и текстовая версия:
 * письма только с HTML спам-фильтры оценивают хуже.
 */

export const SITE = (process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
const HOST = SITE.replace(/^https?:\/\//, '')

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Светлая тема — по умолчанию; тёмная включается медиазапросом в почтовиках, которые его понимают */
const L = { page: '#f3f2f8', card: '#ffffff', line: '#e7e4f0', text: '#16141f', muted: '#6b6880', link: '#6d28d9', foot: '#8a879a' }
const D = { page: '#080808', card: '#100e1a', line: '#241e38', text: '#ececf3', muted: '#9a97ab', link: '#00d4ff', foot: '#7c798e' }
const ACCENT = '#7c00ff'
const GRAD = 'linear-gradient(90deg,#ff0066,#7c00ff 55%,#00d4ff)'
const FONT = "'Unbounded','Segoe UI',Arial,Helvetica,sans-serif"
const BODY = FONT

export type EmailRow = [label: string, value: string | undefined | null]

type Layout = {
  /** Скрытая строка-превью в списке писем */
  preheader: string
  title: string
  /** Абзацы — обычный текст, экранируется; ссылки вида [текст](url) */
  paragraphs?: string[]
  /** Таблица «поле — значение» (заявка) */
  rows?: EmailRow[]
  button?: { href: string; text: string }
  /** Строки после кнопки */
  after?: string[]
  footer: string
}

const md = (s: string) =>
  esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}" class="gb-link" style="color:${L.link};text-decoration:none">${t}</a>`)
const mdText = (s: string) => s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => (u.startsWith('tel:') || u.startsWith('mailto:') ? t : `${t}: ${u}`))

export function emailLayout(l: Layout): { html: string; text: string } {
  const p = (html: string, extra = '') =>
    `<p class="gb-text" style="margin:0 0 14px;font-family:${BODY};font-size:14px;line-height:1.65;color:${L.text}${extra}">${html}</p>`
  const rows = (l.rows || []).filter(([, v]) => v != null && String(v).trim() !== '')
  const td = (extra: string) => `border-top:1px solid ${L.line};font-family:${BODY};vertical-align:top;${extra}`
  const table = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;border-collapse:collapse">${rows
        .map(
          ([k, v]) =>
            `<tr><td class="gb-line gb-muted" style="${td(`padding:11px 14px 11px 0;font-size:12px;color:${L.muted};white-space:nowrap`)}">${esc(k)}</td><td class="gb-line gb-text" style="${td(`padding:11px 0;font-size:14px;color:${L.text}`)}">${esc(v).replace(/\n/g, '<br>')}</td></tr>`,
        )
        .join('')}</table>`
    : ''
  const button = l.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td bgcolor="${ACCENT}" style="border-radius:12px;background:${ACCENT};background-image:${GRAD}"><a href="${l.button.href}" style="display:inline-block;padding:15px 28px;font-family:${FONT};font-size:13px;font-weight:600;letter-spacing:.2px;color:#ffffff;text-decoration:none;border-radius:12px">${esc(l.button.text)}</a></td></tr></table>`
    : ''
  const logo = (cls: string, file: string, hidden = false) =>
    `<img class="${cls}" src="${SITE}/email/${file}" width="150" height="52" alt="GeoBit" style="${hidden ? 'display:none;mso-hide:all;max-height:0;overflow:hidden;' : 'display:block;'}border:0;width:150px;height:52px">`

  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${esc(l.title)}</title>
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
@media (prefers-color-scheme: dark){
  .gb-page{background:${D.page}!important}
  .gb-card{background:${D.card}!important;border-color:${D.line}!important}
  .gb-text{color:${D.text}!important}
  .gb-title{color:#ffffff!important}
  .gb-muted{color:${D.muted}!important}
  .gb-line{border-color:${D.line}!important}
  .gb-link{color:${D.link}!important}
  .gb-foot{color:${D.foot}!important}
  .gb-logo-light{display:none!important}
  .gb-logo-dark{display:block!important;max-height:none!important}
}
[data-ogsc] .gb-text{color:${D.text}!important}
[data-ogsc] .gb-title{color:#ffffff!important}
[data-ogsc] .gb-link{color:${D.link}!important}
[data-ogsc] .gb-logo-light{display:none!important}
[data-ogsc] .gb-logo-dark{display:block!important;max-height:none!important}
[data-ogsb] .gb-page{background:${D.page}!important}
[data-ogsb] .gb-card{background:${D.card}!important}
</style>
</head>
<body class="gb-page" style="margin:0;padding:0;background:${L.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(l.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" class="gb-page" width="100%" cellpadding="0" cellspacing="0" bgcolor="${L.page}" style="background:${L.page}">
<tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 20px"><a href="${SITE}" style="text-decoration:none">${logo('gb-logo-light', 'logo.png')}${logo('gb-logo-dark', 'logo-dark.png', true)}</a></td></tr>
<tr><td class="gb-card" bgcolor="${L.card}" style="background:${L.card};border:1px solid ${L.line};border-radius:20px;overflow:hidden">
<div style="height:4px;line-height:4px;font-size:0;background:${ACCENT};background-image:${GRAD}">&nbsp;</div>
<div style="padding:30px 28px 16px">
<h1 class="gb-title" style="margin:0 0 18px;font-family:${FONT};font-size:21px;line-height:1.3;font-weight:700;color:${L.text}">${esc(l.title)}</h1>
${(l.paragraphs || []).map((s) => p(md(s))).join('\n')}
${table}${button}
${(l.after || []).map((s) => p(md(s), ';margin-bottom:8px')).join('\n')}
<div style="height:8px;line-height:8px;font-size:0">&nbsp;</div>
</div></td></tr>
<tr><td class="gb-foot" style="padding:18px 6px 0;font-family:${BODY};font-size:11px;line-height:1.7;color:${L.foot}">${md(l.footer)}<br>GeoBit — разработка сайтов · <a href="${SITE}" class="gb-foot" style="color:${L.foot};text-decoration:underline">${HOST}</a></td></tr>
</table>
</td></tr></table>
</body></html>`

  const text = [
    l.title,
    '',
    ...(l.paragraphs || []).map(mdText),
    ...(rows.length ? ['', ...rows.map(([k, v]) => `${k}: ${String(v)}`)] : []),
    ...(l.button ? ['', `${l.button.text}: ${l.button.href}`] : []),
    ...(l.after?.length ? ['', ...l.after.map(mdText)] : []),
    '',
    '—',
    mdText(l.footer),
    `GeoBit — разработка сайтов · ${SITE}`,
  ].join('\n')

  return { html, text }
}
