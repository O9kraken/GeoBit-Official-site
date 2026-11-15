import type { CollectionConfig, PayloadRequest } from 'payload'
import { can } from '../access/roles'
import { CITIES, NICHES } from '../lib/prospects/presets'
import { domainOf, type Found } from '../lib/prospects/normalize'
import { searchOsm } from '../lib/prospects/osm'
import { search2gis } from '../lib/prospects/dgis'
import { checkSite } from '../lib/prospects/sitecheck'

const deny = (msg = 'Нужно войти в админку', status = 401) => Response.json({ error: msg }, { status })

/** Поиск: тянем компании из источника, отбрасываем уже сохранённые (по id источника, телефону, домену), сохраняем новые */
async function runSearch(req: PayloadRequest) {
  if (!req.user) return deny()
  if (!can(req.user, 'admin', 'manager')) return deny('Нет доступа: раздел для менеджеров по продажам', 403)
  const sp = req.searchParams
  const source = sp.get('source') === '2gis' ? '2gis' : 'osm'
  const city = sp.get('city') || 'sevastopol'
  const niche = sp.get('niche') || ''
  const query = (sp.get('q') || '').slice(0, 80)
  const limit = Math.min(Number(sp.get('limit')) || 300, 1000)

  let found: Found[]
  try {
    if (source === '2gis') {
      const settings: any = await req.payload.findGlobal({ slug: 'settings', overrideAccess: true, depth: 0 })
      const key = process.env.DGIS_API_KEY || settings?.dgisApiKey
      if (!key) return deny('Нет ключа 2ГИС: «Настройки сайта» → «Заявки» → «Ключ 2ГИС Places API»', 400)
      found = await search2gis(key, city, niche, query, limit)
    } else {
      found = await searchOsm(city, niche, query, limit)
    }
  } catch (e: any) {
    return deny(e?.message || String(e), 502)
  }

  const existing = await req.payload.find({
    collection: 'prospects',
    limit: 20000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { sourceKey: true, phone: true, website: true } as any,
  })
  const keys = new Set<string>()
  for (const d of existing.docs as any[]) {
    if (d.sourceKey) keys.add(d.sourceKey)
    if (d.phone) keys.add(`tel:${d.phone}`)
    const dom = domainOf(d.website)
    if (dom) keys.add(`dom:${dom}`)
  }

  let created = 0
  let dup = 0
  const nicheLabel = NICHES[niche]?.label || query
  for (const f of found) {
    const k = [`${f.source}:${f.sourceId}`, f.phone ? `tel:${f.phone}` : '', domainOf(f.website) ? `dom:${domainOf(f.website)}` : ''].filter(Boolean)
    if (k.some((x) => keys.has(x))) {
      dup++
      continue
    }
    k.forEach((x) => keys.add(x))
    await req.payload.create({
      collection: 'prospects',
      overrideAccess: true,
      req,
      data: {
        name: f.name.slice(0, 200),
        niche: nicheLabel,
        category: f.category,
        city: CITIES[city]?.label,
        address: f.address,
        phone: f.phone,
        website: f.website,
        email: f.email,
        socials: f.socials,
        hours: f.hours,
        lat: f.lat,
        lon: f.lon,
        source: f.source,
        sourceKey: `${f.source}:${f.sourceId}`,
        status: 'new',
        siteStatus: 'unchecked',
      } as any,
    })
    created++
  }
  return Response.json({ ok: true, found: found.length, created, dup })
}

