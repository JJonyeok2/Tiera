CREATE TABLE IF NOT EXISTS "usage_daily" (
	"source" text NOT NULL,
	"date" date NOT NULL,
	"author" text NOT NULL,
	"tokens" bigint NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_daily_source_date_author_pk" PRIMARY KEY("source","date","author")
);
