import type { CollectionConfig, PayloadRequest } from 'payload'
import { randomBytes } from 'node:crypto'
import { can } from '../access/roles'
import { SEEDS, KIND_FALLBACK, kindOfSlug } from '../lib/contracts/defaults'
import { buildContext, buildModel, fillVars, sectionFromTemplate } from '../lib/contracts/render'
import { contractDocx } from '../lib/contracts/docx'

const deny = (msg = 'Нужно войти в админку', status = 401) => Response.json({ error: msg }, { status })
const sales = (req: PayloadRequest) => req.user && can(req.user, 'admin', 'manager')

const VARS_HELP =
  'Каждая строка — пункт (номер ставится сам), «- » в начале — подпункт списка, «> » — абзац без номера. Подстановки: {{price}}, {{priceFull}}, {{part1}}–{{part3}}, {{days}}, {{revisions}} {{revisionsWord}}, {{warranty}}, {{acceptDays}}, {{penalty}}, {{penaltyCap}}, {{concepts}}, {{minMonths}}, {{site}}, {{plan}}, {{support}}, {{city}}. Условия: {{#person}}…{{/person}} (физлицо), {{#biz}}…{{/biz}} (юрлицо или ИП), {{#company}}, {{#ip}}, {{#prepay100}}, {{#half}}, {{#thirds}}, {{#clientHosting}}, {{#execHosting}}, {{#contentClient}}, {{#contentExec}}, {{^условие}} — «если нет».'

const KINDS = [
  { label: 'Разработка сайта', value: 'dev' },
  { label: 'SEO-продвижение', value: 'seo' },
  { label: 'Дизайн, логотип, стиль', value: 'design' },
]

/* ----------------------------- шаблоны ----------------------------- */

async function seedTemplates(req: PayloadRequest) {
  if (!sales(req)) return deny()
  const p = req.payload
  const services = await p.find({ collection: 'services', limit: 100, depth: 0, overrideAccess: true, pagination: false })
  const existing = await p.find({ collection: 'contract-templates' as any, limit: 200, depth: 0, overrideAccess: true, pagination: false })
  const covered = new Set<number | string>()
  for (const t of existing.docs as any[]) for (const s of t.services || []) covered.add(typeof s === 'object' ? s.id : s)
  let created = 0
  for (const s of services.docs as any[]) {
    if (covered.has(s.id)) continue
    const seed = SEEDS.find((x) => x.slugs.includes(s.slug)) || { ...KIND_FALLBACK[kindOfSlug(s.slug)], title: `Договор: ${s.title}` }
    await p.create({
      collection: 'contract-templates' as any,
      data: { title: seed.title, kind: seed.kind, services: [s.id], docTitle: seed.docTitle, subject: seed.subject, scope: seed.scope, sections: seed.sections } as any,
      overrideAccess: true,
      req,
    })
    created++
  }
  return Response.json({ created, total: existing.totalDocs + created })
}

export const ContractTemplates: CollectionConfig = {
  slug: 'contract-templates',
  labels: { singular: 'Шаблон договора', plural: 'Шаблоны договоров' },
  admin: {
    group: 'Продажи',
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'services', 'updatedAt'],
    description: 'Тексты договоров под каждую услугу. Правки здесь попадут во все новые договоры; уже составленные договоры не меняются.',
    components: { beforeListTable: ['/components/admin/contracts/Toolbar#TemplatesToolbar'] },
  },
  access: { read: ({ req }) => Boolean(req.user) },
  endpoints: [{ path: '/seed', method: 'post', handler: seedTemplates }],
  fields: [
    { type: 'row', fields: [
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'kind', label: 'Вид договора', type: 'select', options: KINDS, defaultValue: 'dev', required: true },
    ] },
    { name: 'services', label: 'Для каких услуг', type: 'relationship', relationTo: 'services', hasMany: true, admin: { description: 'Квиз подберёт этот шаблон, когда выбрана одна из этих услуг' } },
    { type: 'row', fields: [
      { name: 'docTitle', label: 'Подзаголовок договора', type: 'text', admin: { description: 'Под «ДОГОВОР № …», например: «на разработку сайта»' } },
      { name: 'subject', label: 'Предмет (для фразы «работы по …»)', type: 'text', admin: { description: 'Например: «разработке корпоративного сайта»' } },
    ] },
    { name: 'scope', label: 'Состав работ по умолчанию (Приложение № 1)', type: 'textarea', admin: { rows: 10, description: 'Каждая строка — пункт технического задания. В договоре его можно поправить под клиента.' } },
    {
      name: 'sections',
      label: 'Разделы договора',
      labels: { singular: 'Раздел', plural: 'Разделы' },
      type: 'array',
      admin: { initCollapsed: true, components: { RowLabel: '/components/admin/contracts/Actions#SectionLabel' } },
      fields: [
        { name: 'title', label: 'Заголовок раздела', type: 'text', required: true },
        { name: 'body', label: 'Текст', type: 'textarea', admin: { rows: 12, description: VARS_HELP } },
      ],
    },
  ],
}

