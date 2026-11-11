import { APIError, type CollectionConfig } from 'payload'
import { authenticated } from '../access'

const MIN_PASSWORD = 10

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: { useAsTitle: 'email', group: 'Система', defaultColumns: ['avatar', 'name', 'email'] },
  auth: {
    // 5 неверных паролей подряд — блокировка на 15 минут
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 60 * 60 * 8,
    // вместе с пользователем сразу отдаётся аватар (для шапки админки)
    depth: 1,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' && !/^http:\/\/localhost/.test(process.env.SERVER_URL || '') },
  },
  // Пользователей видят и меняют только вошедшие в админку; сам себя удалить нельзя
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: ({ req, id }) => Boolean(req.user) && String(req.user?.id) !== String(id),
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
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
    { name: 'name', label: 'Имя', type: 'text', admin: { description: 'Показывается как автор статей в блоге' } },
    {
      name: 'avatar',
      label: 'Аватар',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Квадратное фото. Показывается у автора в блоге и в шапке админки.' },
    },
    { name: 'about', label: 'Подпись под именем', type: 'text', admin: { description: 'Например: «Основатель GeoBit, дизайнер и разработчик»' } },
  ],
}
