import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Кейс', plural: 'Портфолио' },
  admin: { useAsTitle: 'title', group: 'Контент', defaultColumns: ['title', 'client', 'year', 'isFeatured', 'order'] },
  defaultSort: 'order',
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основное',
          fields: [
            { type: 'row', fields: [
              { name: 'client', label: 'Клиент', type: 'text' },
              { name: 'categoryLabel', label: 'Категория (текст)', type: 'text' },
            ] },
            { type: 'row', fields: [
              { name: 'year', label: 'Год', type: 'text' },
              { name: 'duration', label: 'Срок реализации', type: 'text' },
              { name: 'technologies', label: 'Технологии', type: 'text' },
            ] },
            { name: 'url', label: 'Ссылка на проект', type: 'text' },
            { name: 'excerpt', label: 'Краткое описание', type: 'textarea' },
          ],
        },
        {
          label: 'Медиа',
          fields: [
            { name: 'cover', label: 'Обложка', type: 'upload', relationTo: 'media' },
            { name: 'hoverVideo', label: 'Видео при наведении (mp4/webm)', type: 'upload', relationTo: 'media' },
            { name: 'gallery', label: 'Галерея скриншотов', type: 'array', fields: [{ name: 'image', label: 'Фото', type: 'upload', relationTo: 'media', required: true }] },
            {
              name: 'media',
              label: 'Скриншот + описание',
              type: 'array',
              fields: [
                { name: 'image', label: 'Скриншот', type: 'upload', relationTo: 'media', required: true },
                { name: 'desc', label: 'Описание', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Детали',
          fields: [
            { name: 'challenge', label: 'Задача', type: 'textarea' },
            { name: 'solution', label: 'Решение', type: 'textarea' },
            {
              name: 'results',
              label: 'Результаты (метрики)',
              type: 'array',
              fields: [
                { type: 'row', fields: [
                  { name: 'value', label: 'Значение', type: 'text', required: true },
                  { name: 'label', label: 'Подпись', type: 'text' },
                ] },
              ],
            },
          ],
        },
      ],
    },
    slugField(),
    { name: 'categories', label: 'Категории портфолио', type: 'relationship', relationTo: 'portfolio-categories', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'serviceCategories', label: 'Категории услуг', type: 'relationship', relationTo: 'service-categories', hasMany: true, admin: { position: 'sidebar' } },
    {
      name: 'testimonials',
      label: 'Отзывы по этому кейсу',
      type: 'join',
      collection: 'testimonials',
      on: 'projectRef',
      admin: { position: 'sidebar', description: 'Привязка делается в самом отзыве: поле «Кейс в портфолио»' },
    },
    { name: 'isFeatured', label: 'Показать на главной', type: 'checkbox', admin: { position: 'sidebar' } },
    { name: 'order', label: 'Порядок', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'publishedAt', label: 'Дата', type: 'date', admin: { position: 'sidebar' } },
  ],
}
