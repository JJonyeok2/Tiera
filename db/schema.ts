/* ---------------------------------------------------------------------------
 * Header: Tiera 데이터 모델 (Drizzle / PostgreSQL)
 * SPEC 6절 기준.
 *
 * 핵심 제약 하나만 기억하면 된다:
 *   랭킹 조회는 항상 집계 캐시(modelScores)만 읽는다.
 *   reviews를 런타임에 집계하는 쿼리를 절대 만들지 말 것.
 * ------------------------------------------------------------------------- */

import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Enums -----------------------------------------------------------------

/** 개발사 국적. SPEC 13절 #7 — 미국·중국·한국 3개국 고정. */
export const countryEnum = pgEnum("country", ["US", "CN", "KR"]);

/** 사용자가 직접 평가하는 항목. 종합(OVERALL)은 입력이 아니라 파생값이다. */
export const categoryEnum = pgEnum("category", [
  "CODING",
  "WRITING",
  "REASONING",
  "MULTIMODAL",
]);

/** 집계 단위 = Category + OVERALL */
export const scoreScopeEnum = pgEnum("score_scope", [
  "OVERALL",
  "CODING",
  "WRITING",
  "REASONING",
  "MULTIMODAL",
]);

export const scoreTypeEnum = pgEnum("score_type", ["COMMUNITY", "BENCHMARK"]);
export const tierEnum = pgEnum("tier", ["PRISM", "GOLD", "SILVER", "BRONZE"]);

/** CERTIFIED(공인) = 종합 평가 수가 신뢰 임계 m 이상. 미만이면 PROVISIONAL(평가 중). */
export const modelStatusEnum = pgEnum("model_status", ["CERTIFIED", "PROVISIONAL"]);
export const modalityEnum = pgEnum("modality", ["TEXT", "IMAGE", "AUDIO", "VIDEO"]);
export const roleEnum = pgEnum("role", ["USER", "ADMIN"]);

// --- Auth.js ---------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").notNull().default("USER"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// --- 도메인 ----------------------------------------------------------------

export const developers = pgTable("developer", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  country: countryEnum("country").notNull(),
  siteUrl: text("site_url"),
});

export const models = pgTable(
  "model",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    developerId: text("developer_id")
      .notNull()
      .references(() => developers.id),
    description: text("description"),
    releasedAt: date("released_at", { mode: "date" }),
    contextWindow: integer("context_window"),
    inputPricePerM: numeric("input_price_per_m", { precision: 10, scale: 4 }),
    outputPricePerM: numeric("output_price_per_m", { precision: 10, scale: 4 }),
    modalities: modalityEnum("modalities").array().notNull().default(["TEXT"]),
    isOpenWeight: boolean("is_open_weight").notNull().default(false),
    status: modelStatusEnum("status").notNull().default("PROVISIONAL"),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("model_developer_idx").on(t.developerId), index("model_published_idx").on(t.isPublished)]
);

export const reviews = pgTable(
  "review",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    modelId: text("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    comment: text("comment"),
    // 익명은 "표시만" 감춘다. 작성자는 서버가 계속 알고 있어야 1인 1회 제약과
    // 수정·삭제 권한이 유지된다. 로그인 없이 받는 익명이 아니다.
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    // 1인 1모델 1리뷰 — 어뷰징 방지의 1차 방어선. 앱 로직이 아니라 DB 제약으로 건다.
    uniqueIndex("review_user_model_uq").on(t.userId, t.modelId),
    index("review_model_created_idx").on(t.modelId, t.createdAt),
  ]
);

export const reviewRatings = pgTable(
  "review_rating",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    category: categoryEnum("category").notNull(),
    /** 1~5 정수. "평가 안 함"은 행을 만들지 않는 것으로 표현한다. */
    score: integer("score").notNull(),
  },
  (t) => [uniqueIndex("review_rating_uq").on(t.reviewId, t.category)]
);

/** 집계 캐시. 리뷰/벤치마크 변경 시 갱신된다. */
export const modelScores = pgTable(
  "model_score",
  {
    modelId: text("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    scoreType: scoreTypeEnum("score_type").notNull(),
    scope: scoreScopeEnum("scope").notNull(),
    /** 보정 전 원점수 */
    raw: doublePrecision("raw").notNull(),
    /** 노출값 — COMMUNITY는 베이지안 보정 후 */
    score: doublePrecision("score").notNull(),
    /** 평가 수(COMMUNITY) 또는 반영 벤치마크 수(BENCHMARK) */
    sampleCount: integer("sample_count").notNull(),
    tier: tierEnum("tier").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.modelId, t.scoreType, t.scope] }),
    index("model_score_rank_idx").on(t.scoreType, t.scope, t.score),
  ]
);

export const benchmarks = pgTable("benchmark", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** null이면 특정 카테고리에 속하지 않고 종합에만 반영된다. */
  category: categoryEnum("category"),
  unit: text("unit").notNull(),
  higherIsBetter: boolean("higher_is_better").notNull().default(true),
  weight: doublePrecision("weight").notNull().default(1),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
});

export const benchmarkResults = pgTable(
  "benchmark_result",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    modelId: text("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    benchmarkId: text("benchmark_id")
      .notNull()
      .references(() => benchmarks.id, { onDelete: "cascade" }),
    value: doublePrecision("value").notNull(),
    measuredAt: date("measured_at", { mode: "date" }).notNull(),
    sourceUrl: text("source_url"),
  },
  (t) => [uniqueIndex("benchmark_result_uq").on(t.modelId, t.benchmarkId)]
);

/** 순위 변동(▲2/▼1) 계산용 일일 스냅샷. */
export const rankSnapshots = pgTable(
  "rank_snapshot",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    modelId: text("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    scoreType: scoreTypeEnum("score_type").notNull(),
    scope: scoreScopeEnum("scope").notNull(),
    rank: integer("rank").notNull(),
    score: doublePrecision("score").notNull(),
    date: date("date", { mode: "string" }).notNull(),
  },
  (t) => [
    uniqueIndex("rank_snapshot_uq").on(t.modelId, t.scoreType, t.scope, t.date),
    index("rank_snapshot_date_idx").on(t.date, t.scoreType, t.scope),
  ]
);

// --- Relations -------------------------------------------------------------

export const developersRelations = relations(developers, ({ many }) => ({
  models: many(models),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
  developer: one(developers, { fields: [models.developerId], references: [developers.id] }),
  reviews: many(reviews),
  scores: many(modelScores),
  benchmarkResults: many(benchmarkResults),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  model: one(models, { fields: [reviews.modelId], references: [models.id] }),
  ratings: many(reviewRatings),
}));

export const reviewRatingsRelations = relations(reviewRatings, ({ one }) => ({
  review: one(reviews, { fields: [reviewRatings.reviewId], references: [reviews.id] }),
}));

export const modelScoresRelations = relations(modelScores, ({ one }) => ({
  model: one(models, { fields: [modelScores.modelId], references: [models.id] }),
}));

export const benchmarkResultsRelations = relations(benchmarkResults, ({ one }) => ({
  model: one(models, { fields: [benchmarkResults.modelId], references: [models.id] }),
  benchmark: one(benchmarks, { fields: [benchmarkResults.benchmarkId], references: [benchmarks.id] }),
}));

export type Country = (typeof countryEnum.enumValues)[number];
export type Category = (typeof categoryEnum.enumValues)[number];
export type ScoreScope = (typeof scoreScopeEnum.enumValues)[number];
export type ScoreType = (typeof scoreTypeEnum.enumValues)[number];
export type TierName = (typeof tierEnum.enumValues)[number];
/* Footer: db/schema.ts */
