import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * SEO-аудит: заполняем пустые поля — рубрики, документы, FAQ, ключевые фразы и короткие ответы
 * для услуг и статей, ссылки из статьи «WordPress или конструктор» на услуги и города.
 * Меняется только пустое (или заведомо служебное) — правки из админки не перезаписываются. Идемпотентно.
 */

type Meta = { title: string; description: string; focus: string; answer?: string }

// Рубрики: таблица → slug → [описание-подзаголовок на странице, мета]
const TERMS: [string, string, string, Meta][] = [
  ['service_categories', 'sites', 'Лендинги, сайты-визитки, корпоративные сайты и интернет-магазины под ключ: дизайн с нуля, адаптив, базовое SEO под Яндекс. Цены от 29 900 ₽.', {
    title: 'Создание сайтов под ключ в Севастополе и Крыму — цены | GeoBit',
    description: 'Все виды сайтов от GeoBit: лендинг от 29 900 ₽, сайт-визитка, корпоративный сайт от 79 900 ₽, интернет-магазин от 129 900 ₽. Дизайн с нуля, договор, SEO.',
    focus: 'создание сайтов под ключ',
    answer: 'В GeoBit можно заказать лендинг от 29 900 ₽, сайт-визитку от 50 000 ₽, корпоративный сайт от 79 900 ₽ и интернет-магазин от 129 900 ₽. Все сайты — с дизайном с нуля, адаптивом и базовым SEO под Яндекс.',
  }],
  ['service_categories', 'designs', 'Дизайн сайтов, логотипы и фирменный стиль: от первой концепции до готовых файлов и гайдлайна. Логотип — от 15 000 ₽.', {
    title: 'Дизайн, логотипы и фирменный стиль в Севастополе | GeoBit',
    description: 'Дизайн сайта от 40 000 ₽, логотип от 15 000 ₽, фирменный стиль от 12 000 ₽. Несколько концепций, исходники и передача прав. Студия GeoBit, Севастополь.',
    focus: 'разработка логотипа и фирменного стиля',
    answer: 'В GeoBit логотип стоит от 15 000 ₽, фирменный стиль — от 12 000 ₽, дизайн сайта — от 40 000 ₽. Срок — от 7 дней, в результате вы получаете исходники и права на использование.',
  }],
  ['portfolio_categories', 'develop', 'Сайты, которые мы сделали для бизнеса: задачи, решения и результат по каждому проекту.', {
    title: 'Портфолио: примеры сайтов, сделанных в GeoBit',
    description: 'Примеры сайтов студии GeoBit: задача клиента, дизайн, функции и результат. Посмотрите работы перед тем, как заказать сайт в Севастополе или Крыму.',
    focus: 'примеры сайтов',
  }],
  ['portfolio_categories', 'logo', 'Логотипы и айдентика для брендов из Крыма и других регионов: концепции, варианты и итоговые знаки.', {
    title: 'Портфолио логотипов и айдентики — примеры работ | GeoBit',
    description: 'Примеры логотипов и фирменного стиля от GeoBit: AUTOBAHN, KODE23, baggyWEB и другие. Как мы ищем идею знака и что получает клиент.',
    focus: 'примеры логотипов',
  }],
  ['categories', 'dev', 'Статьи о создании сайтов: сколько стоит сайт, на чём его делать, как выбрать подрядчика и не переплатить.', {
    title: 'Статьи о разработке сайтов — блог GeoBit',
    description: 'Практические статьи о создании сайтов для бизнеса: стоимость, выбор платформы, WordPress или конструктор, сроки и подводные камни. Блог студии GeoBit.',
    focus: 'разработка сайтов',
  }],
]

// Старые служебные описания из WordPress, которые можно заменить
const OLD_TERM_DESCR = ['Категория разделов сайты', 'Категория разделов дизайна']

