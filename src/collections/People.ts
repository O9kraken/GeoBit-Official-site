import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'

export const Team: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'Сотрудник', plural: 'Команда' },
  admin: { useAsTitle: 'name', group: 'Контент', defaultColumns: ['name', 'position', 'published', 'order'] },
  defaultSort: 'order',
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', label: 'Имя', type: 'text', required: true },
    { name: 'position', label: 'Должность', type: 'text' },
    { name: 'bio', label: 'О себе', type: 'textarea' },
    { name: 'skills', label: 'Навыки (через запятую)', type: 'text' },
    { name: 'photo', label: 'Фото', type: 'upload', relationTo: 'media' },
    { type: 'row', fields: [
      { name: 'telegram', label: 'Telegram', type: 'text' },
      { name: 'vk', label: 'VK', type: 'text' },
      { name: 'github', label: 'GitHub', type: 'text' },
      { name: 'linkedin', label: 'LinkedIn', type: 'text' },
    ] },
    { name: 'published', label: 'Показывать на сайте', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'order', label: 'Порядок', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Отзыв', plural: 'Отзывы' },
  admin: { useAsTitle: 'name', group: 'Контент', defaultColumns: ['name', 'position', 'projectRef', 'published'] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', label: 'Имя клиента', type: 'text', required: true },
    { name: 'position', label: 'Должность / компания', type: 'text' },
    { name: 'text', label: 'Текст отзыва', type: 'textarea', required: true },
    { name: 'photo', label: 'Фото / логотип', type: 'upload', relationTo: 'media' },
    { type: 'row', fields: [
      { name: 'rating', label: 'Оценка', type: 'number', min: 1, max: 5, defaultValue: 5 },
      { name: 'project', label: 'Что делали (подпись)', type: 'text', admin: { description: 'Например: «Электронное меню и сайт-визитка»' } },
    ] },
    {
      name: 'projectRef',
      label: 'Кейс в портфолио',
      type: 'relationship',
      relationTo: 'projects',
      admin: { description: 'Отзыв появится на странице этого кейса, а в слайдере отзывов — ссылка «Смотреть кейс»' },
    },
    { name: 'published', label: 'Показывать на сайте', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'order', label: 'Порядок', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
