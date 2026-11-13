import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'
import { faqField } from '../fields/faq'

/**
 * Посадочные страницы под города Крыма и отрасли: /sozdanie-sajtov/<slug>/.
 * Страница с типом «Регион» — общая страница «Создание сайтов в Крыму» по адресу /sozdanie-sajtov/.
 * Важно: тексты у каждой страницы свои. Одинаковые страницы с заменой названия города
 * Яндекс считает дорвеями и понижает весь сайт.
 */
export const Landings: CollectionConfig = {
  slug: 'landings',
  labels: { singular: 'Посадочная страница', plural: 'Города и отрасли' },
  admin: {
    useAsTitle: 'title',
    group: 'Контент',
    defaultColumns: ['title', 'kind', 'slug', 'order'],
    description: 'Страницы «Создание сайтов в Симферополе», «Сайт для гостиницы» и т. п. Адрес: /sozdanie-sajtov/<slug>/',
  },
  defaultSort: 'order',
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: 'Заголовок H1', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Первый экран',
          fields: [
            { name: 'cardTitle', label: 'Название в карточках и ссылках', type: 'text', admin: { description: 'Коротко: «Симферополь», «Гостиницы и гостевые дома»' } },
            { name: 'shortDesc', label: 'Подзаголовок', type: 'textarea' },
            {
              type: 'row',
              fields: [
                { name: 'price', label: 'Цена от', type: 'text', admin: { description: 'Например: 29 900 ₽' } },
                { name: 'duration', label: 'Срок от', type: 'text', admin: { description: 'Например: 7 дней' } },
                { name: 'icon', label: 'Иконка (Font Awesome)', type: 'text', defaultValue: 'fas fa-location-dot' },
              ],
            },
            { name: 'image', label: 'Изображение', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Страница',
          fields: [
            {
              name: 'explainer',
              label: 'Блок с основным текстом',
              type: 'group',
              fields: [
                { name: 'title', label: 'Заголовок', type: 'text' },
                { name: 'text', label: 'Текст (абзацы через пустую строку; первый — крупно, остальные — карточками)', type: 'textarea' },
                { name: 'points', label: 'Коротко (пункты)', type: 'array', fields: [{ name: 'text', label: 'Пункт', type: 'text', required: true }] },
              ],
            },
            {
              name: 'features',
              label: 'Что должно быть на сайте',
              type: 'array',
              fields: [
                { name: 'title', label: 'Заголовок', type: 'text', required: true },
                { name: 'text', label: 'Описание', type: 'textarea' },
              ],
            },
            { name: 'featuresTitle', label: 'Заголовок блока «Что должно быть на сайте»', type: 'text' },
            {
              name: 'services',
              label: 'Подходящие услуги',
              type: 'relationship',
              relationTo: 'services',
              hasMany: true,
              admin: { description: 'Карточки с ценами. Пусто — лендинг, корпоративный сайт и магазин.' },
            },
            {
              name: 'cases',
              label: 'Кейсы',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
              admin: { description: 'Пусто — свежие работы из портфолио.' },
            },
            {
              name: 'steps',
              label: 'Как работаем',
              type: 'array',
              fields: [
                { name: 'title', label: 'Этап', type: 'text', required: true },
                { name: 'text', label: 'Описание', type: 'textarea' },
              ],
            },
            faqField(),
          ],
        },
      ],
    },
    slugField(),
    {
      name: 'kind',
      label: 'Тип',
      type: 'select',
      required: true,
      defaultValue: 'city',
      options: [
        { label: 'Город', value: 'city' },
        { label: 'Отрасль', value: 'industry' },
        { label: 'Регион (общая страница /sozdanie-sajtov/)', value: 'region' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'place', label: 'Город для разметки', type: 'text', admin: { position: 'sidebar', description: 'Именительный падеж: «Симферополь». Для отраслей — пусто.' } },
    { name: 'order', label: 'Порядок', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
