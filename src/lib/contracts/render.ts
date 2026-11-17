import { plural, rub, rubFull } from './money'

/* Сборка договора: переменные из карточки договора и реквизитов исполнителя → модель документа,
   из которой одинаково строятся Word-файл и страница на сайте. */

export type ClientType = 'company' | 'ip' | 'person'
export type Pay = 'prepay100' | 'half' | 'thirds' | 'monthly'

export type Clause = { kind: 'num' | 'bullet' | 'para'; no?: string; text: string }
export type DocSection = { no: number; title: string; clauses: Clause[] }
export type DocModel = {
  title: string
  subtitle: string
  number: string
  city: string
  date: string
  preamble: string
  sections: DocSection[]
  parties: { executor: { title: string; lines: string[]; sign: string }; client: { title: string; lines: string[]; sign: string } }
  appendix: { title: string; scope: string[]; terms: string[]; payments: string[] }
  draft: boolean
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
export const dateRu = (d?: string | Date | null) => {
  const x = d ? new Date(d) : new Date()
  const m = new Date(x.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }))
  return `«${String(m.getDate()).padStart(2, '0')}» ${MONTHS[m.getMonth()]} ${m.getFullYear()} г.`
}

/** «Иванов Иван Иванович» → «Иванов И. И.» */
export const initials = (fio?: string | null) => {
  const p = String(fio || '').trim().split(/\s+/).filter(Boolean)
  if (p.length < 2) return p[0] || ''
  return `${p[0]} ${p.slice(1).map((x) => `${x[0].toUpperCase()}.`).join(' ')}`
}

const n = (v: any, d: number) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : d)

