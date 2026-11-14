import type { CollectionConfig, PayloadRequest } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

const countWords = (node: any): number => {
  if (!node) return 0
  let n = typeof node.text === 'string' ? node.text.split(/\s+/).filter(Boolean).length : 0
  if (Array.isArray(node.children)) for (const c of node.children) n += countWords(c)
  return n
}

/** Снять из очереди отложенную публикацию статьи (после ручной публикации она не нужна) */
async function dropSchedule(req: PayloadRequest, id: string | number) {
  try {
    await req.payload.delete({
      collection: 'payload-jobs' as any,
      where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }, { 'input.doc.value': { equals: String(id) } }] },
      overrideAccess: true,
      req,
    })
  } catch (e) {
    req.payload.logger.warn(`posts/quick: не удалось снять расписание ${id}: ${e}`)
  }
}

/** Быстрые действия из списка блога: опубликовать, снять с сайта, сделать копию */
const quickEndpoint = {
  path: '/:id/quick',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    if (!req.user) return Response.json({ error: 'Нужно войти в админку' }, { status: 401 })
    const id = String(req.routeParams?.id || '')
    const action = req.searchParams.get('action')
    const base = { collection: 'posts' as const, id, req, overrideAccess: false, user: req.user }
    try {
      if (action === 'publish') {
        await req.payload.update({ ...base, data: { _status: 'published' } as any })
        await dropSchedule(req, id)
        return Response.json({ ok: true })
      }
      if (action === 'unpublish') {
        await req.payload.update({ ...base, data: { _status: 'draft' } as any })
        return Response.json({ ok: true })
      }
      if (action === 'duplicate') {
        const src: any = await req.payload.findByID({ ...base, depth: 0, draft: true, select: { title: true, slug: true } as any })
        const copy: any = await req.payload.duplicate({
          ...base,
          draft: true,
          data: { title: `${src.title} (копия)`, slug: `${src.slug}-kopiya-${Date.now().toString(36).slice(-4)}`, _status: 'draft', publishedAt: null } as any,
        })
        return Response.json({ ok: true, id: copy.id })
      }
      return Response.json({ error: 'Неизвестное действие' }, { status: 400 })
    } catch (e: any) {
      return Response.json({ error: e?.message || String(e) }, { status: 400 })
    }
  },
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Статья', plural: 'Блог' },
  admin: {
    useAsTitle: 'title',
    group: 'Контент',
    description: 'Статьи выходят сами по расписанию — по вторникам и пятницам в 10:00 по Москве. Дату можно сменить в статье: стрелка у «Опубликовать» → «Запланировать публикацию».',
    defaultColumns: ['title', 'release', 'author', 'actions'],
    listSearchableFields: ['title', 'excerpt'],
    pagination: { defaultLimit: 50 },
    components: { beforeListTable: ['/components/admin/posts/Toolbar#PostsToolbar'] },
  },
  endpoints: [quickEndpoint],
  defaultSort: '-publishedAt',
  // «Запланировать публикацию» в админке: статья опубликуется сама в выбранное время (очередь задач — payload.config.ts → jobs)
  versions: { drafts: { schedulePublish: true } },
  hooks: {
    beforeChange: [
      // Дата публикации = момент первой публикации (вручную или по расписанию), если раньше не задали дату позже
      ({ data, originalDoc }) => {
        const becomesPublished = data?._status === 'published' && originalDoc?._status !== 'published'
        if (becomesPublished) {
          const cur = data.publishedAt ? new Date(data.publishedAt).getTime() : 0
          if (!cur || cur < Date.now()) data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text', required: true, admin: { description: 'Он же заголовок в поиске, если во вкладке «SEO и ИИ» не задан свой. Лучше 40–65 знаков, главный запрос — ближе к началу.' } },
    { name: 'excerpt', label: 'Анонс', type: 'textarea', admin: { description: '1–2 предложения: о чём статья и чем полезна. Показывается в карточке блога и в описании для поиска.' } },
    { name: 'cover', label: 'Обложка', type: 'upload', relationTo: 'media', admin: { description: 'Горизонтальная картинка от 1200×630.' } },
    { name: 'content', label: 'Текст статьи', type: 'richText', required: true },
    slugField(),
    { name: 'publishedAt', label: 'Дата публикации', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, HH:mm' }, description: 'По Москве. Ставится сама при первой публикации — менять не нужно.' } },
    { name: 'author', label: 'Автор', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', description: 'Имя и аватар берутся из профиля пользователя', components: { Cell: '/components/admin/posts/AuthorCell#AuthorCell' } } },
    { name: 'authorName', label: 'Имя автора вручную', type: 'text', defaultValue: 'Георгий', admin: { position: 'sidebar', description: 'Нужно, только если автор выше не выбран' } },
    { name: 'categories', label: 'Рубрики', type: 'relationship', relationTo: 'categories', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'tags', label: 'Теги', type: 'relationship', relationTo: 'tags', hasMany: true, admin: { position: 'sidebar' } },
    {
      name: 'readingTime',
      label: 'Время чтения, мин',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true, description: 'Считается само по объёму текста' },
      hooks: {
        beforeChange: [({ siblingData }) => Math.max(1, Math.round(countWords(siblingData?.content?.root) / 180))],
      },
    },
    // Колонки списка (в форме статьи не видны)
    { name: 'release', label: 'Выход', type: 'ui', admin: { disableBulkEdit: true, components: { Cell: '/components/admin/posts/ReleaseCell#ReleaseCell' } } },
    { name: 'actions', label: 'Действия', type: 'ui', admin: { disableBulkEdit: true, components: { Cell: '/components/admin/posts/ActionsCell#ActionsCell' } } },
  ],
}
