import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Новые колонки в списках пользователей и заявок: сбрасываем сохранённый набор колонок, чтобы они показались сразу */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`UPDATE "payload_preferences" SET "value" = "value" - 'columns' WHERE "key" IN ('collection-users', 'collection-leads') AND jsonb_typeof("value") = 'object';`)
}

export async function down({}: MigrateDownArgs): Promise<void> {}