/* ----------------------------- договоры ----------------------------- */

const num = (s: any) => {
  const m = String(s ?? '').replace(/\s| /g, '').match(/\d+/)
  return m ? Number(m[0]) : 0
}

async function templateFor(req: PayloadRequest, serviceId: any, kind?: string) {
  const p = req.payload
  let r = await p.find({ collection: 'contract-templates' as any, where: { services: { in: [serviceId] } }, limit: 1, depth: 0, overrideAccess: true })
  if (!r.docs.length) {
    await seedTemplates(req)
    r = await p.find({ collection: 'contract-templates' as any, where: { services: { in: [serviceId] } }, limit: 1, depth: 0, overrideAccess: true })
  }
  if (!r.docs.length && kind) r = await p.find({ collection: 'contract-templates' as any, where: { kind: { equals: kind } }, limit: 1, depth: 0, overrideAccess: true })
  return r.docs[0] as any
}

/** Разделы и техзадание из шаблона под условия договора: условия раскрыты, переменные остаются живыми */
function fromTemplate(tpl: any, contract: any, settings: any, planFeatures?: string) {
  const { flags } = buildContext(contract, settings, tpl)
  const sections = (tpl?.sections || []).map((s: any) => ({ title: s.title, body: fillVars(sectionFromTemplate(s.body || '', flags), { subject: tpl.subject || '' }) }))
  let scope = String(tpl?.scope || '')
  if (planFeatures && contract.terms?.plan) {
    const items = planFeatures
      .split('\n')
      .map((x) => x.trim().replace(/[.;]$/, ''))
      .filter(Boolean)
      .map((x) => (/^\p{Lu}\p{Ll}/u.test(x) ? x[0].toLowerCase() + x.slice(1) : x))
    if (items.length) scope += `\nСостав тарифа «${contract.terms.plan}»: ${items.join('; ')}.`
  }
  return { sections, scope, docTitle: tpl?.docTitle || '', kind: tpl?.kind || 'dev' }
}

async function quizData(req: PayloadRequest) {
  if (!sales(req)) return deny()
  const p = req.payload
  const [services, settings, leads, prospects] = await Promise.all([
    p.find({ collection: 'services', limit: 100, depth: 0, overrideAccess: true, pagination: false, sort: 'order' }),
    p.findGlobal({ slug: 'contract-settings' as any, overrideAccess: true, depth: 0 }).catch(() => ({})),
    p.find({ collection: 'leads', where: { status: { not_equals: 'spam' } }, sort: '-createdAt', limit: 30, depth: 0, overrideAccess: true }),
    p.find({ collection: 'prospects', where: { status: { in: ['interested', 'offer', 'client', 'contacted'] } }, sort: '-updatedAt', limit: 30, depth: 0, overrideAccess: true }),
  ])
  return Response.json({
    services: (services.docs as any[]).map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      kind: kindOfSlug(s.slug),
      price: num(s.price),
      days: /дн/.test(String(s.duration || '')) ? num(s.duration) : null,
      plans: (s.plans || []).map((x: any) => ({ name: x.name, price: num(x.price), features: x.features || '' })),
    })),
    settings,
    clients: [
      ...(leads.docs as any[]).map((l) => ({ key: `lead:${l.id}`, from: 'Заявка', id: l.id, name: l.name || `Заявка №${l.id}`, phone: l.phone || '', email: l.email || '' })),
      ...(prospects.docs as any[]).map((x) => ({ key: `prospect:${x.id}`, from: 'Клиент', id: x.id, name: x.name, phone: x.phone || '', email: x.email || '', address: [x.city, x.address].filter(Boolean).join(', '), site: x.website || '' })),
    ],
  })
}