/** Проверка сайтов у ещё не проверенных компаний (порциями, по 6 параллельно) */
async function runCheck(req: PayloadRequest) {
  if (!req.user) return deny()
  if (!can(req.user, 'admin', 'manager')) return deny('Нет доступа: раздел для менеджеров по продажам', 403)
  const batch = Math.min(Number(req.searchParams.get('batch')) || 40, 100)
  const r = await req.payload.find({
    collection: 'prospects',
    where: { siteStatus: { equals: 'unchecked' } },
    limit: batch,
    depth: 0,
    overrideAccess: true,
  })
  const docs = r.docs as any[]
  let i = 0
  const worker = async () => {
    while (i < docs.length) {
      const d = docs[i++]
      const res = await checkSite(d.website, Boolean(d.socials)).catch((e) => ({ siteStatus: 'down' as const, score: 85, siteNotes: `Ошибка проверки: ${e?.message}` }))
      await req.payload.update({ collection: 'prospects', id: d.id, overrideAccess: true, req, data: { ...res, siteCheckedAt: new Date().toISOString() } as any })
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  const left = await req.payload.count({ collection: 'prospects', where: { siteStatus: { equals: 'unchecked' } }, overrideAccess: true })
  return Response.json({ ok: true, checked: docs.length, left: left.totalDocs })
}

/** Выгрузка в CSV (Excel открывает: UTF-8 с BOM, разделитель «;») — с теми же фильтрами, что в списке */
async function runExport(req: PayloadRequest) {
  if (!req.user) return deny()
  if (!can(req.user, 'admin', 'manager')) return deny('Нет доступа: раздел для менеджеров по продажам', 403)
  const where: any = {}
  const st = req.searchParams.get('status')
  if (st) where.status = { equals: st }
  const r = await req.payload.find({ collection: 'prospects', where, limit: 20000, pagination: false, depth: 0, sort: '-score', overrideAccess: true })
  const cols: [string, string][] = [
    ['name', 'Название'], ['niche', 'Сфера'], ['city', 'Город'], ['address', 'Адрес'], ['phone', 'Телефон'], ['email', 'Email'],
    ['website', 'Сайт'], ['socials', 'Соцсети'], ['siteStatus', 'Сайт: статус'], ['siteNotes', 'Сайт: что не так'], ['score', 'Оценка'],
    ['status', 'Статус работы'], ['note', 'Заметка'], ['source', 'Источник'],
  ]
  const cell = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [cols.map((c) => cell(c[1])).join(';'), ...(r.docs as any[]).map((d) => cols.map(([k]) => cell(d[k])).join(';'))]
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="geobit-clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}

const STATUS = [
  { label: 'Новый', value: 'new' },
  { label: 'Связались', value: 'contacted' },
  { label: 'Интересно', value: 'interested' },
  { label: 'КП отправлено', value: 'offer' },
  { label: 'Клиент', value: 'client' },
  { label: 'Отказ', value: 'rejected' },
  { label: 'Не подходит', value: 'skip' },
]

const SITE = [
  { label: 'Не проверен', value: 'unchecked' },
  { label: 'Нет сайта', value: 'none' },
  { label: 'Только соцсети', value: 'social' },
  { label: 'Не открывается', value: 'down' },
  { label: 'Устаревший', value: 'old' },
  { label: 'Слабый', value: 'weak' },
  { label: 'Нормальный', value: 'ok' },
]

/** Потенциальные клиенты: база компаний из открытых каталогов + проверка их сайтов */
export const Prospects: CollectionConfig = {
  slug: 'prospects',
  labels: { singular: 'Потенциальный клиент', plural: 'Поиск клиентов' },
  admin: {
    useAsTitle: 'name',
    group: 'Заявки',
    description:
      'Компании из OpenStreetMap и 2ГИС (официальный API). Сайт каждой проверяется автоматически: чем выше оценка, тем нужнее компании новый сайт. Звоните и пишите лично — массовые рассылки без согласия запрещены законом о рекламе.',
    defaultColumns: ['name', 'contacts', 'siteStatus', 'score', 'status'],
    listSearchableFields: ['name', 'phone', 'website', 'address'],
    pagination: { defaultLimit: 50 },
    components: { beforeListTable: ['/components/admin/prospects/Toolbar#ProspectsToolbar'] },
  },
  defaultSort: '-score',
  // доступ по ролям (админ и менеджер) навешивается в access/roles.ts
  endpoints: [
    { path: '/search', method: 'post', handler: runSearch },
    { path: '/check-sites', method: 'post', handler: runCheck },
    { path: '/export', method: 'get', handler: runExport },
  ],
  fields: [
    { name: 'contacts', label: 'Контакты', type: 'ui', admin: { components: { Cell: '/components/admin/prospects/Cells#ContactsCell', Field: '/components/admin/prospects/Cells#ContactsField' } } },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Название', type: 'text', required: true },
        { name: 'niche', label: 'Сфера', type: 'text' },
        { name: 'category', label: 'Категория в источнике', type: 'text', admin: { readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'city', label: 'Город', type: 'text' },
        { name: 'address', label: 'Адрес', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', label: 'Телефон', type: 'text', index: true },
        { name: 'email', label: 'Email', type: 'text' },
        { name: 'website', label: 'Сайт', type: 'text' },
      ],
    },
    { name: 'socials', label: 'Соцсети и мессенджеры', type: 'text' },
    { name: 'hours', label: 'Часы работы', type: 'text' },
    {
      type: 'collapsible',
      label: 'Проверка сайта',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'siteStatus', label: 'Сайт', type: 'select', defaultValue: 'unchecked', options: SITE, index: true, admin: { components: { Cell: '/components/admin/prospects/Cells#SiteCell' } } },
            { name: 'score', label: 'Оценка', type: 'number', index: true, defaultValue: -1, admin: { description: '0–100: чем выше, тем нужнее компании новый сайт (−1 — ещё не проверен)', components: { Cell: '/components/admin/prospects/Cells#ScoreCell' } } },
          ],
        },
        { name: 'siteNotes', label: 'Что не так с сайтом', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'siteTitle', label: 'Заголовок сайта', type: 'text', admin: { readOnly: true } },
            { name: 'siteFinalUrl', label: 'Куда ведёт', type: 'text', admin: { readOnly: true } },
            { name: 'siteMs', label: 'Загрузка, мс', type: 'number', admin: { readOnly: true } },
          ],
        },
        { name: 'siteCheckedAt', label: 'Проверен', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    { name: 'status', label: 'Статус работы', type: 'select', defaultValue: 'new', options: STATUS, index: true, admin: { position: 'sidebar', components: { Cell: '/components/admin/prospects/Cells#WorkCell' } } },
    { name: 'nextAt', label: 'Следующий контакт', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'note', label: 'Заметка', type: 'textarea', admin: { position: 'sidebar', description: 'Что обсуждали, кто ЛПР, что предложить' } },
    {
      type: 'collapsible',
      label: 'Источник',
      admin: { initCollapsed: true },
      fields: [
        { name: 'source', label: 'Откуда', type: 'select', options: [{ label: 'OpenStreetMap', value: 'osm' }, { label: '2ГИС API', value: '2gis' }, { label: 'Вручную', value: 'manual' }], defaultValue: 'manual' },
        { name: 'sourceKey', label: 'ID в источнике', type: 'text', index: true, admin: { readOnly: true } },
        { type: 'row', fields: [{ name: 'lat', label: 'Широта', type: 'number' }, { name: 'lon', label: 'Долгота', type: 'number' }] },
      ],
    },
  ],
}
