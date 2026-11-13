import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { dbStorageAdapter } from './lib/db-storage'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { seoInnerFields } from './fields/seo'
import { SeoSettings } from './globals/SeoSettings'
import { withIndexNow } from './lib/indexnow'
import { EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import { migrations } from './migrations'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Leads, Subscribers } from './collections/Leads'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Team, Testimonials } from './collections/People'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Services } from './collections/Services'
import { Landings } from './collections/Landings'
import { Categories, PortfolioCategories, ServiceCategories, Tags } from './collections/Taxonomies'
import { Users } from './collections/Users'
import { Calculator } from './globals/Calculator'
import { Navigation } from './globals/Navigation'
import { AboutPage, BlogPage, ContactsPage, FaqPage, HomePage, PortfolioPage, ServicesPage } from './globals/PageGlobals'
import { SiteSettings } from './globals/SiteSettings'
import { polishCollection, polishGlobal } from './admin/polish'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER)

export default buildConfig({
  serverURL: (process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, ''),
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — GeoBit', icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }] },
    components: {
      graphics: { Logo: '/components/admin/Logo#Logo', Icon: '/components/admin/Icon#Icon' },
      beforeDashboard: ['/components/admin/Dashboard#Dashboard'],
      beforeNavLinks: ['/components/admin/NavExtras#NavExtras'],
      views: {
        seoAudit: { Component: '/components/admin/SeoAudit#SeoAudit', path: '/seo' },
      },
    },
    // Предпросмотр рядом с формой; страница обновляется после каждого «Сохранить»
    livePreview: {
      breakpoints: [
        { label: 'Телефон', name: 'mobile', width: 390, height: 844 },
        { label: 'Планшет', name: 'tablet', width: 820, height: 1180 },
        { label: 'Компьютер', name: 'desktop', width: 1440, height: 900 },
      ],
    },
    dateFormat: 'dd.MM.yyyy HH:mm',
    // без Gravatar: админка не ходит на внешние сервисы
    avatar: { Component: '/components/admin/Avatar#Avatar' },
  },
  i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru' },
  // порядок здесь = порядок групп в меню админки: заявки — первыми
  collections: [
    Leads, Subscribers,
    Pages,
    Services, Landings, Projects, Posts, Team, Testimonials, Media,
    ServiceCategories, PortfolioCategories, Categories, Tags,
    Users,
  ]
    .map(polishCollection)
    .map(withIndexNow),
  globals: [HomePage, ServicesPage, AboutPage, ContactsPage, PortfolioPage, BlogPage, FaqPage, SiteSettings, SeoSettings, Navigation, Calculator].map(polishGlobal),
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
  }),
  // Очередь задач: запланированные публикации статей. Проверка — каждые 5 минут, только на работающем сервере
  jobs: {
    autoRun: [{ allQueues: true, cron: '0 */5 * * * *', limit: 20 }],
    shouldAutoRun: () => process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build',
    deleteJobOnComplete: true,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  // GraphQL сайтом не используется — выключен, чтобы не держать лишнюю точку входа
  graphQL: { disable: true },
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '', max: 10 },
    // В разработке схема синхронизируется сама; в продакшене — миграции (npm run migrate)
    push: process.env.NODE_ENV !== 'production',
    // В продакшене схема создаётся/обновляется миграциями автоматически при старте
    prodMigrations: migrations,
  }),
  email: smtpReady
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || process.env.SMTP_USER || '',
        defaultFromName: 'GeoBit',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: Number(process.env.SMTP_PORT || 465) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  sharp,
  plugins: [
    // MEDIA_STORAGE=db — картинки хранятся в базе (Render + Neon на время разработки)
    // (поля плагина добавляются всегда, чтобы схема базы не зависела от режима)
    cloudStoragePlugin({
      enabled: process.env.MEDIA_STORAGE === 'db',
      alwaysInsertFields: true,
      collections: { media: { adapter: dbStorageAdapter, disableLocalStorage: true } },
    }),
    seoPlugin({
      collections: ['services', 'landings', 'projects', 'posts', 'pages', 'categories', 'service-categories', 'portfolio-categories'],
      uploadsCollection: 'media',
      // отдельная вкладка «SEO и ИИ» с живым анализом (src/fields/seo.ts, SeoPanel)
      tabbedUI: true,
      fields: () => seoInnerFields({ withFaq: true }),
    }),
    // вкладка плагина называется просто «SEO» — переименовываем
    (config) => ({
      ...config,
      collections: (config.collections || []).map((c) => ({
        ...c,
        fields: c.fields.map((f: any) =>
          f.type === 'tabs'
            ? {
                ...f,
                tabs: f.tabs.map((t: any) =>
                  t.name === 'meta' || t.fields?.some((x: any) => x.name === 'meta')
                    ? { ...t, label: 'SEO и ИИ', fields: t.fields.map((x: any) => (x.name === 'meta' ? { ...x, label: false } : x)) }
                    : t,
                ),
              }
            : f,
        ),
      })),
    }),
    redirectsPlugin({
      collections: ['pages', 'posts', 'services', 'landings', 'projects'],
      overrides: {
        labels: { singular: 'Редирект', plural: 'Редиректы' },
        admin: { group: 'Настройки' },
      },
    }),
  ],
})
