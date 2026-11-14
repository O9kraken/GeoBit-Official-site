import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * В списке блога появились колонки «Выход» и «Действия». Сохранённый набор колонок списка статей сбрасываем,
 * чтобы новые колонки показались сразу (сортировка и число строк на странице сохраняются).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`UPDATE "payload_preferences" SET "value" = "value" - 'columns' WHERE "key" = 'collection-posts' AND jsonb_typeof("value") = 'object';`)
}

export async function down({}: MigrateDownArgs): Promise<void> {}
