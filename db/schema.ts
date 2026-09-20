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

// --- 도구(tool) 축 — SPEC 23 -----------------------------------------------
//
// 모델의 분류축(category: 코딩/글쓰기/추론/멀티모달)은 "능력"이다.
// 도구의 분류축은 "용도"다. 사용자는 추론 능력이 좋은 걸 찾지 않고
// 발표자료 만들 것을 찾는다. 그래서 두 enum을 섞지 않고 따로 둔다.

/** 도구 용도. 화면의 탭이 이 값 그대로다. */
export const toolPurposeEnum = pgEnum("tool_purpose", [
  "CHAT", // 범용 대화
  "RESEARCH", // 자료조사·논문
  "TRANSLATE", // 번역·글쓰기
  "SLIDES", // 발표자료·디자인
  "NOTE", // 기록·정리
  "IMAGE", // 이미지 생성
  "VIDEO", // 영상 생성
  "AVATAR", // 말하는 아바타 영상
  "AUDIO", // 음악·목소리
  "CODE", // 코딩·앱 만들기
]);

/**
 * 과금 형태.
 *
 * TRIAL을 FREEMIUM과 가른 이유가 이 enum의 존재 이유다.
 * 런웨이 무료 125크레딧은 **일회성**이라 5초 영상 두 개면 끝나고 갱신되지 않는다.
 * 이걸 FREEMIUM으로 적으면 "무료로 쓸 수 있다"고 읽히고, 사용자는 가입하고 나서야
 * 속은 걸 안다. 우리가 그 오해에 가담하지 않으려면 값이 따로 있어야 한다.
 */
export const pricingKindEnum = pgEnum("pricing_kind", [
  "FREE", // 개인 사용은 사실상 전액 무료
  "FREEMIUM", // 무료 한도가 **갱신된다**
  "TRIAL", // 체험만 — 일회성이거나 카드 등록이 필요하다
  "PAID", // 무료 진입 자체가 없다
]);

/**
 * 한국어 지원 정도.
 *
 * UNKNOWN을 값으로 둔다. 확인 못한 것을 PARTIAL로 적당히 적으면 그 순간 거짓말이고,
 * 칸을 비우면 "한국어 안 됨"으로 읽힌다. 모르는 건 모른다고 화면에 쓴다.
 */
export const koreanLevelEnum = pgEnum("korean_level", [
  "NATIVE", // 한국 서비스이거나 그에 준함
  "GOOD", // UI·출력 모두 한국어로 무리 없음
  "PARTIAL", // 한국어 입력은 되지만 UI가 영어이거나 품질이 떨어짐
  "NONE", // 영어 전용
  "UNKNOWN", // 확인 못함
]);

export const platformEnum = pgEnum("platform", [
  "WEB",
  "IOS",
  "ANDROID",
  "DESKTOP",
  "EXTENSION",
  "PLUGIN",
]);

/**
 * 한국에서 만든 것인지.
 *
 * developer.country(US/CN/KR)로 대신할 수 없다. 도구 제작사에는 캔바(호주),
 * 사이스페이스(인도)처럼 3개국 밖이 섞여 있는데, 우리가 답해야 하는 질문은
 * "어느 나라냐"가 아니라 **"한국 건가"** 하나뿐이다. 그래서 2값으로 둔다.
 */
export const toolOriginEnum = pgEnum("tool_origin", ["KR", "GLOBAL"]);

/** 도구 평가 4축 — 모델의 category와 의도적으로 분리했다. SPEC 23.6 */
export const toolAxisEnum = pgEnum("tool_axis", [
  "EASE", // 쉬움 — 처음 써도 할 만한가
  "OUTPUT", // 결과물 — 나온 게 실제로 쓸 만한가
  "PRICE", // 가격 — 값어치를 하는가
  "KOREAN", // 한국어 — 한국어로 잘 되는가
]);

/** 도구 집계 단위 = 4축 + 종합 */
export const toolScopeEnum = pgEnum("tool_scope", [
  "OVERALL",
  "EASE",
  "OUTPUT",
  "PRICE",
  "KOREAN",
]);

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
    /**
     * 이 모델을 쓰는 도구. null이면 도구에 묶이지 않은 API 전용 모델이다.
     *
     * 302개를 손으로 붙이지 않는다 — 수집 때 개발사 → 기본 도구 규칙으로
     * 채우고 예외만 손본다(SPEC 23.4). 사람이 채운 값은 수집이 덮어쓰지 않는다.
     */
    toolId: text("tool_id").references(() => tools.id, { onDelete: "set null" }),
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
  (t) => [
    index("model_developer_idx").on(t.developerId),
    index("model_published_idx").on(t.isPublished),
    index("model_tool_idx").on(t.toolId),
  ]
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

