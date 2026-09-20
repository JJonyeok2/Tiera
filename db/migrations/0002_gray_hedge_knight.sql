CREATE TYPE "public"."korean_level" AS ENUM('NATIVE', 'GOOD', 'PARTIAL', 'NONE', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('WEB', 'IOS', 'ANDROID', 'DESKTOP', 'EXTENSION', 'PLUGIN');--> statement-breakpoint
CREATE TYPE "public"."pricing_kind" AS ENUM('FREE', 'FREEMIUM', 'TRIAL', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."tool_axis" AS ENUM('EASE', 'OUTPUT', 'PRICE', 'KOREAN');--> statement-breakpoint
CREATE TYPE "public"."tool_origin" AS ENUM('KR', 'GLOBAL');--> statement-breakpoint
CREATE TYPE "public"."tool_purpose" AS ENUM('CHAT', 'RESEARCH', 'TRANSLATE', 'SLIDES', 'NOTE', 'IMAGE', 'VIDEO', 'AVATAR', 'AUDIO', 'CODE');--> statement-breakpoint
CREATE TYPE "public"."tool_scope" AS ENUM('OVERALL', 'EASE', 'OUTPUT', 'PRICE', 'KOREAN');--> statement-breakpoint
CREATE TABLE "tool_review_rating" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"axis" "tool_axis" NOT NULL,
	"score" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_review" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tool_id" text NOT NULL,
	"comment" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_score" (
	"tool_id" text NOT NULL,
	"scope" "tool_scope" NOT NULL,
	"raw" double precision NOT NULL,
	"score" double precision NOT NULL,
	"sample_count" integer NOT NULL,
	"tier" "tier" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tool_score_tool_id_scope_pk" PRIMARY KEY("tool_id","scope")
);
--> statement-breakpoint
CREATE TABLE "tool" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"maker" text NOT NULL,
	"developer_id" text,
	"purpose" "tool_purpose" NOT NULL,
	"also_for" "tool_purpose"[] DEFAULT '{}' NOT NULL,
	"origin" "tool_origin" DEFAULT 'GLOBAL' NOT NULL,
	"summary" text NOT NULL,
	"how_to_start" text,
	"pricing_kind" "pricing_kind" NOT NULL,
	"price_note" text,
	"student_free" boolean DEFAULT false NOT NULL,
	"korean_level" "korean_level" DEFAULT 'UNKNOWN' NOT NULL,
	"korean_note" text,
	"site_url" text NOT NULL,
	"platforms" "platform"[] DEFAULT '{"WEB"}' NOT NULL,
	"caution" text,
	"status" "model_status" DEFAULT 'PROVISIONAL' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tool_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "model" ADD COLUMN "tool_id" text;--> statement-breakpoint
ALTER TABLE "tool_review_rating" ADD CONSTRAINT "tool_review_rating_review_id_tool_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."tool_review"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_review" ADD CONSTRAINT "tool_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_review" ADD CONSTRAINT "tool_review_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_score" ADD CONSTRAINT "tool_score_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool" ADD CONSTRAINT "tool_developer_id_developer_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tool_review_rating_uq" ON "tool_review_rating" USING btree ("review_id","axis");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_review_user_tool_uq" ON "tool_review" USING btree ("user_id","tool_id");--> statement-breakpoint
CREATE INDEX "tool_review_tool_created_idx" ON "tool_review" USING btree ("tool_id","created_at");--> statement-breakpoint
CREATE INDEX "tool_score_rank_idx" ON "tool_score" USING btree ("scope","score");--> statement-breakpoint
CREATE INDEX "tool_purpose_idx" ON "tool" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "tool_published_idx" ON "tool" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "tool_origin_idx" ON "tool" USING btree ("origin");--> statement-breakpoint
ALTER TABLE "model" ADD CONSTRAINT "model_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "model_tool_idx" ON "model" USING btree ("tool_id");