const SERVICES: [string, string, string][] = [
  ['landing-page', 'разработка лендинга', 'Лендинг в GeoBit стоит от 29 900 ₽ и делается от 7 дней: уникальный дизайн, форма заявки, адаптив под телефоны и готовность к рекламе в Яндекс Директе.'],
  ['site-vizit', 'создание сайта-визитки', 'Сайт-визитка в GeoBit — от 50 000 ₽, срок от 14 дней: несколько страниц о компании и услугах, индивидуальный дизайн, форма заявки и базовое SEO.'],
  ['corp-site', 'корпоративный сайт под ключ', 'Корпоративный сайт в GeoBit — от 79 900 ₽, срок от 30 дней: страницы услуг, каталог, раздел о компании, интеграции и админка, в которой вы сами меняете контент.'],
  ['shops', 'создание интернет-магазина', 'Интернет-магазин в GeoBit — от 129 900 ₽, срок от 30 дней: каталог с фильтрами, корзина, доставка, онлайн-оплата и админка для товаров и заказов.'],
  ['seo-prodvizhenie', 'SEO-продвижение сайта', 'SEO-продвижение в GeoBit — от 18 000 ₽ в месяц. Первые результаты в Яндексе обычно видны через 2–3 месяца работы: техническая оптимизация, семантика, тексты и отчёты.'],
  ['design-logo', 'разработка логотипа', 'Логотип в GeoBit — от 15 000 ₽, срок от 7 дней: несколько концепций, доработка выбранной, векторные файлы и передача прав.'],
  ['firmennyy-stil', 'разработка фирменного стиля', 'Фирменный стиль в GeoBit — от 12 000 ₽, срок от 7 дней: цвета, шрифты, носители и гайдлайн, чтобы бренд выглядел одинаково везде.'],
  ['site-disign', 'дизайн сайта на заказ', 'Дизайн сайта в GeoBit — от 40 000 ₽, срок от 7 дней: прототип, уникальный дизайн всех страниц, мобильная версия и файлы для разработчика.'],
]

const POSTS: [string, string, string][] = [
  ['wordpress-ili-konstruktor-sajtov-2026', 'WordPress или конструктор', 'Конструктор (Tilda, Flexbe, Creatium) подходит, чтобы быстро и недорого запустить простой лендинг. WordPress или собственная разработка лучше, когда сайт должен расти: свой хостинг, гибкое SEO, любые интеграции и никакой зависимости от тарифа платформы.'],
  ['skolko-stoit-sozdanie-sita-v-2026', 'сколько стоит создание сайта', 'В 2026 году лендинг стоит от 20 000 ₽, сайт-визитка — от 25 000 ₽, корпоративный сайт — от 60 000 ₽, интернет-магазин — от 80 000 ₽. Точная цена зависит от числа страниц, уникальности дизайна и интеграций.'],
]

const DOC_TITLES: [string, string][] = [
  ['oferta', 'Публичная оферта на разработку сайтов | GeoBit'],
  ['soglasie-pd', 'Согласие на обработку персональных данных | GeoBit'],
  ['soglasie-rassylka', 'Согласие на получение рассылки | GeoBit'],
]

const FAQ_META = {
  title: 'Вопросы о создании сайта: цены, сроки, оплата | GeoBit',
  description: 'Ответы на частые вопросы о разработке сайта в GeoBit: сколько стоит, сколько длится, как проходит оплата, что нужно от клиента и что будет после запуска.',
  focus: 'вопросы о создании сайта',
}

