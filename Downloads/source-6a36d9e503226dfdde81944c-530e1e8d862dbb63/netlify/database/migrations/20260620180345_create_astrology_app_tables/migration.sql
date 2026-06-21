CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_history" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "astro_scores" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"career_score" integer DEFAULT 0 NOT NULL,
	"love_score" integer DEFAULT 0 NOT NULL,
	"finance_score" integer DEFAULT 0 NOT NULL,
	"health_score" integer DEFAULT 0 NOT NULL,
	"spiritual_score" integer DEFAULT 0 NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "astro_timeline" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"event_date" date NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"intensity" integer DEFAULT 5 NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compatibility_reports" (
	"id" serial PRIMARY KEY,
	"requested_by_id" text,
	"person1_name" text NOT NULL,
	"person1_dob" date NOT NULL,
	"person1_time_of_birth" text,
	"person1_place_of_birth" text,
	"person1_sun_sign" text,
	"person2_name" text NOT NULL,
	"person2_dob" date NOT NULL,
	"person2_time_of_birth" text,
	"person2_place_of_birth" text,
	"person2_sun_sign" text,
	"overall_score" integer,
	"emotional_score" integer,
	"marriage_score" integer,
	"communication_score" integer,
	"report_text" text,
	"strengths" jsonb,
	"challenges" jsonb,
	"language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_predictions" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"overall_energy" integer,
	"career_energy" integer,
	"love_energy" integer,
	"finance_energy" integer,
	"health_energy" integer,
	"lucky_color" text,
	"lucky_number" integer,
	"short_prediction" text,
	"full_prediction" text,
	"morning_message" text,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_reports" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"career_outlook" text,
	"financial_outlook" text,
	"relationship_outlook" text,
	"health_outlook" text,
	"key_dates" jsonb,
	"opportunities" jsonb,
	"warnings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planetary_transits" (
	"id" serial PRIMARY KEY,
	"planet" text NOT NULL,
	"from_sign" text,
	"to_sign" text NOT NULL,
	"transit_date" date NOT NULL,
	"description" text,
	"impact" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"name" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"subscription_expires_at" timestamp,
	"date_of_birth" date,
	"time_of_birth" text,
	"place_of_birth" text,
	"latitude" real,
	"longitude" real,
	"sun_sign" text,
	"moon_sign" text,
	"rising_sign" text,
	"login_streak" integer DEFAULT 0 NOT NULL,
	"last_login_date" date,
	"total_logins" integer DEFAULT 0 NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"push_notifications" boolean DEFAULT false NOT NULL,
	"whatsapp_notifications" boolean DEFAULT false NOT NULL,
	"whatsapp_number" text,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yearly_reports" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"year" integer NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"best_career_months" jsonb,
	"best_investment_months" jsonb,
	"best_travel_months" jsonb,
	"marriage_opportunities" text,
	"business_opportunities" text,
	"overall_theme" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ai_chat_history" ADD CONSTRAINT "ai_chat_history_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "astro_scores" ADD CONSTRAINT "astro_scores_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "astro_timeline" ADD CONSTRAINT "astro_timeline_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "compatibility_reports" ADD CONSTRAINT "compatibility_reports_requested_by_id_users_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "daily_predictions" ADD CONSTRAINT "daily_predictions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "yearly_reports" ADD CONSTRAINT "yearly_reports_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");