// --- 도구 ------------------------------------------------------------------

/**
 * 도구 = 일반인이 실제로 여는 제품. SPEC 23.3
 *
 * 모델과 층이 다르다. 사람은 gpt-5.6-sol을 쓰지 않고 ChatGPT를 쓴다.
 * Seedance도 도구가 아니라 모델이다 — 사람이 여는 건 Dreamina이고,
 * Seedance는 그 안에서 고르는 이름이다. 이 구분이 안 서면 목록이
 * 다시 개발자용 순위표로 돌아간다.
 */
export const tools = pgTable(
  "tool",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),

    /**
     * 제작사와 도구는 다대일이지만, developer 테이블로 다 받을 수 없다.
     * developer.country가 US/CN/KR 3값이라 캔바(호주)·사이스페이스(인도)가 안 들어간다.
     * 그래서 표시용 이름은 maker(text)로 받고, developerId는 **모델을 가진
     * 제작사일 때만** 채운다. 23.4의 "개발사 → 기본 도구" 자동 매핑이
     * 이 컬럼을 타고 돈다 (OpenAI의 모델 → ChatGPT).
     */
    maker: text("maker").notNull(),
    developerId: text("developer_id").references(() => developers.id),

    /** 대표 용도. 목록에서 이 도구가 기본으로 놓이는 자리다. */
    purpose: toolPurposeEnum("purpose").notNull(),
    /**
     * 겸하는 용도.
     *
     * 이게 없으면 목록이 거짓말을 한다. ChatGPT는 대화 도구이면서 이미지도 만들고
     * 코드도 짠다. purpose를 하나만 두면 "이미지 만들려면?" 탭에 ChatGPT가 안 뜨는데,
     * 일반인에게 제일 쓸모 있는 답이 바로 **"이미 쓰는 챗GPT로도 된다"**이다.
     *
     * 반대로 각 기능을 따로 도구로 쪼개면(나노바나나·GPT-Image-2를 별도 항목으로)
     * 그건 도구가 아니라 모델을 늘어놓는 것이라 23.3이 세운 구분이 무너진다.
     * 하나의 도구, 여러 용도 — 이 컬럼이 그 둘 사이를 지킨다.
     */
    alsoFor: toolPurposeEnum("also_for").array().notNull().default([]),
    origin: toolOriginEnum("origin").notNull().default("GLOBAL"),

    /** 한 줄 설명 — "뭘 해주는 도구인지". 비전문가가 읽을 문장이어야 한다. */
    summary: text("summary").notNull(),
    /** 시작하는 법 — 가입·설치·첫 사용. 디스코드 필수 같은 특이사항 포함. */
    howToStart: text("how_to_start"),

    pricingKind: pricingKindEnum("pricing_kind").notNull(),
    /**
     * 가격 서술. **숫자를 박지 않는다.**
     * 조사 6개월 구간에서만 ChatGPT Pro 2단계 신설, Google AI Ultra 인하,
     * v0 $90→$30 인하가 있었다. 정가를 적으면 적는 순간부터 틀리기 시작한다.
     * 대신 "무료가 갱신되는지"처럼 잘 안 변하는 사실을 쓴다.
     */
    priceNote: text("price_note"),
    /** 대학생 무료·할인이 있는가. 마감이 있는 혜택이라 시의성 자체가 정보다. */
    studentFree: boolean("student_free").notNull().default(false),

    koreanLevel: koreanLevelEnum("korean_level").notNull().default("UNKNOWN"),
    /** 한국어 관련 구체 사항. "영상에 한글이 깨진다" 같은 것. */
    koreanNote: text("korean_note"),

    siteUrl: text("site_url").notNull(),
    /**
     * 카드·상세에 띄울 로고 경로. 비어 있으면 이름 첫 글자 타일로 떨어진다.
     *
     * **로고를 직접 그리지 않는다.** 남의 상표를 흉내 내 SVG로 만드는 건
     * 재현이다. 여기 들어가는 건 각 서비스가 자기 도메인에 올려둔 파비콘을
     * 받아 self-host한 것이고(scripts/fetch-logos.ts), 디렉터리가 대상을
     * 식별하려고 쓰는 용도다.
     *
     * 값은 '/logos/chatgpt.png'처럼 public 기준 절대 경로를 쓴다. 외부 URL을
     * 그대로 박지 않는다 — 방문자 브라우저가 제3자에 37번 요청하게 되고,
     * 폰트를 self-host한 이유를 스스로 뒤집는 꼴이 된다.
     */
    logoUrl: text("logo_url"),
    platforms: platformEnum("platforms").array().notNull().default(["WEB"]),

    /** 카드에 크게 띄울 주의사항. 무료로 오해하기 쉬운 것 등. */
    caution: text("caution"),

    status: modelStatusEnum("status").notNull().default("PROVISIONAL"),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("tool_purpose_idx").on(t.purpose),
    index("tool_published_idx").on(t.isPublished),
    index("tool_origin_idx").on(t.origin),
  ]
);

