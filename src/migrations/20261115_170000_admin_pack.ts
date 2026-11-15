import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** История изменений, вход с кодом (2FA), напоминания о заявках, автосохранение статей, задачи по расписанию */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'publish', 'unpublish', 'delete', 'login', 'bulk'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'gbHousekeeping' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'gbHousekeeping' BEFORE 'schedulePublish';
  CREATE TABLE IF NOT EXISTS "audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"user_name" varchar,
  	"action" "enum_audit_log_action",
  	"target" varchar,
  	"target_label" varchar,
  	"doc_id" varchar,
  	"doc_title" varchar,
  	"changed" varchar,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "reminded_at" timestamp(3) with time zone;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_enabled" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_pending" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_recovery" jsonb;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_fails" numeric;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_lock_until" timestamp(3) with time zone;
  ALTER TABLE "payload_jobs" ADD COLUMN IF NOT EXISTS "meta" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "audit_log_id" integer;
  DO $$ BEGIN ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "audit_log_user_idx" ON "audit_log" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_log" USING btree ("action");
  CREATE INDEX IF NOT EXISTS "audit_log_target_idx" ON "audit_log" USING btree ("target");
  CREATE INDEX IF NOT EXISTS "audit_log_doc_id_idx" ON "audit_log" USING btree ("doc_id");
  CREATE INDEX IF NOT EXISTS "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_log_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "audit_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "audit_log" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_log_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "_posts_v_autosave_idx";
  DROP INDEX "payload_locked_documents_rels_audit_log_id_idx";
  ALTER TABLE "leads" DROP COLUMN "reminded_at";
  ALTER TABLE "_posts_v" DROP COLUMN "autosave";
  ALTER TABLE "users" DROP COLUMN "totp_enabled";
  ALTER TABLE "users" DROP COLUMN "totp_secret";
  ALTER TABLE "users" DROP COLUMN "totp_pending";
  ALTER TABLE "users" DROP COLUMN "totp_recovery";
  ALTER TABLE "users" DROP COLUMN "totp_fails";
  ALTER TABLE "users" DROP COLUMN "totp_lock_until";
  ALTER TABLE "payload_jobs" DROP COLUMN "meta";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_log_id";
  DROP TYPE "public"."enum_audit_log_action";`)
}
