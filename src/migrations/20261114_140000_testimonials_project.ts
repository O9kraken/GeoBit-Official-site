import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Отзывы ↔ кейсы: связь testimonials.project_ref_id → projects.
 * Отзыв кофейни привязывается к кейсу «Кофе Бу», если ещё не привязан.
 * В кейсе «Кофе Бу» метрика «0 ₽ абонентской платы» меняется на реальный тариф поддержки.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "project_ref_id" integer;
  DO $$ BEGIN
    ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_project_ref_id_projects_id_fk"
      FOREIGN KEY ("project_ref_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "testimonials_project_ref_idx" ON "testimonials" USING btree ("project_ref_id");

  UPDATE "testimonials" t SET "project_ref_id" = p.id
    FROM "projects" p
   WHERE p.slug = 'kofe-bu' AND t.project_ref_id IS NULL
     AND (t.position ILIKE '%Кофе%Бу%' OR t.project ILIKE '%меню%');

  UPDATE "projects_results" r SET "value" = '5 000 ₽/мес', "label" = 'поддержка и обновления, хостинг отдельно'
    FROM "projects" p
   WHERE r._parent_id = p.id AND p.slug = 'kofe-bu' AND r.value = '0 ₽';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "testimonials" DROP CONSTRAINT IF EXISTS "testimonials_project_ref_id_projects_id_fk";
  DROP INDEX IF EXISTS "testimonials_project_ref_idx";
  ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "project_ref_id";
  `)
}
