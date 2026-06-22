ALTER TYPE "public"."token_type" ADD VALUE 'parental_consent';--> statement-breakpoint
CREATE TABLE "parental_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"guardian_name" varchar(255) NOT NULL,
	"guardian_email" varchar(255) NOT NULL,
	"terms_version" varchar(50) NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parental_consents" ADD CONSTRAINT "parental_consents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parental_consents" ADD CONSTRAINT "parental_consents_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "parental_consents_tenant_student_idx" ON "parental_consents" USING btree ("tenant_id","student_id");
