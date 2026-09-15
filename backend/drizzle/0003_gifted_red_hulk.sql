ALTER TYPE "manual_deposit_method" ADD VALUE 'payment_link';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_closures" (
	"thread_user_id" uuid PRIMARY KEY NOT NULL,
	"message" text,
	"closed_by" uuid,
	"closed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_link_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "manual_deposits" ADD COLUMN "payment_link_account_id" uuid;--> statement-breakpoint
ALTER TABLE "manual_deposits" ADD COLUMN "gateway_reference" varchar(100);--> statement-breakpoint
ALTER TABLE "payment_settings" ADD COLUMN "payment_link_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "chat_globally_closed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "chat_globally_closed_message" text;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "maintenance_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "maintenance_message" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_closures" ADD CONSTRAINT "chat_closures_thread_user_id_users_id_fk" FOREIGN KEY ("thread_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_closures" ADD CONSTRAINT "chat_closures_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_link_accounts" ADD CONSTRAINT "payment_link_accounts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manual_deposits" ADD CONSTRAINT "manual_deposits_payment_link_account_id_payment_link_accounts_id_fk" FOREIGN KEY ("payment_link_account_id") REFERENCES "public"."payment_link_accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
