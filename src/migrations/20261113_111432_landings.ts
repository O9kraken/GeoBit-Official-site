import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_landings_kind" AS ENUM('city', 'industry', 'region');
  CREATE TABLE "landings_explainer_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "landings_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "landings_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "landings_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE "landings_meta_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE "landings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"card_title" varchar,
  	"short_desc" varchar,
  	"price" varchar,
  	"duration" varchar,
  	"icon" varchar DEFAULT 'fas fa-location-dot',
  	"image_id" integer,
  	"explainer_title" varchar,
  	"explainer_text" varchar,
  	"features_title" varchar,
  	"slug" varchar NOT NULL,
  	"kind" "enum_landings_kind" DEFAULT 'city' NOT NULL,
  	"place" varchar,
  	"order" numeric DEFAULT 0,
  	"meta_focus_keyword" varchar,
  	"meta_synonyms" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_answer" varchar,
  	"meta_noindex" boolean,
  	"meta_nofollow" boolean,
  	"meta_canonical" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "landings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"projects_id" integer
  );
  
  ALTER TABLE "redirects_rels" ADD COLUMN "landings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "landings_id" integer;
  ALTER TABLE "landings_explainer_points" ADD CONSTRAINT "landings_explainer_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_features" ADD CONSTRAINT "landings_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_steps" ADD CONSTRAINT "landings_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_faq" ADD CONSTRAINT "landings_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_meta_faq" ADD CONSTRAINT "landings_meta_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings" ADD CONSTRAINT "landings_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landings" ADD CONSTRAINT "landings_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landings_rels" ADD CONSTRAINT "landings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_rels" ADD CONSTRAINT "landings_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_rels" ADD CONSTRAINT "landings_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "landings_explainer_points_order_idx" ON "landings_explainer_points" USING btree ("_order");
  CREATE INDEX "landings_explainer_points_parent_id_idx" ON "landings_explainer_points" USING btree ("_parent_id");
  CREATE INDEX "landings_features_order_idx" ON "landings_features" USING btree ("_order");
  CREATE INDEX "landings_features_parent_id_idx" ON "landings_features" USING btree ("_parent_id");
  CREATE INDEX "landings_steps_order_idx" ON "landings_steps" USING btree ("_order");
  CREATE INDEX "landings_steps_parent_id_idx" ON "landings_steps" USING btree ("_parent_id");
  CREATE INDEX "landings_faq_order_idx" ON "landings_faq" USING btree ("_order");
  CREATE INDEX "landings_faq_parent_id_idx" ON "landings_faq" USING btree ("_parent_id");
  CREATE INDEX "landings_meta_faq_order_idx" ON "landings_meta_faq" USING btree ("_order");
  CREATE INDEX "landings_meta_faq_parent_id_idx" ON "landings_meta_faq" USING btree ("_parent_id");
  CREATE INDEX "landings_image_idx" ON "landings" USING btree ("image_id");
  CREATE UNIQUE INDEX "landings_slug_idx" ON "landings" USING btree ("slug");
  CREATE INDEX "landings_meta_meta_focus_keyword_idx" ON "landings" USING btree ("meta_focus_keyword");
  CREATE INDEX "landings_meta_meta_image_idx" ON "landings" USING btree ("meta_image_id");
  CREATE INDEX "landings_updated_at_idx" ON "landings" USING btree ("updated_at");
  CREATE INDEX "landings_created_at_idx" ON "landings" USING btree ("created_at");
  CREATE INDEX "landings_rels_order_idx" ON "landings_rels" USING btree ("order");
  CREATE INDEX "landings_rels_parent_idx" ON "landings_rels" USING btree ("parent_id");
  CREATE INDEX "landings_rels_path_idx" ON "landings_rels" USING btree ("path");
  CREATE INDEX "landings_rels_services_id_idx" ON "landings_rels" USING btree ("services_id");
  CREATE INDEX "landings_rels_projects_id_idx" ON "landings_rels" USING btree ("projects_id");
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_landings_fk" FOREIGN KEY ("landings_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_landings_fk" FOREIGN KEY ("landings_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "redirects_rels_landings_id_idx" ON "redirects_rels" USING btree ("landings_id");
  CREATE INDEX "payload_locked_documents_rels_landings_id_idx" ON "payload_locked_documents_rels" USING btree ("landings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "landings_explainer_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landings_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landings_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landings_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landings_meta_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landings_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "landings_explainer_points" CASCADE;
  DROP TABLE "landings_features" CASCADE;
  DROP TABLE "landings_steps" CASCADE;
  DROP TABLE "landings_faq" CASCADE;
  DROP TABLE "landings_meta_faq" CASCADE;
  DROP TABLE "landings" CASCADE;
  DROP TABLE "landings_rels" CASCADE;
  ALTER TABLE "redirects_rels" DROP CONSTRAINT "redirects_rels_landings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_landings_fk";
  
  DROP INDEX "redirects_rels_landings_id_idx";
  DROP INDEX "payload_locked_documents_rels_landings_id_idx";
  ALTER TABLE "redirects_rels" DROP COLUMN "landings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "landings_id";
  DROP TYPE "public"."enum_landings_kind";`)
}
