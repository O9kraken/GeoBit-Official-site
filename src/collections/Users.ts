import { APIError, type CollectionConfig } from 'payload'
import { emailLayout, SITE } from '../lib/email-layout'
import { authenticated } from '../access'
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
  admin: { useAsTitle: 'email', group: 'Система', defaultColumns: ['avatar', 'name', 'email'] },
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
  // Пользователей видят и меняют только вошедшие в админку; сам себя удалить нельзя
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: ({ req, id }) => Boolean(req.user) && String(req.user?.id) !== String(id),
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
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
