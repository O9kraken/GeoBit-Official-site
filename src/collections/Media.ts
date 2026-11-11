import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медиафайлы' },
  admin: { group: 'Контент' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'alt', label: 'Альтернативный текст (alt)', type: 'text' },
    { name: 'wpId', type: 'number', admin: { hidden: true }, index: true },
    // путь файла на старом сайте (2026/07/file.jpg) — для 301 со старых адресов /wp-content/uploads/…
    { name: 'wpPath', type: 'text', admin: { hidden: true }, index: true },
  ],
  upload: {
    staticDir: process.env.MEDIA_DIR || 'media',
    // только нужные типы; SVG отдаётся с запретом скриптов (см. заголовки в next.config.ts)
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf'],
    imageSizes: [
      { name: 'thumb', width: 400, height: 400, position: 'centre', formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'card', width: 800, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'wide', width: 1600, formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
    formatOptions: { format: 'webp', options: { quality: 82 } },
    focalPoint: true,
  },
}
