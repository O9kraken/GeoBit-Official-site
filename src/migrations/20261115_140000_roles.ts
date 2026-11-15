import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Роли в админке. Все, кто уже есть, становятся администраторами; новым по умолчанию — «Редактор». */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'manager');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "enum_users_role" DEFAULT 'admin' NOT NULL;
  UPDATE "users" SET "role" = 'admin' WHERE "role" IS NULL;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor';
  ALTER TABLE "prospects" ALTER COLUMN "score" SET DEFAULT -1;
  UPDATE "prospects" SET "score" = -1 WHERE "score" IS NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "prospects" ALTER COLUMN "score" DROP DEFAULT;
  ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
  DROP TYPE IF EXISTS "public"."enum_users_role";`)
}