async function quizCreate(req: PayloadRequest) {
  if (!sales(req)) return deny()
  const body: any = (await req.json?.().catch(() => null)) || {}
  const p = req.payload
  const service: any = body.service ? await p.findByID({ collection: 'services', id: body.service, depth: 0, overrideAccess: true }).catch(() => null) : null
  if (!service) return deny('Выберите услугу', 400)
  const settings: any = await p.findGlobal({ slug: 'contract-settings' as any, overrideAccess: true, depth: 0 }).catch(() => ({}))
  const kind = kindOfSlug(service.slug)
  const tpl = await templateFor(req, service.id, kind)
  if (!tpl) return deny('Нет шаблона договора для этой услуги', 400)
  const plan = (service.plans || []).find((x: any) => x.name === body.terms?.plan)
  const draft: any = {
    status: 'draft',
    date: new Date().toISOString(),
    service: service.id,
    template: tpl.id,
    clientType: ['company', 'ip', 'person'].includes(body.clientType) ? body.clientType : 'company',
    client: body.client || {},
    terms: body.terms || {},
    ...(body.lead ? { lead: Number(body.lead) } : {}),
    ...(body.prospect ? { prospect: Number(body.prospect) } : {}),
  }
  const gen = fromTemplate(tpl, { ...draft, kind }, settings, plan?.features)
  const doc = await p.create({ collection: 'contracts' as any, data: { ...draft, ...gen } as any, overrideAccess: true, req })
  return Response.json({ id: doc.id })
}

async function regenerate(req: PayloadRequest) {
  if (!sales(req)) return deny()
  const id = req.routeParams?.id as string
  const p = req.payload
  const c: any = await p.findByID({ collection: 'contracts' as any, id, depth: 0, overrideAccess: true })
  const settings: any = await p.findGlobal({ slug: 'contract-settings' as any, overrideAccess: true, depth: 0 }).catch(() => ({}))
  const service: any = c.service ? await p.findByID({ collection: 'services', id: c.service, depth: 0, overrideAccess: true }).catch(() => null) : null
  const tpl: any = c.template ? await p.findByID({ collection: 'contract-templates' as any, id: c.template, depth: 0, overrideAccess: true }).catch(() => null) : await templateFor(req, c.service, c.kind)
  if (!tpl) return deny('Шаблон договора не найден', 400)
  const plan = (service?.plans || []).find((x: any) => x.name === c.terms?.plan)
  const gen = fromTemplate(tpl, c, settings, plan?.features)
  await p.update({ collection: 'contracts' as any, id, data: { ...gen, template: tpl.id } as any, overrideAccess: true, req })
  return Response.json({ ok: true })
}

async function loadModel(req: PayloadRequest, where: any) {
  const p = req.payload
  const r = await p.find({ collection: 'contracts' as any, where, limit: 1, depth: 0, overrideAccess: true })
  const c: any = r.docs[0]
  if (!c) return null
  const settings: any = await p.findGlobal({ slug: 'contract-settings' as any, overrideAccess: true, depth: 0 }).catch(() => ({}))
  return { c, model: buildModel(c, settings) }
}

const fileName = (c: any) => `Договор_${String(c.number || c.id).replace(/[^\p{L}\p{N}-]+/gu, '_')}_${String(c.client?.name || '').replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40)}.docx`

