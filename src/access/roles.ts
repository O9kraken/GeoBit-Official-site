import type { Access, CollectionConfig, FieldAccess, GlobalConfig } from 'payload'

/** Роли в админке */
export type Role = 'admin' | 'editor' | 'manager'

export const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: 'Администратор — всё, включая настройки и пользователей', value: 'admin' },
  { label: 'Редактор контента — блог, страницы, услуги, портфолио', value: 'editor' },
  { label: 'Менеджер по продажам — заявки и поиск клиентов', value: 'manager' },
]

export const ROLE_LABEL: Record<Role, string> = { admin: 'Администратор', editor: 'Редактор', manager: 'Менеджер' }

/** Роль пользователя. У записей, созданных до появления ролей, роль проставит миграция (admin) */
export const roleOf = (user: any): Role | null => (user ? ((user.role as Role) || 'admin') : null)
export const can = (user: any, ...roles: Role[]) => {
  const r = roleOf(user)
  return Boolean(r && roles.includes(r))
}
export const isAdmin = (user: any) => can(user, 'admin')

export const roles = (...rs: Role[]): Access => ({ req }) => can(req.user, ...rs)
export const rolesField = (...rs: Role[]): FieldAccess => ({ req }) => can(req.user, ...rs)

/** Зоны админки: кто работает с какими разделами */
type Area = 'sales' | 'content' | 'system'
const AREA: Record<string, Area> = {
  leads: 'sales', subscribers: 'sales', prospects: 'sales',
  pages: 'content', services: 'content', landings: 'content', projects: 'content', posts: 'content', team: 'content',
  testimonials: 'content', media: 'content', categories: 'content', tags: 'content', 'service-categories': 'content', 'portfolio-categories': 'content',
  home: 'content', 'services-page': 'content', 'about-page': 'content', 'contacts-page': 'content', 'portfolio-page': 'content', 'blog-page': 'content', 'faq-page': 'content',
  settings: 'system', 'seo-settings': 'system', navigation: 'system', calculator: 'system', redirects: 'system',
}
const WHO: Record<Area, Role[]> = { sales: ['admin', 'manager'], content: ['admin', 'editor'], system: ['admin'] }

/** Обёртка: сначала проверяем роль, потом — исходное правило (например, «создавать заявки может только сервер») */
const guard = (allowed: Role[], orig?: Access): Access => (args) => {
  if (!args.req.user) return orig ? orig(args) : false
  if (!can(args.req.user, ...allowed)) return false
  return orig ? orig(args) : true
}

export const withRolesCollection = (c: CollectionConfig): CollectionConfig => {
  const area = AREA[c.slug]
  if (!area) return c
  const allowed = WHO[area]
  const a = c.access || {}
  return {
    ...c,
    access: {
      ...a,
      // контент и настройки сайт читает публично — роль ограничивает только изменения; заявки и клиенты закрыты целиком
      ...(area === 'sales' ? { read: guard(allowed, a.read) } : {}),
      create: guard(allowed, a.create),
      update: guard(allowed, a.update),
      delete: guard(allowed, a.delete),
      ...(a.readVersions || c.versions ? { readVersions: guard(allowed, a.readVersions) } : {}),
    },
    admin: { ...c.admin, hidden: ({ user }) => !can(user, ...allowed) },
  }
}

export const withRolesGlobal = (g: GlobalConfig): GlobalConfig => {
  const area = AREA[g.slug]
  if (!area) return g
  const allowed = WHO[area]
  const a = g.access || {}
  return {
    ...g,
    access: { ...a, update: guard(allowed, a.update), ...(g.versions ? { readVersions: guard(allowed, a.readVersions) } : {}) },
    admin: { ...g.admin, hidden: ({ user }) => !can(user, ...allowed) },
  }
}
