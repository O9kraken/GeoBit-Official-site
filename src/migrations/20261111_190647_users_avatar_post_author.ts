import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Идемпотентно: можно выполнять повторно (например, после восстановления контента из дампа)
  await db.execute(sql`
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "author_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_author_id" integer;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_id" integer;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "about" varchar;
  DO $$ BEGIN
    ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_author_idx" ON "_posts_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "users_avatar_idx" ON "users" USING btree ("avatar_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_users_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_author_id_users_id_fk";
  
  ALTER TABLE "users" DROP CONSTRAINT "users_avatar_id_media_id_fk";
  
  DROP INDEX "posts_author_idx";
  DROP INDEX "_posts_v_version_version_author_idx";
  DROP INDEX "users_avatar_idx";
  ALTER TABLE "posts" DROP COLUMN "author_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_author_id";
  ALTER TABLE "users" DROP COLUMN "avatar_id";
  ALTER TABLE "users" DROP COLUMN "about";`)
}
