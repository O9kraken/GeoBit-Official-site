import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig, Field, GlobalAfterChangeHook, GlobalConfig, PayloadRequest } from 'payload'
import { isAdmin } from '../access/roles'

/** Служебные коллекции, которые не журналируем */
const SKIP = new Set(['audit-log', 'payload-jobs', 'payload-preferences', 'payload-locked-documents', 'payload-migrations', 'payload-kv'])
const IGNORE_FIELDS = new Set(['updatedAt', 'createdAt', 'id', 'hash', 'salt', 'sessions', 'loginAttempts', 'lockUntil', 'resetPasswordToken', 'resetPasswordExpiration', 'totpSecret', 'totpPending', 'readingTime', 'potential', 'potentialWhy'])

/** Подписи полей: имя поля → «Заголовок», чтобы в истории было понятно, что меняли */
function labelsOf(fields: Field[], out: Record<string, string> = {}) {
  for (const f of fields as any[]) {
    if (f.name && typeof f.label === 'string') out[f.name] = f.label
    if (f.fields) labelsOf(f.fields, out)
    if (f.tabs) for (const t of f.tabs) labelsOf(t.fields, t.name ? out : out)
  }
  return out
}

const title = (doc: any, useAsTitle?: string) => String((useAsTitle && doc?.[useAsTitle]) || doc?.title || doc?.name || doc?.email || doc?.slug || doc?.id || '').slice(0, 160)

/** Связи сравниваем по id: в одном снимке они бывают объектами, в другом — просто id */
const norm = (v: any): any => {
  if (v == null) return null
  if (Array.isArray(v)) return v.map(norm)
  if (typeof v === 'object') {
    if ('relationTo' in v && 'value' in v) return `${v.relationTo}:${norm(v.value)}`
    if ('id' in v && (('createdAt' in v) || ('updatedAt' in v) || ('filename' in v))) return String(v.id)
    const o: any = {}
    for (const k of Object.keys(v).sort()) if (k !== 'updatedAt' && k !== 'createdAt') o[k] = norm(v[k])
    return o
  }
  return typeof v === 'number' ? String(v) : v
}

const changedKeys = (doc: any, prev: any) =>
  Object.keys({ ...(doc || {}), ...(prev || {}) }).filter((k) => !IGNORE_FIELDS.has(k) && !k.startsWith('_') && JSON.stringify(norm(doc?.[k])) !== JSON.stringify(norm(prev?.[k])))

type Entry = { action: string; target: string; targetLabel: string; docId?: string; docTitle?: string; changed?: string[]; note?: string }

/** Записать событие. Правки одного документа одним человеком за 10 минут склеиваются (автосохранение не засоряет журнал) */
export async function audit(req: PayloadRequest, e: Entry, asUser?: any) {
  const u: any = asUser || req.user
  if (!u) return
  try {
    const p = req.payload
    if (e.action === 'update' && e.docId) {
      const recent = await p.find({
        collection: 'audit-log' as any,
        where: { and: [{ user: { equals: u.id } }, { target: { equals: e.target } }, { docId: { equals: e.docId } }, { action: { equals: 'update' } }, { updatedAt: { greater_than: new Date(Date.now() - 10 * 60_000).toISOString() } }] },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      })
      const r: any = recent.docs[0]
      if (r) {
        const merged = [...new Set([...(r.changed || '').split(', ').filter(Boolean), ...(e.changed || [])])].join(', ')
        await p.update({ collection: 'audit-log' as any, id: r.id, data: { changed: merged, docTitle: e.docTitle } as any, overrideAccess: true, req, context: { skipAudit: true } })
        return
      }
    }
    await p.create({
      collection: 'audit-log' as any,
      data: { user: u.id, userName: u.name || u.email, action: e.action, target: e.target, targetLabel: e.targetLabel, docId: e.docId, docTitle: e.docTitle, changed: (e.changed || []).join(', ') || undefined, note: e.note } as any,
      overrideAccess: true,
      req,
      context: { skipAudit: true },
    })
  } catch (err) {
    req.payload.logger.warn(`audit: ${err}`)
  }
}

