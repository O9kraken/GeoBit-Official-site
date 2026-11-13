import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Поле «Профили на площадках» в настройках сайта (sameAs разметки организации и llms.txt).
 * Заполняет его профилем Profi.ru и номер организации в Яндекс Бизнесе, если они ещё пустые.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "profile_links" varchar;`)
  await db.execute(sql`UPDATE "settings" SET "profile_links" = 'https://profi.ru/profile/KalyakovGA/' WHERE "profile_links" IS NULL OR "profile_links" = '';`)
  await db.execute(sql`UPDATE "settings" SET "yandex_org_id" = '53335813213' WHERE "yandex_org_id" IS NULL OR "yandex_org_id" = '';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "settings" DROP COLUMN IF EXISTS "profile_links";`)
}