/** Условия {{#flag}}…{{/flag}} и {{^flag}}…{{/flag}}; вложенность — с разными именами */
export function resolveConditions(text: string, flags: Record<string, any>): string {
  const re = /\{\{([#^])(\w+)\}\}([\s\S]*?)\{\{\/\2\}\}/
  let s = String(text || '')
  for (let i = 0; i < 200; i++) {
    const m = s.match(re)
    if (!m) break
    const on = Boolean(flags[m[2]])
    const keep = m[1] === '#' ? on : !on
    s = s.slice(0, m.index!) + (keep ? m[3] : '') + s.slice(m.index! + m[0].length)
  }
  return s
}

export const fillVars = (text: string, vars: Record<string, any>) =>
  String(text || '').replace(/\{\{(\w+)\}\}/g, (all, k) => (vars[k] !== undefined && vars[k] !== null && vars[k] !== '' ? String(vars[k]) : k in vars ? '' : all))

/** Чистим текст раздела: убираем пустые строки, которые остались после условий */
export const tidy = (s: string) =>
  s
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/g, '').replace(/ {2,}/g, ' '))
    .filter((l) => l.trim() && !/^[-–>]\s*;?\s*$/.test(l.trim()))
    .join('\n')

export function buildContext(c: any, settings: any, tpl?: any) {
  const kind: string = c.kind || tpl?.kind || 'dev'
  const type: ClientType = c.clientType || 'company'
  const t = c.terms || {}
  const pay: Pay = kind === 'seo' ? 'monthly' : t.payment || 'half'
  const price = n(t.price, 0)
  const parts =
    pay === 'half' ? [price / 2, price - Math.round(price / 2)] : pay === 'thirds' ? [Math.round(price * 0.4), Math.round(price * 0.3), price - Math.round(price * 0.4) - Math.round(price * 0.3)] : [price]
  const revisions = n(t.revisions, n(settings?.revisions, 2))
  const concepts = n(t.concepts, 3)
  const minMonths = n(t.minMonths, 3)
  const vars: Record<string, any> = {
    number: c.number || 'б/н',
    date: dateRu(c.date),
    city: settings?.city || 'Севастополь',
    service: c.serviceTitle || '',
    subject: tpl?.subject || c.subject || 'выполнению работ',
    plan: t.plan || '',
    price: rub(price),
    priceFull: rubFull(price),
    part1: parts[0] !== undefined ? rub(parts[0]) : '',
    part2: parts[1] !== undefined ? rub(parts[1]) : '',
    part3: parts[2] !== undefined ? rub(parts[2]) : '',
    days: n(t.days, 14),
    revisions,
    revisionsWord: plural(revisions, 'круг', 'круга', 'кругов'),
    warranty: n(t.warrantyDays, n(settings?.warrantyDays, 30)),
    acceptDays: n(settings?.acceptDays, 5),
    penalty: String(n(settings?.penalty, 0.1)).replace('.', ','),
    penaltyCap: n(settings?.penaltyCap, 10),
    concepts,
    conceptsWord: plural(concepts, 'концепция', 'концепции', 'концепций'),
    minMonths,
    minMonthsWord: plural(minMonths, 'месяц', 'месяца', 'месяцев'),
    site: t.site || '',
    support: t.supportMonths ? n(t.supportMonths, 0) : '',
    extra: t.extra || '',
  }
  const flags: Record<string, any> = {
    ...vars,
    company: type === 'company',
    ip: type === 'ip',
    person: type === 'person',
    biz: type !== 'person',
    [pay]: true,
    clientHosting: (t.hosting || 'client') === 'client',
    execHosting: t.hosting === 'executor',
    contentClient: (t.content || 'client') === 'client',
    contentExec: t.content === 'executor',
    dev: kind === 'dev',
    seo: kind === 'seo',
    design: kind === 'design',
    credit: t.credit !== false,
    passport: Boolean(c.client?.passport),
  }
  return { vars, flags, kind, type, pay, price, parts }
}

/** Текст раздела шаблона → текст раздела договора: условия раскрыты, {{переменные}} остаются живыми */
export const sectionFromTemplate = (body: string, flags: Record<string, any>) => tidy(resolveConditions(body, flags))

const nb = (x: string) => x.replace(/№ (?=[\dА-Яа-я])/g, '№\u00a0').replace(/ (—|–) /g, '\u00a0$1 ')

function clauses(no: number, body: string, vars: Record<string, any>): Clause[] {
  const out: Clause[] = []
  let k = 0
  for (const raw of tidy(nb(fillVars(body, vars))).split('\n')) {
    const l = raw.trim()
    if (/^[-–•]\s+/.test(l)) out.push({ kind: 'bullet', text: l.replace(/^[-–•]\s+/, '') })
    else if (/^>\s*/.test(l)) out.push({ kind: 'para', text: l.replace(/^>\s*/, '') })
    else out.push({ kind: 'num', no: `${no}.${++k}.`, text: l.replace(/^\d+(\.\d+)*\.?\s+/, '') })
  }
  return out
}

function clientParty(c: any, type: ClientType) {
  const k = c.client || {}
  const lines: string[] = []
  let title = k.name || '—'
  let preamble = title
  let sign = initials(k.name)
  if (type === 'company') {
    preamble = `${k.name || '________________'}${k.inn ? `, ИНН ${k.inn}` : ''}, в лице ${k.signerGen || '________________'}, действующего на основании ${k.basis || 'Устава'}`
    sign = initials(k.signer) || '________________'
    if (k.inn) lines.push(`ИНН ${k.inn}${k.kpp ? ` / КПП ${k.kpp}` : ''}`)
    if (k.ogrn) lines.push(`ОГРН ${k.ogrn}`)
  } else if (type === 'ip') {
    title = `ИП ${k.name || ''}`.trim()
    preamble = `Индивидуальный предприниматель ${k.name || '________________'}${k.inn ? `, ИНН ${k.inn}` : ''}${k.ogrn ? `, ОГРНИП ${k.ogrn}` : ''}`
    if (k.inn) lines.push(`ИНН ${k.inn}`)
    if (k.ogrn) lines.push(`ОГРНИП ${k.ogrn}`)
  } else {
    preamble = `${k.name || '________________'}`
    if (k.passport) lines.push(`Паспорт: ${k.passport}`)
  }
  if (k.address) lines.push(`${type === 'person' ? 'Адрес регистрации' : 'Адрес'}: ${k.address}`)
  if (k.bankAccount) lines.push(`Р/с ${k.bankAccount}`)
  if (k.bankName) lines.push(`Банк: ${k.bankName}`)
  if (k.bik) lines.push(`БИК ${k.bik}${k.corrAccount ? `, к/с ${k.corrAccount}` : ''}`)
  if (k.phone) lines.push(`Телефон: ${k.phone}`)
  if (k.email) lines.push(`Эл. почта: ${k.email}`)
  return { title, lines, sign, preamble }
}

function executorParty(s: any) {
  const lines: string[] = ['Плательщик налога на профессиональный доход (самозанятый)']
  if (s?.inn) lines.push(`ИНН ${s.inn}`)
  if (s?.address) lines.push(`Адрес: ${s.address}`)
  if (s?.bankAccount) lines.push(`Р/с ${s.bankAccount}`)
  if (s?.bankName) lines.push(`Банк: ${s.bankName}`)
  if (s?.bik) lines.push(`БИК ${s.bik}${s.corrAccount ? `, к/с ${s.corrAccount}` : ''}`)
  if (s?.phone) lines.push(`Телефон: ${s.phone}`)
  if (s?.email) lines.push(`Эл. почта: ${s.email}`)
  if (s?.site) lines.push(`Сайт: ${s.site}`)
  return { title: s?.fio || 'Исполнитель', lines, sign: initials(s?.fio) || '________________' }
}

export function buildModel(c: any, settings: any, tpl?: any): DocModel {
  const { vars, kind, type, pay, parts } = buildContext(c, settings, tpl)
  const sections: DocSection[] = (c.sections || [])
    .filter((s: any) => s?.title || s?.body)
    .map((s: any, i: number) => ({ no: i + 1, title: s.title || '', clauses: clauses(i + 1, s.body || '', vars) }))
  sections.push({ no: sections.length + 1, title: 'Реквизиты и подписи Сторон', clauses: [] })

  const client = clientParty(c, type)
  const executor = executorParty(settings)
  const preamble = `${settings?.fio || '________________'}${settings?.inn ? `, ИНН ${settings.inn}` : ''}, применяющий специальный налоговый режим «Налог на профессиональный доход» (далее — «Исполнитель»), с одной стороны, и ${client.preamble} (далее — «Заказчик»), с другой стороны, вместе именуемые «Стороны», заключили настоящий договор (далее — «Договор») о нижеследующем:`

  const terms: string[] = []
  if (kind === 'seo') {
    terms.push(`Стоимость услуг: ${vars.priceFull} в месяц.`)
    terms.push(`Минимальный срок договора: ${vars.minMonths} ${vars.minMonthsWord}.`)
    if (vars.site) terms.push(`Продвигаемый сайт: ${vars.site}.`)
  } else {
    terms.push(`Стоимость работ: ${vars.priceFull}.`)
    terms.push(`Срок выполнения: ${vars.days} рабочих дней.`)
    terms.push(`Правки: ${vars.revisions} ${vars.revisionsWord} на ${kind === 'design' ? 'выбранную концепцию' : 'каждом этапе'}.`)
    if (kind === 'design') terms.push(`Концепций на выбор: ${vars.concepts}.`)
    else terms.push(`Гарантия: ${vars.warranty} календарных дней после подписания Акта.`)
  }
  const payments: string[] =
    pay === 'monthly'
      ? [`Ежемесячно авансом: ${vars.price} — в течение 5 рабочих дней с начала отчётного периода.`]
      : pay === 'prepay100'
        ? [`100 % — ${vars.price} — в течение 3 рабочих дней после подписания Договора.`]
        : pay === 'half'
          ? [`Предоплата 50 % — ${vars.part1} — в течение 3 рабочих дней после подписания Договора.`, `Остаток 50 % — ${vars.part2} — в течение 3 рабочих дней после подписания Акта.`]
          : [
              `Предоплата 40 % — ${vars.part1} — в течение 3 рабочих дней после подписания Договора.`,
              `30 % — ${vars.part2} — после согласования ${kind === 'design' ? 'выбранной концепции' : 'дизайн-макета'}.`,
              `30 % — ${vars.part3} — после подписания Акта.`,
            ]
  void parts

  const scope = tidy(fillVars(c.scope || '', vars))
    .split('\n')
    .map((x) => x.replace(/^[-–•\d.)\s]+/, '').trim())
    .filter(Boolean)

  return {
    title: `ДОГОВОР № ${vars.number}`,
    subtitle: c.docTitle || tpl?.docTitle || '',
    number: String(vars.number),
    city: vars.city,
    date: vars.date,
    preamble: nb(preamble),
    sections,
    parties: { executor, client: { title: client.title, lines: client.lines, sign: client.sign } },
    appendix: { title: `Приложение № 1 к Договору № ${vars.number} от ${vars.date}`, scope, terms, payments },
    draft: (c.status || 'draft') === 'draft',
  }
}
