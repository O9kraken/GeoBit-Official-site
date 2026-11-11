import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Идемпотентно: безопасно повторять после восстановления контента из дампа
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_meta_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "services_meta_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "projects_meta_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "posts_meta_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_posts_v_version_meta_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "service_categories_meta_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "portfolio_categories_meta_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "categories_meta_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "seo_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title_template" varchar DEFAULT '%s — GeoBit',
  	"default_image_id" integer,
  	"ai_search" boolean DEFAULT true,
  	"ai_training" boolean DEFAULT true,
  	"llms_enabled" boolean DEFAULT true,
  	"llms_intro" varchar,
  	"index_now" boolean DEFAULT true,
  	"index_now_key" varchar,
  	"robots_extra" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_focus_keyword" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_synonyms" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_answer" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_noindex" boolean;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_nofollow" boolean;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_canonical" varchar;
  ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "meta_focus_keyword" varchar;
  ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "meta_synonyms" varchar;
  ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "meta_answer" varchar;
  ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "meta_noindex" boolean;
  ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "meta_nofollow" boolean;
  ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "meta_canonical" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_focus_keyword" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_synonyms" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_answer" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_noindex" boolean;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_nofollow" boolean;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_canonical" varchar;
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "meta_focus_keyword" varchar;
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "meta_synonyms" varchar;
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "meta_answer" varchar;
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "meta_noindex" boolean;
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "meta_nofollow" boolean;
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "meta_canonical" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_meta_focus_keyword" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_meta_synonyms" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_meta_answer" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_meta_noindex" boolean;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_meta_nofollow" boolean;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_meta_canonical" varchar;
  ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "meta_focus_keyword" varchar;
  ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "meta_synonyms" varchar;
  ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "meta_answer" varchar;
  ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "meta_noindex" boolean;
  ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "meta_nofollow" boolean;
  ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "meta_canonical" varchar;
  ALTER TABLE "portfolio_categories" ADD COLUMN IF NOT EXISTS "meta_focus_keyword" varchar;
  ALTER TABLE "portfolio_categories" ADD COLUMN IF NOT EXISTS "meta_synonyms" varchar;
  ALTER TABLE "portfolio_categories" ADD COLUMN IF NOT EXISTS "meta_answer" varchar;
  ALTER TABLE "portfolio_categories" ADD COLUMN IF NOT EXISTS "meta_noindex" boolean;
  ALTER TABLE "portfolio_categories" ADD COLUMN IF NOT EXISTS "meta_nofollow" boolean;
  ALTER TABLE "portfolio_categories" ADD COLUMN IF NOT EXISTS "meta_canonical" varchar;
  ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_focus_keyword" varchar;
  ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_synonyms" varchar;
  ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_answer" varchar;
  ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_noindex" boolean;
  ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_nofollow" boolean;
  ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_canonical" varchar;
  ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "seo_focus_keyword" varchar;
  ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "seo_synonyms" varchar;
  ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "seo_answer" varchar;
  ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean;
  ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "seo_nofollow" boolean;
  ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar;
  ALTER TABLE "services_page" ADD COLUMN IF NOT EXISTS "seo_focus_keyword" varchar;
  ALTER TABLE "services_page" ADD COLUMN IF NOT EXISTS "seo_synonyms" varchar;
  ALTER TABLE "services_page" ADD COLUMN IF NOT EXISTS "seo_answer" varchar;
  ALTER TABLE "services_page" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean;
  ALTER TABLE "services_page" ADD COLUMN IF NOT EXISTS "seo_nofollow" boolean;
  ALTER TABLE "services_page" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar;
  ALTER TABLE "about_page" ADD COLUMN IF NOT EXISTS "seo_focus_keyword" varchar;
  ALTER TABLE "about_page" ADD COLUMN IF NOT EXISTS "seo_synonyms" varchar;
  ALTER TABLE "about_page" ADD COLUMN IF NOT EXISTS "seo_answer" varchar;
  ALTER TABLE "about_page" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean;
  ALTER TABLE "about_page" ADD COLUMN IF NOT EXISTS "seo_nofollow" boolean;
  ALTER TABLE "about_page" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar;
  ALTER TABLE "contacts_page" ADD COLUMN IF NOT EXISTS "seo_focus_keyword" varchar;
  ALTER TABLE "contacts_page" ADD COLUMN IF NOT EXISTS "seo_synonyms" varchar;
  ALTER TABLE "contacts_page" ADD COLUMN IF NOT EXISTS "seo_answer" varchar;
  ALTER TABLE "contacts_page" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean;
  ALTER TABLE "contacts_page" ADD COLUMN IF NOT EXISTS "seo_nofollow" boolean;
  ALTER TABLE "contacts_page" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar;
  ALTER TABLE "portfolio_page" ADD COLUMN IF NOT EXISTS "seo_focus_keyword" varchar;
  ALTER TABLE "portfolio_page" ADD COLUMN IF NOT EXISTS "seo_synonyms" varchar;
  ALTER TABLE "portfolio_page" ADD COLUMN IF NOT EXISTS "seo_answer" varchar;
  ALTER TABLE "portfolio_page" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean;
  ALTER TABLE "portfolio_page" ADD COLUMN IF NOT EXISTS "seo_nofollow" boolean;
  ALTER TABLE "portfolio_page" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar;
  ALTER TABLE "blog_page" ADD COLUMN IF NOT EXISTS "seo_focus_keyword" varchar;
  ALTER TABLE "blog_page" ADD COLUMN IF NOT EXISTS "seo_synonyms" varchar;
  ALTER TABLE "blog_page" ADD COLUMN IF NOT EXISTS "seo_answer" varchar;
  ALTER TABLE "blog_page" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean;
  ALTER TABLE "blog_page" ADD COLUMN IF NOT EXISTS "seo_nofollow" boolean;
  ALTER TABLE "blog_page" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar;
  ALTER TABLE "faq_page" ADD COLUMN IF NOT EXISTS "seo_focus_keyword" varchar;
  ALTER TABLE "faq_page" ADD COLUMN IF NOT EXISTS "seo_synonyms" varchar;
  ALTER TABLE "faq_page" ADD COLUMN IF NOT EXISTS "seo_answer" varchar;
  ALTER TABLE "faq_page" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean;
  ALTER TABLE "faq_page" ADD COLUMN IF NOT EXISTS "seo_nofollow" boolean;
  ALTER TABLE "faq_page" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar;
  DO $$ BEGIN ALTER TABLE "pages_meta_faq" ADD CONSTRAINT "pages_meta_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "services_meta_faq" ADD CONSTRAINT "services_meta_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "projects_meta_faq" ADD CONSTRAINT "projects_meta_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "posts_meta_faq" ADD CONSTRAINT "posts_meta_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "_posts_v_version_meta_faq" ADD CONSTRAINT "_posts_v_version_meta_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "service_categories_meta_faq" ADD CONSTRAINT "service_categories_meta_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "portfolio_categories_meta_faq" ADD CONSTRAINT "portfolio_categories_meta_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "categories_meta_faq" ADD CONSTRAINT "categories_meta_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_default_image_id_media_id_fk" FOREIGN KEY ("default_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "pages_meta_faq_order_idx" ON "pages_meta_faq" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_meta_faq_parent_id_idx" ON "pages_meta_faq" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "services_meta_faq_order_idx" ON "services_meta_faq" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "services_meta_faq_parent_id_idx" ON "services_meta_faq" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "projects_meta_faq_order_idx" ON "projects_meta_faq" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "projects_meta_faq_parent_id_idx" ON "projects_meta_faq" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "posts_meta_faq_order_idx" ON "posts_meta_faq" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "posts_meta_faq_parent_id_idx" ON "posts_meta_faq" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_meta_faq_order_idx" ON "_posts_v_version_meta_faq" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_meta_faq_parent_id_idx" ON "_posts_v_version_meta_faq" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "service_categories_meta_faq_order_idx" ON "service_categories_meta_faq" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "service_categories_meta_faq_parent_id_idx" ON "service_categories_meta_faq" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "portfolio_categories_meta_faq_order_idx" ON "portfolio_categories_meta_faq" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "portfolio_categories_meta_faq_parent_id_idx" ON "portfolio_categories_meta_faq" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "categories_meta_faq_order_idx" ON "categories_meta_faq" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "categories_meta_faq_parent_id_idx" ON "categories_meta_faq" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "seo_settings_default_image_idx" ON "seo_settings" USING btree ("default_image_id");
  CREATE INDEX IF NOT EXISTS "pages_meta_meta_focus_keyword_idx" ON "pages" USING btree ("meta_focus_keyword");
  CREATE INDEX IF NOT EXISTS "services_meta_meta_focus_keyword_idx" ON "services" USING btree ("meta_focus_keyword");
  CREATE INDEX IF NOT EXISTS "projects_meta_meta_focus_keyword_idx" ON "projects" USING btree ("meta_focus_keyword");
  CREATE INDEX IF NOT EXISTS "posts_meta_meta_focus_keyword_idx" ON "posts" USING btree ("meta_focus_keyword");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_meta_version_meta_focus_keyword_idx" ON "_posts_v" USING btree ("version_meta_focus_keyword");
  CREATE INDEX IF NOT EXISTS "service_categories_meta_meta_focus_keyword_idx" ON "service_categories" USING btree ("meta_focus_keyword");
  CREATE INDEX IF NOT EXISTS "portfolio_categories_meta_meta_focus_keyword_idx" ON "portfolio_categories" USING btree ("meta_focus_keyword");
  CREATE INDEX IF NOT EXISTS "categories_meta_meta_focus_keyword_idx" ON "categories" USING btree ("meta_focus_keyword");
  CREATE INDEX IF NOT EXISTS "home_seo_seo_focus_keyword_idx" ON "home" USING btree ("seo_focus_keyword");
  CREATE INDEX IF NOT EXISTS "services_page_seo_seo_focus_keyword_idx" ON "services_page" USING btree ("seo_focus_keyword");
  CREATE INDEX IF NOT EXISTS "about_page_seo_seo_focus_keyword_idx" ON "about_page" USING btree ("seo_focus_keyword");
  CREATE INDEX IF NOT EXISTS "contacts_page_seo_seo_focus_keyword_idx" ON "contacts_page" USING btree ("seo_focus_keyword");
  CREATE INDEX IF NOT EXISTS "portfolio_page_seo_seo_focus_keyword_idx" ON "portfolio_page" USING btree ("seo_focus_keyword");
  CREATE INDEX IF NOT EXISTS "blog_page_seo_seo_focus_keyword_idx" ON "blog_page" USING btree ("seo_focus_keyword");
  CREATE INDEX IF NOT EXISTS "faq_page_seo_seo_focus_keyword_idx" ON "faq_page" USING btree ("seo_focus_keyword");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_meta_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_meta_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_meta_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_meta_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_meta_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_categories_meta_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "portfolio_categories_meta_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories_meta_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "seo_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_meta_faq" CASCADE;
  DROP TABLE "services_meta_faq" CASCADE;
  DROP TABLE "projects_meta_faq" CASCADE;
  DROP TABLE "posts_meta_faq" CASCADE;
  DROP TABLE "_posts_v_version_meta_faq" CASCADE;
  DROP TABLE "service_categories_meta_faq" CASCADE;
  DROP TABLE "portfolio_categories_meta_faq" CASCADE;
  DROP TABLE "categories_meta_faq" CASCADE;
  DROP TABLE "seo_settings" CASCADE;
  DROP INDEX "pages_meta_meta_focus_keyword_idx";
  DROP INDEX "services_meta_meta_focus_keyword_idx";
  DROP INDEX "projects_meta_meta_focus_keyword_idx";
  DROP INDEX "posts_meta_meta_focus_keyword_idx";
  DROP INDEX "_posts_v_version_meta_version_meta_focus_keyword_idx";
  DROP INDEX "service_categories_meta_meta_focus_keyword_idx";
  DROP INDEX "portfolio_categories_meta_meta_focus_keyword_idx";
  DROP INDEX "categories_meta_meta_focus_keyword_idx";
  DROP INDEX "home_seo_seo_focus_keyword_idx";
  DROP INDEX "services_page_seo_seo_focus_keyword_idx";
  DROP INDEX "about_page_seo_seo_focus_keyword_idx";
  DROP INDEX "contacts_page_seo_seo_focus_keyword_idx";
  DROP INDEX "portfolio_page_seo_seo_focus_keyword_idx";
  DROP INDEX "blog_page_seo_seo_focus_keyword_idx";
  DROP INDEX "faq_page_seo_seo_focus_keyword_idx";
  ALTER TABLE "pages" DROP COLUMN "meta_focus_keyword";
  ALTER TABLE "pages" DROP COLUMN "meta_synonyms";
  ALTER TABLE "pages" DROP COLUMN "meta_answer";
  ALTER TABLE "pages" DROP COLUMN "meta_noindex";
  ALTER TABLE "pages" DROP COLUMN "meta_nofollow";
  ALTER TABLE "pages" DROP COLUMN "meta_canonical";
  ALTER TABLE "services" DROP COLUMN "meta_focus_keyword";
  ALTER TABLE "services" DROP COLUMN "meta_synonyms";
  ALTER TABLE "services" DROP COLUMN "meta_answer";
  ALTER TABLE "services" DROP COLUMN "meta_noindex";
  ALTER TABLE "services" DROP COLUMN "meta_nofollow";
  ALTER TABLE "services" DROP COLUMN "meta_canonical";
  ALTER TABLE "projects" DROP COLUMN "meta_focus_keyword";
  ALTER TABLE "projects" DROP COLUMN "meta_synonyms";
  ALTER TABLE "projects" DROP COLUMN "meta_answer";
  ALTER TABLE "projects" DROP COLUMN "meta_noindex";
  ALTER TABLE "projects" DROP COLUMN "meta_nofollow";
  ALTER TABLE "projects" DROP COLUMN "meta_canonical";
  ALTER TABLE "posts" DROP COLUMN "meta_focus_keyword";
  ALTER TABLE "posts" DROP COLUMN "meta_synonyms";
  ALTER TABLE "posts" DROP COLUMN "meta_answer";
  ALTER TABLE "posts" DROP COLUMN "meta_noindex";
  ALTER TABLE "posts" DROP COLUMN "meta_nofollow";
  ALTER TABLE "posts" DROP COLUMN "meta_canonical";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_focus_keyword";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_synonyms";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_answer";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_noindex";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_nofollow";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_canonical";
  ALTER TABLE "service_categories" DROP COLUMN "meta_focus_keyword";
  ALTER TABLE "service_categories" DROP COLUMN "meta_synonyms";
  ALTER TABLE "service_categories" DROP COLUMN "meta_answer";
  ALTER TABLE "service_categories" DROP COLUMN "meta_noindex";
  ALTER TABLE "service_categories" DROP COLUMN "meta_nofollow";
  ALTER TABLE "service_categories" DROP COLUMN "meta_canonical";
  ALTER TABLE "portfolio_categories" DROP COLUMN "meta_focus_keyword";
  ALTER TABLE "portfolio_categories" DROP COLUMN "meta_synonyms";
  ALTER TABLE "portfolio_categories" DROP COLUMN "meta_answer";
  ALTER TABLE "portfolio_categories" DROP COLUMN "meta_noindex";
  ALTER TABLE "portfolio_categories" DROP COLUMN "meta_nofollow";
  ALTER TABLE "portfolio_categories" DROP COLUMN "meta_canonical";
  ALTER TABLE "categories" DROP COLUMN "meta_focus_keyword";
  ALTER TABLE "categories" DROP COLUMN "meta_synonyms";
  ALTER TABLE "categories" DROP COLUMN "meta_answer";
  ALTER TABLE "categories" DROP COLUMN "meta_noindex";
  ALTER TABLE "categories" DROP COLUMN "meta_nofollow";
  ALTER TABLE "categories" DROP COLUMN "meta_canonical";
  ALTER TABLE "home" DROP COLUMN "seo_focus_keyword";
  ALTER TABLE "home" DROP COLUMN "seo_synonyms";
  ALTER TABLE "home" DROP COLUMN "seo_answer";
  ALTER TABLE "home" DROP COLUMN "seo_noindex";
  ALTER TABLE "home" DROP COLUMN "seo_nofollow";
  ALTER TABLE "home" DROP COLUMN "seo_canonical";
  ALTER TABLE "services_page" DROP COLUMN "seo_focus_keyword";
  ALTER TABLE "services_page" DROP COLUMN "seo_synonyms";
  ALTER TABLE "services_page" DROP COLUMN "seo_answer";
  ALTER TABLE "services_page" DROP COLUMN "seo_noindex";
  ALTER TABLE "services_page" DROP COLUMN "seo_nofollow";
  ALTER TABLE "services_page" DROP COLUMN "seo_canonical";
  ALTER TABLE "about_page" DROP COLUMN "seo_focus_keyword";
  ALTER TABLE "about_page" DROP COLUMN "seo_synonyms";
  ALTER TABLE "about_page" DROP COLUMN "seo_answer";
  ALTER TABLE "about_page" DROP COLUMN "seo_noindex";
  ALTER TABLE "about_page" DROP COLUMN "seo_nofollow";
  ALTER TABLE "about_page" DROP COLUMN "seo_canonical";
  ALTER TABLE "contacts_page" DROP COLUMN "seo_focus_keyword";
  ALTER TABLE "contacts_page" DROP COLUMN "seo_synonyms";
  ALTER TABLE "contacts_page" DROP COLUMN "seo_answer";
  ALTER TABLE "contacts_page" DROP COLUMN "seo_noindex";
  ALTER TABLE "contacts_page" DROP COLUMN "seo_nofollow";
  ALTER TABLE "contacts_page" DROP COLUMN "seo_canonical";
  ALTER TABLE "portfolio_page" DROP COLUMN "seo_focus_keyword";
  ALTER TABLE "portfolio_page" DROP COLUMN "seo_synonyms";
  ALTER TABLE "portfolio_page" DROP COLUMN "seo_answer";
  ALTER TABLE "portfolio_page" DROP COLUMN "seo_noindex";
  ALTER TABLE "portfolio_page" DROP COLUMN "seo_nofollow";
  ALTER TABLE "portfolio_page" DROP COLUMN "seo_canonical";
  ALTER TABLE "blog_page" DROP COLUMN "seo_focus_keyword";
  ALTER TABLE "blog_page" DROP COLUMN "seo_synonyms";
  ALTER TABLE "blog_page" DROP COLUMN "seo_answer";
  ALTER TABLE "blog_page" DROP COLUMN "seo_noindex";
  ALTER TABLE "blog_page" DROP COLUMN "seo_nofollow";
  ALTER TABLE "blog_page" DROP COLUMN "seo_canonical";
  ALTER TABLE "faq_page" DROP COLUMN "seo_focus_keyword";
  ALTER TABLE "faq_page" DROP COLUMN "seo_synonyms";
  ALTER TABLE "faq_page" DROP COLUMN "seo_answer";
  ALTER TABLE "faq_page" DROP COLUMN "seo_noindex";
  ALTER TABLE "faq_page" DROP COLUMN "seo_nofollow";
  ALTER TABLE "faq_page" DROP COLUMN "seo_canonical";`)
}
