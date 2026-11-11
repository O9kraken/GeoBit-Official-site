import type { GlobalConfig } from 'payload'
import { anyone, authenticated, authenticatedField } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'settings',
  label: 'Настройки сайта',
  admin: { group: 'Настройки' },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Контакты',
          fields: [
            { type: 'row', fields: [
              { name: 'phone', label: 'Телефон', type: 'text' },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'telegramUsername', label: 'Telegram (username)', type: 'text' },
            ] },
            { type: 'row', fields: [
              { name: 'address', label: 'Адрес', type: 'text' },
              { name: 'postalCode', label: 'Индекс', type: 'text' },
              { name: 'workHours', label: 'Часы работы', type: 'text' },
            ] },
            { type: 'row', fields: [
              { name: 'geoLat', label: 'Широта', type: 'text' },
              { name: 'geoLng', label: 'Долгота', type: 'text' },
              { name: 'priceRange', label: 'Ценовой диапазон (₽ / ₽₽ / ₽₽₽)', type: 'text', defaultValue: '₽₽' },
            ] },
          ],
        },
        {
          label: 'Мессенджеры и соцсети',
          fields: [
            { type: 'row', fields: [
              { name: 'telegramUrl', label: 'Telegram (ссылка)', type: 'text' },
              { name: 'whatsappUrl', type: 'text', admin: { hidden: true } },
              { name: 'maxUrl', label: 'MAX (ссылка)', type: 'text' },
            ] },
            { type: 'row', fields: [
              { name: 'vkUrl', label: 'VK', type: 'text' },
              { name: 'instagramUrl', label: 'Instagram', type: 'text' },
              { name: 'dzenUrl', label: 'Дзен', type: 'text' },
            ] },
            { type: 'row', fields: [
              { name: 'youtubeUrl', label: 'YouTube', type: 'text' },
              { name: 'okUrl', label: 'Одноклассники', type: 'text' },
            ] },
          ],
        },
        {
          label: 'Подвал и реквизиты',
          fields: [
            { name: 'footerDescription', label: 'Описание в подвале', type: 'textarea' },
            { type: 'row', fields: [
              { name: 'legalName', label: 'Исполнитель', type: 'text', admin: { description: 'Например: Самозанятый Каляков Георгий Аскерович' } },
              { name: 'inn', label: 'ИНН', type: 'text' },
            ] },
          ],
        },
        {
          label: 'Аналитика и виджеты',
          fields: [
            { name: 'metrikaId', label: 'Яндекс Метрика: ID счётчика', type: 'text', admin: { description: 'Грузится только после согласия на «Аналитику».' } },
            { name: 'yandexVerification', label: 'Подтверждение Яндекс Вебмастер (content)', type: 'text' },
            { name: 'googleVerification', label: 'Подтверждение Google Search Console (content)', type: 'text' },
            { name: 'chatWidgetSrc', label: 'Скрипт онлайн-чата (URL)', type: 'text', admin: { description: 'Грузится только после согласия на «Персонализацию».' } },
          ],
        },
        {
          label: 'Заявки',
          fields: [
            { name: 'leadEmail', label: 'Куда слать письма о заявках', type: 'email', access: { read: authenticatedField } },
            { name: 'consentDocLabel', label: 'Редакция согласия на ПД (для журнала)', type: 'text', defaultValue: 'Редакция от 21.07.2026 — /soglasie-pd/' },
            { name: 'leadSuccessText', label: 'Текст после отправки заявки', type: 'text', defaultValue: 'Заявка отправлена! Мы свяжемся с вами в течение часа.' },
          ],
        },
      ],
    },
  ],
}
