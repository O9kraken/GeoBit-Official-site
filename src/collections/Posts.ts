import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

const countWords = (node: any): number => {
  if (!node) return 0
  let n = typeof node.text === 'string' ? node.text.split(/\s+/).filter(Boolean).length : 0
  if (Array.isArray(node.children)) for (const c of node.children) n += countWords(c)
  return n
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Статья', plural: 'Блог' },
  admin: { useAsTitle: 'title', group: 'Контент', defaultColumns: ['title', 'publishedAt', '_status'] },
  defaultSort: '-publishedAt',
  versions: { drafts: true },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text', required: true },
    { name: 'excerpt', label: 'Анонс', type: 'textarea' },
    { name: 'cover', label: 'Обложка', type: 'upload', relationTo: 'media' },
    { name: 'content', label: 'Текст статьи', type: 'richText', required: true },
    slugField(),
    { name: 'publishedAt', label: 'Дата публикации', type: 'date', admin: { position: 'sidebar' } },
    { name: 'author', label: 'Автор', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', description: 'Имя и аватар берутся из профиля пользователя' } },
    { name: 'authorName', label: 'Автор (если не выбран выше)', type: 'text', defaultValue: 'Георгий', admin: { position: 'sidebar' } },
    { name: 'categories', label: 'Рубрики', type: 'relationship', relationTo: 'categories', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'tags', label: 'Теги', type: 'relationship', relationTo: 'tags', hasMany: true, admin: { position: 'sidebar' } },
    {
      name: 'readingTime',
      label: 'Время чтения, мин',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true, description: 'Считается автоматически' },
      hooks: {
        beforeChange: [({ siblingData }) => Math.max(1, Math.round(countWords(siblingData?.content?.root) / 180))],
      },
    },
  ],
}
