import { APIError, type CollectionConfig } from 'payload'
import { emailLayout, SITE } from '../lib/email-layout'
import { authenticated } from '../access'
import { isAdmin, ROLE_OPTIONS, rolesField } from '../access/roles'
import { audit } from './AuditLog'
import { afterOperation2fa, beforeLogin2fa, twofaEndpoints } from '../lib/twofa'
import { clientIpFrom, overLimit } from '../lib/rate-limit'

// Ограничения с одного IP: подбор пароля и рассылка писем сброса
const AUTH_LIMITS: Record<string, [number, number]> = {
  login: [10, 10 * 60_000],
  forgotPassword: [3, 15 * 60_000],
  resetPassword: [10, 15 * 60_000],
  unlock: [3, 15 * 60_000],
}

const MIN_PASSWORD = 10

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: {
    useAsTitle: 'email',
    group: 'Система',
    defaultColumns: ['card', 'role', 'updatedAt'],
    listSearchableFields: ['name', 'email'],
    hidden: ({ user }) => !isAdmin(user),
  },
  auth: {
    // 5 неверных паролей подряд — блокировка на 15 минут
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 60 * 60 * 8,
    // вместе с пользователем сразу отдаётся аватар (для шапки админки)
    depth: 1,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' && !/^http:\/\/localhost/.test(process.env.SERVER_URL || '') },
    forgotPassword: {
      generateEmailSubject: () => 'Сброс пароля в админке GeoBit',
      generateEmailHTML: ({ token, user } = {}) => {
        const name = (user as any)?.name ? String((user as any).name).split(/\s+/)[0] : ''
        return emailLayout({
          preheader: 'Ссылка для нового пароля действует 1 час',
          title: name ? `${name}, сбросим пароль?` : 'Сброс пароля',
          paragraphs: [
            'Кто-то (надеемся, вы) запросил сброс пароля для входа в админку сайта getgeobit.ru.',
            'Нажмите кнопку и задайте новый пароль: не короче 10 символов, с буквами и цифрами. Ссылка действует 1 час.',
          ],
          button: { href: `${SITE}/admin/reset/${token}`, text: 'Задать новый пароль' },
          after: ['Если вы не запрашивали сброс, просто проигнорируйте это письмо — пароль останется прежним.'],
          footer: 'Служебное письмо админки сайта getgeobit.ru.',
        }).html
      },
    },
  },
  // Список пользователей видят все вошедшие (нужно для авторов статей). Добавлять, удалять и менять чужие профили — только администратор.
  // Свой профиль (имя, аватар, пароль, оформление) может менять каждый; сам себя удалить нельзя.
  access: {
    read: authenticated,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req, id }) => isAdmin(req.user) || (Boolean(req.user) && String(req.user?.id) === String(id)),
    delete: ({ req, id }) => isAdmin(req.user) && String(req.user?.id) !== String(id),
    admin: ({ req }) => Boolean(req.user),
  },
  endpoints: twofaEndpoints,
  hooks: {
    beforeLogin: [beforeLogin2fa],
    afterOperation: [afterOperation2fa],
    afterLogin: [
      async ({ req, user }) => {
        await audit(req, { action: 'login', target: 'users', targetLabel: 'Пользователи', docId: String(user.id), docTitle: user.name || user.email }, user)
      },
    ],
    beforeOperation: [
      ({ operation, req, args }) => {
        const lim = AUTH_LIMITS[operation as string]
        if (lim && req) {
          const ip = clientIpFrom(req.headers)
          if (overLimit(`${operation}:${ip}`, lim[0], lim[1])) {
            throw new APIError('Слишком много попыток. Подождите 15 минут и попробуйте снова.', 429, undefined, true)
          }
        }
        return args
      },
    ],
    beforeChange: [
      // нельзя оставить сайт без администратора
      async ({ data, originalDoc, req, operation }) => {
        if (operation === 'update' && originalDoc && (originalDoc.role || 'admin') === 'admin' && data?.role && data.role !== 'admin') {
          const others = await req.payload.count({
            collection: 'users',
            where: { and: [{ id: { not_equals: originalDoc.id } }, { or: [{ role: { equals: 'admin' } }, { role: { exists: false } }] }] },
            overrideAccess: true,
            req,
          })
          if (!others.totalDocs) throw new APIError('Это единственный администратор — сначала назначьте администратором кого-то ещё.', 400, undefined, true)
        }
        return data
      },
    ],
    beforeValidate: [
      ({ data }) => {
        const pw = (data as any)?.password
        if (typeof pw === 'string' && pw.length > 0) {
          if (pw.length < MIN_PASSWORD) throw new APIError(`Пароль слишком короткий: нужно не меньше ${MIN_PASSWORD} символов.`, 400, undefined, true)
          if (/^(\d+|[a-zа-яё]+)$/i.test(pw)) throw new APIError('Пароль слишком простой: добавьте и буквы, и цифры.', 400, undefined, true)
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'twofa', label: 'Вход с кодом', type: 'ui', admin: { components: { Field: '/components/admin/TwoFactor#TwoFactorField' } } },
    // 2FA: секреты не отдаются через API (hidden), меняются только через /api/users/2fa/*
    { name: 'totpEnabled', label: 'Вход с кодом включён', type: 'checkbox', defaultValue: false, access: { update: () => false, create: () => false }, admin: { hidden: true } },
    { name: 'totpSecret', type: 'text', hidden: true },
    { name: 'totpPending', type: 'text', hidden: true },
    { name: 'totpRecovery', type: 'json', hidden: true },
    { name: 'totpFails', type: 'number', hidden: true },
    { name: 'totpLockUntil', type: 'date', hidden: true },
    { name: 'card', label: 'Пользователь', type: 'ui', admin: { disableBulkEdit: true, components: { Cell: '/components/admin/UserCard#UserCardCell' } } },
    { name: 'name', label: 'Имя', type: 'text', admin: { description: 'Показывается как автор статей в блоге' } },
    {
      name: 'role',
      label: 'Роль',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: ROLE_OPTIONS,
      saveToJWT: true,
      access: { create: rolesField('admin'), update: rolesField('admin') },
      admin: {
        position: 'sidebar',
        description: 'Администратор — всё. Редактор — контент сайта без заявок и настроек. Менеджер — заявки, подписчики и поиск клиентов без правки сайта.',
        components: { Cell: '/components/admin/RoleCell#RoleCell' },
      },
    },
    {
      name: 'avatar',
      label: 'Аватар',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Квадратное фото. Показывается у автора в блоге и в шапке админки.', components: { Cell: '/components/admin/UserCard#AvatarCell' } },
    },
    { name: 'about', label: 'Подпись под именем', type: 'text', admin: { description: 'Например: «Основатель GeoBit, дизайнер и разработчик»' } },
    {
      type: 'collapsible',
      label: 'Оформление админки',
      admin: { initCollapsed: false, description: 'Личные настройки: видны только вам, на сайт не влияют. Применяются после «Сохранить» — если меню не обновилось, обновите страницу.' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'uiAccent',
              label: 'Акцентный цвет',
              type: 'select',
              defaultValue: 'geobit',
              options: [
                { label: 'GeoBit (фиолетовый градиент)', value: 'geobit' },
                { label: 'Розовый', value: 'pink' },
                { label: 'Синий', value: 'blue' },
                { label: 'Бирюзовый', value: 'cyan' },
                { label: 'Зелёный', value: 'green' },
                { label: 'Оранжевый', value: 'orange' },
              ],
              admin: { width: '33%' },
            },
            {
              name: 'uiDensity',
              label: 'Плотность меню',
              type: 'select',
              defaultValue: 'normal',
              options: [
                { label: 'Компактно', value: 'compact' },
                { label: 'Обычно', value: 'normal' },
                { label: 'Просторно', value: 'comfy' },
              ],
              admin: { width: '33%' },
            },
            {
              name: 'uiFontSize',
              label: 'Размер текста в меню',
              type: 'select',
              defaultValue: 'm',
              options: [
                { label: 'Мелкий', value: 's' },
                { label: 'Средний', value: 'm' },
                { label: 'Крупный', value: 'l' },
              ],
              admin: { width: '33%' },
            },
          ],
        },
        { name: 'uiIcons', label: 'Иконки в меню', type: 'checkbox', defaultValue: true },
      ],
    },
  ],
}
