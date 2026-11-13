import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Title услуг — с городом (Севастополь и Крым), описания юридических страниц.
 * Меняется только то, что не правили вручную в админке (сравнение со старым значением). Идемпотентно.
 */
const TITLES: [string, string, string][] = [
  ['landing-page', 'Разработка лендинга под ключ — создание landing page | GeoBit', 'Разработка лендинга в Севастополе и Крыму — от 29 900 ₽ | GeoBit'],
  ['site-vizit', 'Создание сайта-визитки под ключ — разработка визитки | GeoBit', 'Создание сайта-визитки в Севастополе и Крыму | GeoBit'],
  ['corp-site', 'Разработка корпоративного сайта под ключ — создание сайта для компании | GeoBit', 'Корпоративный сайт под ключ в Севастополе и Крыму | GeoBit'],
  ['shops', 'Разработка интернет-магазина под ключ — создание магазина на WordPress | GeoBit', 'Создание интернет-магазина в Севастополе и Крыму | GeoBit'],
  ['seo-prodvizhenie', 'SEO-продвижение и раскрутка сайта — цена | GeoBit', 'SEO-продвижение сайтов в Севастополе и Крыму | GeoBit'],
  ['design-logo', 'Разработка логотипа на заказ — создание логотипа компании | GeoBit', 'Разработка логотипа на заказ в Севастополе | GeoBit'],
  ['site-disign', 'Дизайн сайта на заказ — разработка дизайна сайтов и логотипа | GeoBit', 'Дизайн сайта на заказ в Севастополе и Крыму | GeoBit'],
  ['firmennyy-stil', 'Фирменный стиль и логотип | GeoBit', 'Фирменный стиль и логотип в Севастополе | GeoBit'],
]

const DESCR: [string, string][] = [
  ['oferta', 'Публичная оферта GeoBit на разработку сайтов, дизайна и логотипов: порядок заказа, сроки, стоимость и оплата, права на результат, гарантии и ответственность.'],
  ['soglasie-pd', 'Согласие на обработку персональных данных при отправке заявки на сайте GeoBit: какие данные, для чего и как долго обрабатываются, как отозвать согласие.'],
  ['soglasie-rassylka', 'Согласие на получение рассылки GeoBit: какие письма приходят подписчикам, как часто, и как отписаться в любой момент.'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [slug, from, to] of TITLES) {
    await db.execute(sql`UPDATE "services" SET "meta_title" = ${to} WHERE "slug" = ${slug} AND ("meta_title" = ${from} OR "meta_title" IS NULL OR "meta_title" = '')`)
  }
  for (const [slug, d] of DESCR) {
    await db.execute(sql`UPDATE "pages" SET "meta_description" = ${d} WHERE "slug" = ${slug} AND ("meta_description" IS NULL OR "meta_description" = '')`)
  }
}

export async function down({}: MigrateDownArgs): Promise<void> {}
