DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('chat_message', 'deposit_submitted', 'deposit_approved', 'deposit_rejected', 'withdrawal_requested', 'withdrawal_approved', 'withdrawal_rejected', 'wallet_adjustment', 'referral_reward');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sms_broadcast_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"launch_date" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sms_broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message" text NOT NULL,
	"target_count" integer NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"status" "sms_broadcast_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sms_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_confirmed_enabled" boolean DEFAULT true NOT NULL,
	"withdrawal_requested_enabled" boolean DEFAULT true NOT NULL,
	"withdrawal_approved_enabled" boolean DEFAULT true NOT NULL,
	"deposit_confirmed_enabled" boolean DEFAULT true NOT NULL,
	"referral_reward_enabled" boolean DEFAULT true NOT NULL,
	"suspicious_adjustment_enabled" boolean DEFAULT true NOT NULL,
	"package_purchase_enabled" boolean DEFAULT true NOT NULL,
	"chat_message_enabled" boolean DEFAULT true NOT NULL,
	"deposit_review_enabled" boolean DEFAULT true NOT NULL,
	"admin_alert_phone" varchar(20),
	"admin_alert_phones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "withdrawal_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turn_number" smallint NOT NULL,
	"min_direct_invites" integer NOT NULL,
	"min_package_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sms_broadcasts" ADD CONSTRAINT "sms_broadcasts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sms_settings" ADD CONSTRAINT "sms_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "withdrawal_requirements" ADD CONSTRAINT "withdrawal_requirements_min_package_id_projects_id_fk" FOREIGN KEY ("min_package_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "withdrawal_requirements" ADD CONSTRAINT "withdrawal_requirements_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");