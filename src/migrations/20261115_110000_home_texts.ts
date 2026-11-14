import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Тексты главной (15.11.2026): от первого лица, без шаблонных фраз, с ключами «создание сайтов под ключ, Севастополь, Крым».
 * Поля, сохранённые в админке со старыми значениями, обнуляются — тогда работает новый текст из кода.
 * Если текст в админке уже меняли — он не трогается.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "home" SET "about_title" = NULL WHERE "about_title" LIKE '%Цифровые продукты%с душой%';
  UPDATE "home" SET "about_text1" = NULL WHERE "about_text1" LIKE 'Веб-студия GeoBit занимается разработкой и созданием сайтов под ключ%';
  UPDATE "home" SET "about_text2" = NULL WHERE "about_text2" LIKE 'Заказать сайт в GeoBit — значит получить не просто красивую картинку%';
  UPDATE "home" SET "about_projects" = '10+' WHERE "about_projects" = '19+';
  UPDATE "home" SET "process_tag" = NULL WHERE "process_tag" = 'Как мы работаем';
  UPDATE "home" SET "process_title" = NULL WHERE "process_title" = 'Процесс <span class="gradient-text">работы</span>';
  UPDATE "home" SET "cta_title" = NULL WHERE "cta_title" = 'Готовы создать <span class="gradient-text">крутой сайт</span>?';
  UPDATE "home" SET "seo_description" = 'Создание сайтов под ключ в Севастополе и Крыму: лендинги от 29 900 ₽, корпоративные сайты и магазины, дизайн с нуля и SEO. Работаю по всей России.'
    WHERE "seo_description" LIKE 'Создание сайтов под ключ: закажите разработку сайта в студии GeoBit%';
  `)
}

export async function down(_: MigrateDownArgs): Promise<void> {}