/** Навесить журнал на коллекцию */
export const withAuditCollection = (c: CollectionConfig): CollectionConfig => {
  if (SKIP.has(c.slug)) return c
  const labels = labelsOf(c.fields)
  const label = (typeof c.labels?.plural === 'string' && c.labels.plural) || c.slug
  const after: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
    if (!req.user || req.context?.skipAudit) return doc
    const keys = operation === 'update' ? changedKeys(doc, previousDoc) : []
    let action: string = operation
    if (operation === 'update' && doc?._status !== previousDoc?._status && doc?._status) action = doc._status === 'published' ? 'publish' : 'unpublish'
    if (operation === 'update' && !keys.length && action === 'update') return doc
    await audit(req, { action, target: c.slug, targetLabel: label, docId: String(doc.id), docTitle: title(doc, c.admin?.useAsTitle), changed: keys.map((k) => labels[k] || k) })
    return doc
  }
  const del: CollectionAfterDeleteHook = async ({ doc, req }) => {
    await audit(req, { action: 'delete', target: c.slug, targetLabel: label, docId: String(doc?.id), docTitle: title(doc, c.admin?.useAsTitle) })
  }
  return { ...c, hooks: { ...c.hooks, afterChange: [...(c.hooks?.afterChange || []), after], afterDelete: [...(c.hooks?.afterDelete || []), del] } }
}

export const withAuditGlobal = (g: GlobalConfig): GlobalConfig => {
  const labels = labelsOf(g.fields)
  const label = (typeof g.label === 'string' && g.label) || g.slug
  const after: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (!req.user || req.context?.skipAudit) return doc
    const keys = changedKeys(doc, previousDoc)
    if (!keys.length) return doc
    await audit(req, { action: 'update', target: g.slug, targetLabel: label, docId: g.slug, docTitle: label, changed: keys.map((k) => labels[k] || k) })
    return doc
  }
  return { ...g, hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange || []), after] } }
}

const ACTIONS = [
  { label: 'Создал', value: 'create' },
  { label: 'Изменил', value: 'update' },
  { label: 'Опубликовал', value: 'publish' },
  { label: 'Снял с публикации', value: 'unpublish' },
  { label: 'Удалил', value: 'delete' },
  { label: 'Вошёл', value: 'login' },
  { label: 'Массовое действие', value: 'bulk' },
]

/** История изменений: кто, что и когда менял. Значения полей не храним — только какие поля менялись (в заявках есть ПДн) */
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Запись истории', plural: 'История изменений' },
  admin: {
    useAsTitle: 'docTitle',
    group: 'Настройки',
    defaultColumns: ['createdAt', 'userName', 'action', 'targetLabel', 'docTitle', 'changed'],
    description: 'Кто и что менял в админке. Хранится 180 дней. Сами значения не сохраняются — только какие поля менялись.',
    listSearchableFields: ['docTitle', 'userName', 'targetLabel'],
    hidden: ({ user }) => !isAdmin(user),
    pagination: { defaultLimit: 50 },
    disableCopyToLocale: true,
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => isAdmin(req.user),
    create: () => false,
    update: () => false,
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'user', label: 'Пользователь', type: 'relationship', relationTo: 'users', index: true, admin: { readOnly: true } },
    { name: 'userName', label: 'Кто', type: 'text', admin: { readOnly: true } },
    { name: 'action', label: 'Действие', type: 'select', options: ACTIONS, index: true, admin: { readOnly: true } },
    { name: 'target', label: 'Раздел (код)', type: 'text', index: true, admin: { readOnly: true } },
    { name: 'targetLabel', label: 'Раздел', type: 'text', admin: { readOnly: true } },
    { name: 'docId', label: 'ID записи', type: 'text', index: true, admin: { readOnly: true } },
    { name: 'docTitle', label: 'Запись', type: 'text', admin: { readOnly: true, components: { Cell: '/components/admin/AuditCells#DocCell' } } },
    { name: 'changed', label: 'Что менял', type: 'text', admin: { readOnly: true } },
    { name: 'note', label: 'Подробности', type: 'text', admin: { readOnly: true } },
  ],
}
