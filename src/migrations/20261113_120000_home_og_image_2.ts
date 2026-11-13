import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Главная: на сайте в «SEO и ИИ» стояла ещё одна картинка со старым логотипом (Frame-4.webp).
 * Убираем ссылку на неё (и на другие Frame-*.webp), чтобы подставлялась фирменная карточка /og/.
 * Сами файлы в медиатеке не удаляются. Идемпотентно.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "home" SET "seo_image_id" = NULL
  WHERE "seo_image_id" IN (SELECT "id" FROM "media" WHERE "filename" LIKE 'Frame-%');
  UPDATE "seo_settings" SET "default_image_id" = NULL
  WHERE "default_image_id" IN (SELECT "id" FROM "media" WHERE "filename" LIKE 'Frame-%');
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {}
