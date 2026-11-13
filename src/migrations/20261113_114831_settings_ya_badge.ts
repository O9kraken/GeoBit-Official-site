import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ADD COLUMN "yandex_org_id" varchar;
  ALTER TABLE "settings" ADD COLUMN "yandex_badge" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP COLUMN "yandex_org_id";
  ALTER TABLE "settings" DROP COLUMN "yandex_badge";`)
}