// Абзац со ссылками в конец статьи «WordPress или конструктор»
const t = (text: string) => ({ mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 })
const link = (url: string, text: string, i: number) => ({
  id: `gbseo${i}${url.replace(/[^a-z]/g, '').slice(0, 12)}`,
  type: 'link',
  fields: { url, newTab: false, linkType: 'custom' },
  format: '',
  indent: 0,
  version: 3,
  children: [t(text)],
  direction: null,
})
const para = (children: any[]) => ({ type: 'paragraph', format: '', indent: 0, version: 1, children, direction: null, textFormat: 0, textStyle: '' })
const WP_LINKS = [
  { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: null, children: [t('Если решили делать сайт с разработчиком')] },
  para([
    t('Мы делаем сайты с дизайном с нуля и админкой, в которой вы сами меняете цены и тексты: '),
    link('/services/landing-page/', 'лендинг от 29 900 ₽', 1),
    t(', '),
    link('/services/corp-site/', 'корпоративный сайт от 79 900 ₽', 2),
    t(' и '),
    link('/services/shops/', 'интернет-магазин', 3),
    t('. Подробно о ценах на рынке — в статье «'),
    link('/skolko-stoit-sozdanie-sita-v-2026/', 'Сколько стоит создание сайта в 2026 году', 4),
    t('».'),
  ]),
  para([
    t('Работаем по всему Крыму — '),
    link('/sozdanie-sajtov/', 'создание сайтов в Крыму', 5),
    t(', в том числе в '),
    link('/sozdanie-sajtov/simferopol/', 'Симферополе', 6),
    t(' и '),
    link('/sozdanie-sajtov/yalta/', 'Ялте', 7),
    t(', — и делаем отраслевые сайты: например, '),
    link('/sozdanie-sajtov/dlya-gostinic/', 'сайт для гостиницы', 8),
    t(' или '),
    link('/sozdanie-sajtov/dlya-kafe/', 'сайт для кафе', 9),
    t('.'),
  ]),
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const empty = (col: string) => sql.raw(`("${col}" IS NULL OR "${col}" = '')`)

  for (const [table, slug, descr, m] of TERMS) {
    const tb = sql.raw(`"${table}"`)
    await db.execute(sql`UPDATE ${tb} SET "description" = ${descr} WHERE "slug" = ${slug} AND (${empty('description')} OR "description" IN (${OLD_TERM_DESCR[0]}, ${OLD_TERM_DESCR[1]}))`)
    await db.execute(sql`UPDATE ${tb} SET "meta_title" = ${m.title} WHERE "slug" = ${slug} AND ${empty('meta_title')}`)
    await db.execute(sql`UPDATE ${tb} SET "meta_description" = ${m.description} WHERE "slug" = ${slug} AND ${empty('meta_description')}`)
    await db.execute(sql`UPDATE ${tb} SET "meta_focus_keyword" = ${m.focus} WHERE "slug" = ${slug} AND ${empty('meta_focus_keyword')}`)
    if (m.answer) await db.execute(sql`UPDATE ${tb} SET "meta_answer" = ${m.answer} WHERE "slug" = ${slug} AND ${empty('meta_answer')}`)
  }

  for (const [slug, focus, answer] of SERVICES) {
    await db.execute(sql`UPDATE "services" SET "meta_focus_keyword" = ${focus} WHERE "slug" = ${slug} AND ${empty('meta_focus_keyword')}`)
    await db.execute(sql`UPDATE "services" SET "meta_answer" = ${answer} WHERE "slug" = ${slug} AND ${empty('meta_answer')}`)
  }

  for (const [slug, focus, answer] of POSTS) {
    await db.execute(sql`UPDATE "posts" SET "meta_focus_keyword" = ${focus} WHERE "slug" = ${slug} AND ${empty('meta_focus_keyword')}`)
    await db.execute(sql`UPDATE "posts" SET "meta_answer" = ${answer} WHERE "slug" = ${slug} AND ${empty('meta_answer')}`)
  }

  for (const [slug, title] of DOC_TITLES) {
    await db.execute(sql`UPDATE "pages" SET "meta_title" = ${title} WHERE "slug" = ${slug} AND ${empty('meta_title')}`)
  }

  await db.execute(sql`UPDATE "faq_page" SET "seo_title" = ${FAQ_META.title} WHERE ${empty('seo_title')}`)
  await db.execute(sql`UPDATE "faq_page" SET "seo_description" = ${FAQ_META.description} WHERE ${empty('seo_description')}`)
  await db.execute(sql`UPDATE "faq_page" SET "seo_focus_keyword" = ${FAQ_META.focus} WHERE ${empty('seo_focus_keyword')}`)

  // ссылки в статье — только если их там ещё нет
  await db.execute(sql`
    UPDATE "posts"
    SET "content" = jsonb_set("content", '{root,children}', ("content"->'root'->'children') || ${JSON.stringify(WP_LINKS)}::jsonb)
    WHERE "slug" = 'wordpress-ili-konstruktor-sajtov-2026'
      AND "content" ? 'root'
      AND position('/sozdanie-sajtov/' in "content"::text) = 0
  `)

  // у статей есть черновики: админка открывает последнюю версию — правим и её, иначе изменения пропадут при следующем сохранении
  for (const [slug, focus, answer] of POSTS) {
    await db.execute(sql`UPDATE "_posts_v" SET "version_meta_focus_keyword" = ${focus} WHERE "latest" = true AND "version_slug" = ${slug} AND ${empty('version_meta_focus_keyword')}`)
    await db.execute(sql`UPDATE "_posts_v" SET "version_meta_answer" = ${answer} WHERE "latest" = true AND "version_slug" = ${slug} AND ${empty('version_meta_answer')}`)
  }
  await db.execute(sql`
    UPDATE "_posts_v"
    SET "version_content" = jsonb_set("version_content", '{root,children}', ("version_content"->'root'->'children') || ${JSON.stringify(WP_LINKS)}::jsonb)
    WHERE "latest" = true AND "version_slug" = 'wordpress-ili-konstruktor-sajtov-2026'
      AND "version_content" ? 'root'
      AND position('/sozdanie-sajtov/' in "version_content"::text) = 0
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {}
