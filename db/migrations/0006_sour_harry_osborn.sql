ALTER TABLE "tool" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tool" ADD COLUMN "content_hash" text;