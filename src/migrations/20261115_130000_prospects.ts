import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** «Поиск клиентов»: таблица потенциальных клиентов и ключ 2ГИС в настройках */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_prospects_site_status" AS ENUM('unchecked', 'none', 'social', 'down', 'old', 'weak', 'ok');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_prospects_status" AS ENUM('new', 'contacted', 'interested', 'offer', 'client', 'rejected', 'skip');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_prospects_source" AS ENUM('osm', '2gis', 'manual');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE TABLE IF NOT EXISTS "prospects" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "niche" varchar,
    "category" varchar,
    "city" varchar,
    "address" varchar,
    "phone" varchar,
    "email" varchar,
    "website" varchar,
    "socials" varchar,
    "hours" varchar,
    "site_status" "enum_prospects_site_status" DEFAULT 'unchecked',
    "score" numeric,
    "site_notes" varchar,
    "site_title" varchar,
    "site_final_url" varchar,
    "site_ms" numeric,
    "site_checked_at" timestamp(3) with time zone,
    "status" "enum_prospects_status" DEFAULT 'new',
    "next_at" timestamp(3) with time zone,
    "note" varchar,
    "source" "enum_prospects_source" DEFAULT 'manual',
    "source_key" varchar,
    "lat" numeric,
    "lon" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "prospects_id" integer;
  ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "dgis_api_key" varchar;
  CREATE INDEX IF NOT EXISTS "prospects_phone_idx" ON "prospects" USING btree ("phone");
  CREATE INDEX IF NOT EXISTS "prospects_site_status_idx" ON "prospects" USING btree ("site_status");
  CREATE INDEX IF NOT EXISTS "prospects_score_idx" ON "prospects" USING btree ("score");
  CREATE INDEX IF NOT EXISTS "prospects_status_idx" ON "prospects" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "prospects_source_key_idx" ON "prospects" USING btree ("source_key");
  CREATE INDEX IF NOT EXISTS "prospects_updated_at_idx" ON "prospects" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "prospects_created_at_idx" ON "prospects" USING btree ("created_at");
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_prospects_fk" FOREIGN KEY ("prospects_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_prospects_id_idx" ON "payload_locked_documents_rels" USING btree ("prospects_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_prospects_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_prospects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "prospects_id";
  DROP TABLE IF EXISTS "prospects" CASCADE;
  ALTER TABLE "settings" DROP COLUMN IF EXISTS "dgis_api_key";
  DROP TYPE IF EXISTS "public"."enum_prospects_site_status";
  DROP TYPE IF EXISTS "public"."enum_prospects_status";
  DROP TYPE IF EXISTS "public"."enum_prospects_source";`)
}
