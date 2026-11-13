import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Главная: убрать старую картинку для соцсетей (Frame-5.webp со старым логотипом),
 * чтобы подставлялась новая фирменная карточка /og/. Данные не удаляются — только ссылка.
 * Идемпотентно.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "home" SET "seo_image_id" = NULL
  WHERE "seo_image_id" IN (SELECT "id" FROM "media" WHERE "filename" = 'Frame-5.webp');
  UPDATE "seo_settings" SET "default_image_id" = NULL
  WHERE "default_image_id" IN (SELECT "id" FROM "media" WHERE "filename" = 'Frame-5.webp');
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {}
