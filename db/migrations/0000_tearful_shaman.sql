CREATE TYPE "public"."category" AS ENUM('CODING', 'WRITING', 'REASONING', 'MULTIMODAL');--> statement-breakpoint
CREATE TYPE "public"."country" AS ENUM('US', 'CN', 'KR');--> statement-breakpoint
CREATE TYPE "public"."modality" AS ENUM('TEXT', 'IMAGE', 'AUDIO', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."model_status" AS ENUM('CERTIFIED', 'PROVISIONAL');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."score_scope" AS ENUM('OVERALL', 'CODING', 'WRITING', 'REASONING', 'MULTIMODAL');--> statement-breakpoint
CREATE TYPE "public"."score_type" AS ENUM('COMMUNITY', 'BENCHMARK');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('PRISM', 'GOLD', 'SILVER', 'BRONZE');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "benchmark_result" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"benchmark_id" text NOT NULL,
	"value" double precision NOT NULL,
	"measured_at" date NOT NULL,
	"source_url" text
);
--> statement-breakpoint
CREATE TABLE "benchmark" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" "category",
	"unit" text NOT NULL,
	"higher_is_better" boolean DEFAULT true NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	CONSTRAINT "benchmark_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "developer" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"country" "country" NOT NULL,
	"site_url" text,
	CONSTRAINT "developer_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "model_score" (
	"model_id" text NOT NULL,
	"score_type" "score_type" NOT NULL,
	"scope" "score_scope" NOT NULL,
	"raw" double precision NOT NULL,
	"score" double precision NOT NULL,
	"sample_count" integer NOT NULL,
	"tier" "tier" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_score_model_id_score_type_scope_pk" PRIMARY KEY("model_id","score_type","scope")
);
--> statement-breakpoint
CREATE TABLE "model" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"developer_id" text NOT NULL,
	"description" text,
	"released_at" date,
	"context_window" integer,
	"input_price_per_m" numeric(10, 4),
	"output_price_per_m" numeric(10, 4),
	"modalities" "modality"[] DEFAULT '{"TEXT"}' NOT NULL,
	"is_open_weight" boolean DEFAULT false NOT NULL,
	"status" "model_status" DEFAULT 'PROVISIONAL' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rank_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"score_type" "score_type" NOT NULL,
	"scope" "score_scope" NOT NULL,
	"rank" integer NOT NULL,
	"score" double precision NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_rating" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"category" "category" NOT NULL,
	"score" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"model_id" text NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmark_result" ADD CONSTRAINT "benchmark_result_model_id_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."model"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmark_result" ADD CONSTRAINT "benchmark_result_benchmark_id_benchmark_id_fk" FOREIGN KEY ("benchmark_id") REFERENCES "public"."benchmark"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_score" ADD CONSTRAINT "model_score_model_id_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."model"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model" ADD CONSTRAINT "model_developer_id_developer_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_snapshot" ADD CONSTRAINT "rank_snapshot_model_id_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."model"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_rating" ADD CONSTRAINT "review_rating_review_id_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."review"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_model_id_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."model"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "benchmark_result_uq" ON "benchmark_result" USING btree ("model_id","benchmark_id");--> statement-breakpoint
CREATE INDEX "model_score_rank_idx" ON "model_score" USING btree ("score_type","scope","score");--> statement-breakpoint
CREATE INDEX "model_developer_idx" ON "model" USING btree ("developer_id");--> statement-breakpoint
CREATE INDEX "model_published_idx" ON "model" USING btree ("is_published");--> statement-breakpoint
CREATE UNIQUE INDEX "rank_snapshot_uq" ON "rank_snapshot" USING btree ("model_id","score_type","scope","date");--> statement-breakpoint
CREATE INDEX "rank_snapshot_date_idx" ON "rank_snapshot" USING btree ("date","score_type","scope");--> statement-breakpoint
CREATE UNIQUE INDEX "review_rating_uq" ON "review_rating" USING btree ("review_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "review_user_model_uq" ON "review" USING btree ("user_id","model_id");--> statement-breakpoint
CREATE INDEX "review_model_created_idx" ON "review" USING btree ("model_id","created_at");