async function sendDocx(c: any, model: any) {
  const buf = await contractDocx(model)
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="contract.docx"; filename*=UTF-8''${encodeURIComponent(fileName(c))}`,
      'Cache-Control': 'no-store',
    },
  })
}

async function docxById(req: PayloadRequest) {
  if (!sales(req)) return deny()
  const got = await loadModel(req, { id: { equals: req.routeParams?.id } })
  if (!got) return deny('Договор не найден', 404)
  return sendDocx(got.c, got.model)
}

async function docxByToken(req: PayloadRequest) {
  const token = String(req.routeParams?.token || '')
  if (!/^[a-f0-9]{32}$/.test(token)) return deny('Не найдено', 404)
  const got = await loadModel(req, { token: { equals: token } })
  if (!got || got.c.status === 'cancelled') return deny('Не найдено', 404)
  return sendDocx(got.c, got.model)
}

export const STATUSES = [
  { label: 'Черновик', value: 'draft' },
  { label: 'Отправлен клиенту', value: 'sent' },
  { label: 'Подписан', value: 'signed' },
  { label: 'Исполнен', value: 'done' },
  { label: 'Отменён', value: 'cancelled' },
]

export const Contracts: CollectionConfig = {
  slug: 'contracts',
  labels: { singular: 'Договор', plural: 'Договоры' },
  admin: {
    group: 'Продажи',
    useAsTitle: 'number',
    defaultColumns: ['number', 'customer', 'service', 'status', 'docs', 'date'],
    listSearchableFields: ['number', 'customer'],
    description: 'Договоры с клиентами. Новый договор удобнее всего составлять кнопкой «Составить договор» — квиз задаст вопросы и подставит нужный шаблон.',
    components: { beforeListTable: ['/components/admin/contracts/Toolbar#ContractsToolbar'] },
  },
  defaultSort: '-createdAt',
  endpoints: [
    { path: '/quiz', method: 'get', handler: quizData },
    { path: '/quiz', method: 'post', handler: quizCreate },
    { path: '/:id/regenerate', method: 'post', handler: regenerate },
    { path: '/:id/docx', method: 'get', handler: docxById },
    { path: '/doc/:token/docx', method: 'get', handler: docxByToken },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        if (operation === 'create') {
          if (!data.token) data.token = randomBytes(16).toString('hex')
          if (!data.number) {
            const year = new Date().getFullYear()
            const r = await req.payload.count({ collection: 'contracts' as any, where: { number: { contains: `ГБ-${year}-` } }, overrideAccess: true })
            data.number = `ГБ-${year}-${String(r.totalDocs + 1).padStart(3, '0')}`
          }
        }
        const client = data.client ?? originalDoc?.client
        const type = data.clientType ?? originalDoc?.clientType
        if (client) data.customer = type === 'ip' ? `ИП ${client.name || ''}`.trim() : client.name || ''
        return data
      },
    ],
  },
  fields: [
    { name: 'docs', label: 'Документ', type: 'ui', admin: { disableBulkEdit: true, components: { Field: '/components/admin/contracts/Actions#ContractActions', Cell: '/components/admin/contracts/Actions#ContractCell' } } },
    { type: 'row', fields: [
      { name: 'number', label: 'Номер', type: 'text', admin: { description: 'Ставится сам: ГБ-год-порядковый' } },
      { name: 'date', label: 'Дата договора', type: 'date', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
      { name: 'customer', label: 'Заказчик', type: 'text', admin: { readOnly: true } },
    ] },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Заказчик',
          fields: [
            { name: 'clientType', label: 'Кто заказчик', type: 'radio', defaultValue: 'company', options: [
              { label: 'Юрлицо (ООО, АО …)', value: 'company' },
              { label: 'ИП', value: 'ip' },
              { label: 'Физлицо', value: 'person' },
            ], admin: { layout: 'horizontal', description: 'После смены типа нажмите «Пересобрать из шаблона»: для физлица в договоре другие условия (защита прав потребителей)' } },
            {
              name: 'client',
              label: false,
              type: 'group',
              fields: [
                { type: 'row', fields: [
                  { name: 'name', label: 'Название / ФИО', type: 'text', admin: { description: 'ООО «Ромашка» или Иванов Иван Иванович' } },
                  { name: 'inn', label: 'ИНН', type: 'text' },
                  { name: 'kpp', label: 'КПП', type: 'text', admin: { condition: (d) => d?.clientType === 'company' } },
                  { name: 'ogrn', label: 'ОГРН / ОГРНИП', type: 'text', admin: { condition: (d) => d?.clientType !== 'person' } },
                ] },
                { type: 'row', admin: { condition: (d) => d?.clientType === 'company' }, fields: [
                  { name: 'signer', label: 'Подписант (ФИО)', type: 'text', admin: { description: 'Иванов Иван Иванович' } },
                  { name: 'signerGen', label: 'В лице (кого)', type: 'text', admin: { description: 'Генерального директора Иванова Ивана Ивановича' } },
                  { name: 'basis', label: 'Действует на основании', type: 'text', defaultValue: 'Устава', admin: { description: 'Устава / доверенности № … от …' } },
                ] },
                { name: 'address', label: 'Адрес', type: 'text', admin: { description: 'Юридический адрес или адрес регистрации' } },
                { name: 'passport', label: 'Паспорт (серия, номер, кем и когда выдан)', type: 'text', admin: { condition: (d) => d?.clientType === 'person', description: 'Необязательно. Если не нужен — оставьте пустым' } },
                { type: 'row', admin: { condition: (d) => d?.clientType !== 'person' }, fields: [
                  { name: 'bankAccount', label: 'Р/с', type: 'text' },
                  { name: 'bankName', label: 'Банк', type: 'text' },
                  { name: 'bik', label: 'БИК', type: 'text' },
                  { name: 'corrAccount', label: 'К/с', type: 'text' },
                ] },
                { type: 'row', fields: [
                  { name: 'phone', label: 'Телефон', type: 'text' },
                  { name: 'email', label: 'Эл. почта', type: 'email' },
                ] },
              ],
            },
          ],
        },
        {
          label: 'Условия',
          fields: [
            {
              name: 'terms',
              label: false,
              type: 'group',
              fields: [
                { type: 'row', fields: [
                  { name: 'plan', label: 'Тариф', type: 'text' },
                  { name: 'price', label: 'Стоимость, ₽', type: 'number', admin: { description: 'Для SEO — в месяц' } },
                  { name: 'payment', label: 'Оплата', type: 'select', defaultValue: 'half', options: [
                    { label: '100 % предоплата', value: 'prepay100' },
                    { label: '50 / 50', value: 'half' },
                    { label: '40 / 30 / 30 по этапам', value: 'thirds' },
                    { label: 'Ежемесячно (SEO)', value: 'monthly' },
                  ] },
                ] },
                { type: 'row', fields: [
                  { name: 'days', label: 'Срок, рабочих дней', type: 'number' },
                  { name: 'revisions', label: 'Кругов правок', type: 'number', defaultValue: 2 },
                  { name: 'warrantyDays', label: 'Гарантия, дней', type: 'number', defaultValue: 30 },
                  { name: 'concepts', label: 'Концепций (дизайн)', type: 'number', defaultValue: 3 },
                  { name: 'minMonths', label: 'Мин. срок SEO, мес.', type: 'number', defaultValue: 3 },
                ] },
                { type: 'row', fields: [
                  { name: 'hosting', label: 'Домен и хостинг', type: 'select', defaultValue: 'client', options: [
                    { label: 'Покупает заказчик', value: 'client' },
                    { label: 'Регистрирую я на имя заказчика', value: 'executor' },
                  ] },
                  { name: 'content', label: 'Тексты и фото', type: 'select', defaultValue: 'client', options: [
                    { label: 'Даёт заказчик', value: 'client' },
                    { label: 'Готовлю я', value: 'executor' },
                  ] },
                  { name: 'supportMonths', label: 'Консультации после запуска, мес.', type: 'number' },
                ] },
                { type: 'row', fields: [
                  { name: 'site', label: 'Домен сайта', type: 'text', admin: { description: 'example.ru — для SEO обязательно' } },
                  { name: 'credit', label: 'Ссылка «сделано в GeoBit» в подвале', type: 'checkbox', defaultValue: true },
                ] },
                { name: 'extra', label: 'Особые условия', type: 'textarea', admin: { description: 'Попадут отдельным абзацем в «Заключительные положения»' } },
              ],
            },
          ],
        },
        {
          label: 'Текст договора',
          description: 'Текст можно править прямо здесь — Word и страница-документ собираются из него. Если поменяли тип заказчика, оплату или хостинг, нажмите «Пересобрать из шаблона» (ручные правки текста при этом заменятся).',
          fields: [
            { name: 'docTitle', label: 'Подзаголовок', type: 'text' },
            { name: 'scope', label: 'Приложение № 1: состав работ', type: 'textarea', admin: { rows: 10, description: 'Каждая строка — пункт технического задания' } },
            {
              name: 'sections',
              label: 'Разделы',
              labels: { singular: 'Раздел', plural: 'Разделы' },
              type: 'array',
              admin: { initCollapsed: true, components: { RowLabel: '/components/admin/contracts/Actions#SectionLabel' } },
              fields: [
                { name: 'title', label: 'Заголовок раздела', type: 'text', required: true },
                { name: 'body', label: 'Текст', type: 'textarea', admin: { rows: 12, description: VARS_HELP } },
              ],
            },
          ],
        },
      ],
    },
    { name: 'status', label: 'Статус', type: 'select', defaultValue: 'draft', options: STATUSES, index: true, admin: { position: 'sidebar', components: { Cell: '/components/admin/contracts/Actions#StatusCell' } } },
    { name: 'service', label: 'Услуга', type: 'relationship', relationTo: 'services', admin: { position: 'sidebar' } },
    { name: 'template', label: 'Шаблон', type: 'relationship', relationTo: 'contract-templates' as any, admin: { position: 'sidebar' } },
    { name: 'kind', label: 'Вид', type: 'select', options: KINDS, defaultValue: 'dev', admin: { position: 'sidebar' } },
    { name: 'lead', label: 'Заявка', type: 'relationship', relationTo: 'leads', admin: { position: 'sidebar' } },
    { name: 'prospect', label: 'Клиент из поиска', type: 'relationship', relationTo: 'prospects', admin: { position: 'sidebar' } },
    { name: 'token', label: 'Ключ ссылки для клиента', type: 'text', index: true, admin: { position: 'sidebar', readOnly: true, description: 'По ссылке /dogovor/… клиент видит договор и может скачать Word' } },
  ],
}
