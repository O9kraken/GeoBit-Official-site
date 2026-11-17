import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN CREATE TYPE "public"."enum_contracts_client_type" AS ENUM('company', 'ip', 'person'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_contracts_terms_payment" AS ENUM('prepay100', 'half', 'thirds', 'monthly'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_contracts_terms_hosting" AS ENUM('client', 'executor'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_contracts_terms_content" AS ENUM('client', 'executor'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_contracts_status" AS ENUM('draft', 'sent', 'signed', 'done', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_contracts_kind" AS ENUM('dev', 'seo', 'design'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_contract_templates_kind" AS ENUM('dev', 'seo', 'design'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE TABLE IF NOT EXISTS "contracts_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "contracts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"date" timestamp(3) with time zone,
  	"customer" varchar,
  	"client_name" varchar,
  	"client_type" "enum_contracts_client_type" DEFAULT 'company',
  	"client_inn" varchar,
  	"client_kpp" varchar,
  	"client_ogrn" varchar,
  	"client_signer" varchar,
  	"client_signer_gen" varchar,
  	"client_basis" varchar DEFAULT 'Устава',
  	"client_address" varchar,
  	"client_passport" varchar,
  	"client_bank_account" varchar,
  	"client_bank_name" varchar,
  	"client_bik" varchar,
  	"client_corr_account" varchar,
  	"client_phone" varchar,
  	"client_email" varchar,
  	"terms_plan" varchar,
  	"terms_price" numeric,
  	"terms_payment" "enum_contracts_terms_payment" DEFAULT 'half',
  	"terms_days" numeric,
  	"terms_revisions" numeric DEFAULT 2,
  	"terms_warranty_days" numeric DEFAULT 30,
  	"terms_concepts" numeric DEFAULT 3,
  	"terms_min_months" numeric DEFAULT 3,
  	"terms_hosting" "enum_contracts_terms_hosting" DEFAULT 'client',
  	"terms_content" "enum_contracts_terms_content" DEFAULT 'client',
  	"terms_support_months" numeric,
  	"terms_site" varchar,
  	"terms_credit" boolean DEFAULT true,
  	"terms_extra" varchar,
  	"doc_title" varchar,
  	"scope" varchar,
  	"status" "enum_contracts_status" DEFAULT 'draft',
  	"service_id" integer,
  	"template_id" integer,
  	"kind" "enum_contracts_kind" DEFAULT 'dev',
  	"lead_id" integer,
  	"prospect_id" integer,
  	"token" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "contract_templates_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "contract_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum_contract_templates_kind" DEFAULT 'dev' NOT NULL,
  	"doc_title" varchar,
  	"subject" varchar,
  	"scope" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "contract_templates_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "contract_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"fio" varchar,
  	"inn" varchar,
  	"address" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"site" varchar DEFAULT 'getgeobit.ru',
  	"bank_account" varchar,
  	"bank_name" varchar,
  	"bik" varchar,
  	"corr_account" varchar,
  	"city" varchar DEFAULT 'Севастополь',
  	"revisions" numeric DEFAULT 2,
  	"warranty_days" numeric DEFAULT 30,
  	"accept_days" numeric DEFAULT 5,
  	"penalty" numeric DEFAULT 0.1,
  	"penalty_cap" numeric DEFAULT 10,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "customer" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "contracts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "contract_templates_id" integer;
  DO $$ BEGIN ALTER TABLE "contracts_sections" ADD CONSTRAINT "contracts_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "contracts" ADD CONSTRAINT "contracts_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "contracts" ADD CONSTRAINT "contracts_template_id_contract_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."contract_templates"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "contracts" ADD CONSTRAINT "contracts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "contracts" ADD CONSTRAINT "contracts_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "contract_templates_sections" ADD CONSTRAINT "contract_templates_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contract_templates"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "contract_templates_rels" ADD CONSTRAINT "contract_templates_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contract_templates"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "contract_templates_rels" ADD CONSTRAINT "contract_templates_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "contracts_sections_order_idx" ON "contracts_sections" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "contracts_sections_parent_id_idx" ON "contracts_sections" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "contracts_status_idx" ON "contracts" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "contracts_service_idx" ON "contracts" USING btree ("service_id");
  CREATE INDEX IF NOT EXISTS "contracts_template_idx" ON "contracts" USING btree ("template_id");
  CREATE INDEX IF NOT EXISTS "contracts_lead_idx" ON "contracts" USING btree ("lead_id");
  CREATE INDEX IF NOT EXISTS "contracts_prospect_idx" ON "contracts" USING btree ("prospect_id");
  CREATE INDEX IF NOT EXISTS "contracts_token_idx" ON "contracts" USING btree ("token");
  CREATE INDEX IF NOT EXISTS "contracts_updated_at_idx" ON "contracts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "contracts_created_at_idx" ON "contracts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "contract_templates_sections_order_idx" ON "contract_templates_sections" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "contract_templates_sections_parent_id_idx" ON "contract_templates_sections" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "contract_templates_updated_at_idx" ON "contract_templates" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "contract_templates_created_at_idx" ON "contract_templates" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "contract_templates_rels_order_idx" ON "contract_templates_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "contract_templates_rels_parent_idx" ON "contract_templates_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "contract_templates_rels_path_idx" ON "contract_templates_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "contract_templates_rels_services_id_idx" ON "contract_templates_rels" USING btree ("services_id");
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contracts_fk" FOREIGN KEY ("contracts_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contract_templates_fk" FOREIGN KEY ("contract_templates_id") REFERENCES "public"."contract_templates"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_contracts_id_idx" ON "payload_locked_documents_rels" USING btree ("contracts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_contract_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("contract_templates_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contracts_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contracts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contract_templates_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contract_templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contract_templates_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contract_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contracts_sections" CASCADE;
  DROP TABLE "contracts" CASCADE;
  DROP TABLE "contract_templates_sections" CASCADE;
  DROP TABLE "contract_templates" CASCADE;
  DROP TABLE "contract_templates_rels" CASCADE;
  DROP TABLE "contract_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contracts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contract_templates_fk";
  
  DROP INDEX "payload_locked_documents_rels_contracts_id_idx";
  DROP INDEX "payload_locked_documents_rels_contract_templates_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contracts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contract_templates_id";
  DROP TYPE "public"."enum_contracts_client_type";
  DROP TYPE "public"."enum_contracts_terms_payment";
  DROP TYPE "public"."enum_contracts_terms_hosting";
  DROP TYPE "public"."enum_contracts_terms_content";
  DROP TYPE "public"."enum_contracts_status";
  DROP TYPE "public"."enum_contracts_kind";
  DROP TYPE "public"."enum_contract_templates_kind";`)
}