export const toolReviews = pgTable(
  "tool_review",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    comment: text("comment"),
    // 모델 리뷰와 같은 규칙: 익명은 표시만 감춘다. 작성자는 서버가 계속 안다.
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tool_review_user_tool_uq").on(t.userId, t.toolId),
    index("tool_review_tool_created_idx").on(t.toolId, t.createdAt),
  ]
);

export const toolReviewRatings = pgTable(
  "tool_review_rating",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    reviewId: text("review_id")
      .notNull()
      .references(() => toolReviews.id, { onDelete: "cascade" }),
    axis: toolAxisEnum("axis").notNull(),
    /** 1~5 정수. "평가 안 함"은 행을 만들지 않는 것으로 표현한다. */
    score: integer("score").notNull(),
  },
  (t) => [uniqueIndex("tool_review_rating_uq").on(t.reviewId, t.axis)]
);

/**
 * 도구 집계 캐시.
 *
 * 모델 쪽 model_score와 한 테이블로 합치지 않았다. 축 enum이 다르기 때문이다
 * (scope는 코딩/글쓰기/추론/멀티모달, tool_scope는 쉬움/결과물/가격/한국어).
 * 한 컬럼에 두 enum을 섞으면 어떤 행에 어떤 값이 유효한지가 코드에만 남는다.
 *
 * 모델 쪽과 같은 제약이 그대로 적용된다:
 *   랭킹 조회는 이 캐시만 읽는다. tool_review를 런타임에 집계하지 말 것.
 */
export const toolScores = pgTable(
  "tool_score",
  {
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    scope: toolScopeEnum("scope").notNull(),
    raw: doublePrecision("raw").notNull(),
    /** 노출값 — 베이지안 보정 후 */
    score: doublePrecision("score").notNull(),
    sampleCount: integer("sample_count").notNull(),
    tier: tierEnum("tier").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.toolId, t.scope] }),
    index("tool_score_rank_idx").on(t.scope, t.score),
  ]
);

// --- Relations -------------------------------------------------------------

export const developersRelations = relations(developers, ({ many }) => ({
  models: many(models),
  tools: many(tools),
}));

export const toolsRelations = relations(tools, ({ one, many }) => ({
  developer: one(developers, { fields: [tools.developerId], references: [developers.id] }),
  models: many(models),
  reviews: many(toolReviews),
  scores: many(toolScores),
}));

export const toolReviewsRelations = relations(toolReviews, ({ one, many }) => ({
  user: one(users, { fields: [toolReviews.userId], references: [users.id] }),
  tool: one(tools, { fields: [toolReviews.toolId], references: [tools.id] }),
  ratings: many(toolReviewRatings),
}));

export const toolReviewRatingsRelations = relations(toolReviewRatings, ({ one }) => ({
  review: one(toolReviews, { fields: [toolReviewRatings.reviewId], references: [toolReviews.id] }),
}));

export const toolScoresRelations = relations(toolScores, ({ one }) => ({
  tool: one(tools, { fields: [toolScores.toolId], references: [tools.id] }),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
  developer: one(developers, { fields: [models.developerId], references: [developers.id] }),
  tool: one(tools, { fields: [models.toolId], references: [tools.id] }),
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

export type ToolPurpose = (typeof toolPurposeEnum.enumValues)[number];
export type PricingKind = (typeof pricingKindEnum.enumValues)[number];
export type KoreanLevel = (typeof koreanLevelEnum.enumValues)[number];
export type Platform = (typeof platformEnum.enumValues)[number];
export type ToolOrigin = (typeof toolOriginEnum.enumValues)[number];
export type ToolAxis = (typeof toolAxisEnum.enumValues)[number];
export type ToolScope = (typeof toolScopeEnum.enumValues)[number];
/* Footer: db/schema.ts */
