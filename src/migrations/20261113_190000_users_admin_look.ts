import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Личные настройки оформления админки у пользователей: цвет, плотность и размер меню, иконки */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_users_ui_accent" AS ENUM('geobit', 'pink', 'blue', 'cyan', 'green', 'orange');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_users_ui_density" AS ENUM('compact', 'normal', 'comfy');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_users_ui_font_size" AS ENUM('s', 'm', 'l');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ui_accent" "enum_users_ui_accent" DEFAULT 'geobit';
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ui_density" "enum_users_ui_density" DEFAULT 'normal';
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ui_font_size" "enum_users_ui_font_size" DEFAULT 'm';
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ui_icons" boolean DEFAULT true;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "users" DROP COLUMN IF EXISTS "ui_accent";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "ui_density";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "ui_font_size";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "ui_icons";
  DROP TYPE IF EXISTS "public"."enum_users_ui_accent";
  DROP TYPE IF EXISTS "public"."enum_users_ui_density";
  DROP TYPE IF EXISTS "public"."enum_users_ui_font_size";`)
}
