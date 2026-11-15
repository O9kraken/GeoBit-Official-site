import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Поиск клиентов: потенциал, ссылка на КП, отметки «написали» и «открыл КП» */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "potential" numeric DEFAULT -1;
  ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "potential_why" varchar;
  ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "contacted_at" timestamp(3) with time zone;
  ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "kp_viewed_at" timestamp(3) with time zone;
  ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "niche_key" varchar;
  ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "kp_token" varchar;
  UPDATE "prospects" SET "potential" = -1 WHERE "potential" IS NULL;
  UPDATE "prospects" SET "kp_token" = md5(random()::text || "id"::text || clock_timestamp()::text) WHERE "kp_token" IS NULL;
  CREATE INDEX IF NOT EXISTS "prospects_potential_idx" ON "prospects" USING btree ("potential");
  CREATE INDEX IF NOT EXISTS "prospects_kp_token_idx" ON "prospects" USING btree ("kp_token");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "prospects_potential_idx";
  DROP INDEX IF EXISTS "prospects_kp_token_idx";
  ALTER TABLE "prospects" DROP COLUMN IF EXISTS "potential";
  ALTER TABLE "prospects" DROP COLUMN IF EXISTS "potential_why";
  ALTER TABLE "prospects" DROP COLUMN IF EXISTS "contacted_at";
  ALTER TABLE "prospects" DROP COLUMN IF EXISTS "kp_viewed_at";
  ALTER TABLE "prospects" DROP COLUMN IF EXISTS "niche_key";
  ALTER TABLE "prospects" DROP COLUMN IF EXISTS "kp_token";`)
}
