/* ---------------------------------------------------------------------------
 * Header: 조회 레이어
 *
 * 랭킹은 model_score(집계 캐시)만 읽는다. review를 런타임 집계하지 않는다.
 * 순위와 괴리 판정은 SQL 윈도우 함수(RANK)로 한 번에 뽑는다 —
 * 애플리케이션에서 전체 모델을 메모리에 올려 정렬하면 페이지네이션과 어긋난다.
 * ------------------------------------------------------------------------- */

import { sql } from "drizzle-orm";
import { db } from "@/db";
import type {
  Category,
  Country,
  KoreanLevel,
  Platform,
  PricingKind,
  ScoreScope,
  ScoreType,
  TierName,
  ToolAxis,
  ToolOrigin,
  ToolPurpose,
} from "@/db/schema";
import { PURPOSES } from "@/lib/params";
import { TOOL_MIN_REVIEWS_FOR_TIER } from "@/lib/scoring/constants";
import { GAP_RANK_THRESHOLD } from "@/lib/scoring/constants";
import { gapOf, normalizeWithRange, type Gap } from "@/lib/scoring/score";

export interface RankingRow {
  slug: string;
  name: string;
  developerName: string;
  developerSlug: string;
  country: Country;
  status: "CERTIFIED" | "PROVISIONAL";
  score: number;
  tier: TierName;
  reviewCount: number;
  rank: number;
  /** 어제 대비 순위 변동. 양수면 상승. 스냅샷이 없으면 null(신규). */
  rankChange: number | null;
  gap: Gap | null;
}

export interface RankingParams {
  scoreType: ScoreType;
  scope: ScoreScope;
  country?: Country;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface RankingResult {
  rows: RankingRow[];
  total: number;
}

/**
 * 랭킹 목록.
 *
 * 순위(rank)는 필터를 적용하기 **전** 전체 집합에서 매긴다.
 * "중국 모델만" 필터를 걸었을 때 1·2·3위로 다시 번호를 매기면
 * 전체에서 몇 위인지가 사라져 필터의 의미가 없어진다.
 */
export async function getRanking(params: RankingParams): Promise<RankingResult> {
  const { scoreType, scope, country, q, limit = 20, offset = 0 } = params;
  const otherType: ScoreType = scoreType === "COMMUNITY" ? "BENCHMARK" : "COMMUNITY";
  const like = q && q.trim() ? `%${q.trim().toLowerCase()}%` : null;
  const countryParam: Country | null = country ?? null;

  const rows = await db.execute<{
    slug: string;
    name: string;
    developer_name: string;
    developer_slug: string;
    country: Country;
    status: "CERTIFIED" | "PROVISIONAL";
    score: number;
    tier: TierName;
    review_count: number;
    rank: number;
    prev_rank: number | null;
    community_rank: number | null;
    benchmark_rank: number | null;
    community_score: number | null;
    benchmark_score: number | null;
    total: number;
  }>(sql`
    WITH ranked AS (
      SELECT ms.model_id,
             ms.score,
             ms.tier,
             ms.sample_count,
             RANK() OVER (ORDER BY ms.score DESC) AS rank
      FROM model_score ms
      JOIN model m ON m.id = ms.model_id AND m.is_published
      WHERE ms.score_type = ${scoreType}::score_type AND ms.scope = ${scope}::score_scope
    ),
    other AS (
      SELECT ms.model_id, ms.score, RANK() OVER (ORDER BY ms.score DESC) AS rank
      FROM model_score ms
      JOIN model m ON m.id = ms.model_id AND m.is_published
      WHERE ms.score_type = ${otherType}::score_type AND ms.scope = ${scope}::score_scope
    ),
    prev AS (
      SELECT rs.model_id, rs.rank
      FROM rank_snapshot rs
      WHERE rs.score_type = ${scoreType}::score_type AND rs.scope = ${scope}::score_scope
        AND rs.date = (SELECT MAX(date) FROM rank_snapshot WHERE date < CURRENT_DATE)
    ),
    filtered AS (
      SELECT m.slug, m.name, m.status,
             d.name AS developer_name, d.slug AS developer_slug, d.country,
             r.score, r.tier, r.sample_count AS review_count, r.rank,
             prev.rank AS prev_rank,
             CASE WHEN ${scoreType}::text = 'COMMUNITY' THEN r.rank ELSE other.rank END AS community_rank,
             CASE WHEN ${scoreType}::text = 'BENCHMARK' THEN r.rank ELSE other.rank END AS benchmark_rank,
             CASE WHEN ${scoreType}::text = 'COMMUNITY' THEN r.score ELSE other.score END AS community_score,
             CASE WHEN ${scoreType}::text = 'BENCHMARK' THEN r.score ELSE other.score END AS benchmark_score
      FROM ranked r
      JOIN model m ON m.id = r.model_id
      JOIN developer d ON d.id = m.developer_id
      LEFT JOIN other ON other.model_id = r.model_id
      LEFT JOIN prev ON prev.model_id = r.model_id
      WHERE (${countryParam}::text IS NULL OR d.country::text = ${countryParam}::text)
        AND (${like}::text IS NULL
             OR lower(m.name) LIKE ${like}::text
             OR lower(d.name) LIKE ${like}::text)
    )
    SELECT *, COUNT(*) OVER () AS total
    FROM filtered
    ORDER BY rank ASC, name ASC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const list = rows.rows ?? [];
  return {
    total: list.length > 0 ? Number(list[0].total) : 0,
    rows: list.map((r) => ({
      slug: r.slug,
      name: r.name,
      developerName: r.developer_name,
      developerSlug: r.developer_slug,
      country: r.country,
      status: r.status,
      score: Number(r.score),
      tier: r.tier,
      reviewCount: Number(r.review_count),
      rank: Number(r.rank),
      rankChange: r.prev_rank === null ? null : Number(r.prev_rank) - Number(r.rank),
      gap: gapOf(
        r.community_rank === null ? null : Number(r.community_rank),
        r.benchmark_rank === null ? null : Number(r.benchmark_rank),
        r.community_score === null || r.benchmark_score === null
          ? null
          : Number(r.community_score) - Number(r.benchmark_score)
      ),
    })),
  };
}

export { GAP_RANK_THRESHOLD };
export type { Category };

// --- 모델 상세 -------------------------------------------------------------

export interface ScoreCell {
  score: number;
  raw: number;
  tier: TierName;
  sampleCount: number;
}

export interface BenchmarkRow {
  name: string;
  categoryLabelKey: ScoreScope | null;
  unit: string;
  value: number;
  normalized: number | null;
  measuredAt: string;
  sourceName: string;
  sourceUrl: string;
}

export interface ModelDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  developerName: string;
  developerSlug: string;
  developerSiteUrl: string | null;
  country: Country;
  status: "CERTIFIED" | "PROVISIONAL";
  releasedAt: string | null;
  contextWindow: number | null;
  inputPricePerM: string | null;
  outputPricePerM: string | null;
  modalities: string[];
  isOpenWeight: boolean;
  community: Partial<Record<ScoreScope, ScoreCell>>;
  benchmark: Partial<Record<ScoreScope, ScoreCell>>;
  communityRank: number | null;
  benchmarkRank: number | null;
  gap: Gap | null;
  benchmarks: BenchmarkRow[];
}

export async function getModelDetail(slug: string): Promise<ModelDetail | null> {
  // 네 쿼리는 서로 의존하지 않는다. 순차로 돌리면 왕복이 네 번이라,
  // 함수와 DB가 멀리 떨어져 있을 때 그대로 지연으로 쌓인다.
  const [base, scores, ranks, bench] = await Promise.all([
    db.execute<{
    id: string; slug: string; name: string; description: string | null;
    developer_name: string; developer_slug: string; developer_site_url: string | null;
    country: Country; status: "CERTIFIED" | "PROVISIONAL";
    released_at: string | null; context_window: number | null;
    input_price_per_m: string | null; output_price_per_m: string | null;
    modalities: string[] | string; is_open_weight: boolean;
  }>(sql`
    SELECT m.id, m.slug, m.name, m.description, m.status, m.released_at, m.context_window,
           m.input_price_per_m, m.output_price_per_m, m.modalities, m.is_open_weight,
           d.name AS developer_name, d.slug AS developer_slug, d.site_url AS developer_site_url,
           d.country
    FROM model m JOIN developer d ON d.id = m.developer_id
    WHERE m.slug = ${slug} AND m.is_published
    LIMIT 1
  `),

    db.execute<{
    score_type: ScoreType; scope: ScoreScope;
    score: number; raw: number; tier: TierName; sample_count: number;
  }>(sql`
    SELECT ms.score_type, ms.scope, ms.score, ms.raw, ms.tier, ms.sample_count
    FROM model_score ms JOIN model mm ON mm.id = ms.model_id
    WHERE mm.slug = ${slug}
  `),

    db.execute<{ score_type: ScoreType; rank: number }>(sql`
      WITH r AS (
        SELECT ms.model_id, ms.score_type,
               RANK() OVER (PARTITION BY ms.score_type ORDER BY ms.score DESC) AS rank
        FROM model_score ms
        JOIN model mm ON mm.id = ms.model_id AND mm.is_published
        WHERE ms.scope = 'OVERALL'
      )
      SELECT r.score_type, r.rank FROM r
      JOIN model mm ON mm.id = r.model_id WHERE mm.slug = ${slug}
    `),

    db.execute<{
      name: string; category: ScoreScope | null; unit: string; value: number;
      measured_at: string; source_name: string; source_url: string;
      min_v: number; max_v: number; cnt: number; higher_is_better: boolean;
    }>(sql`
      SELECT b.name, b.category::text AS category, b.unit, br.value,
             br.measured_at, b.source_name, b.source_url, b.higher_is_better,
             agg.min_v, agg.max_v, agg.cnt
      FROM benchmark_result br
      JOIN benchmark b ON b.id = br.benchmark_id
      JOIN model mm ON mm.id = br.model_id
      JOIN (
        SELECT benchmark_id, MIN(value) min_v, MAX(value) max_v, COUNT(*) cnt
        FROM benchmark_result GROUP BY benchmark_id
      ) agg ON agg.benchmark_id = br.benchmark_id
      WHERE mm.slug = ${slug}
      ORDER BY b.category NULLS LAST, b.name
    `),
  ]);

  const m = base.rows?.[0];
  if (!m) return null;

  const community: Partial<Record<ScoreScope, ScoreCell>> = {};
  const benchmark: Partial<Record<ScoreScope, ScoreCell>> = {};
  for (const s of scores.rows ?? []) {
    const cell: ScoreCell = {
      score: Number(s.score), raw: Number(s.raw), tier: s.tier, sampleCount: Number(s.sample_count),
    };
    (s.score_type === "COMMUNITY" ? community : benchmark)[s.scope] = cell;
  }

  let communityRank: number | null = null;
  let benchmarkRank: number | null = null;
  for (const r of ranks.rows ?? []) {
    if (r.score_type === "COMMUNITY") communityRank = Number(r.rank);
    else benchmarkRank = Number(r.rank);
  }

  const benchmarks: BenchmarkRow[] = (bench.rows ?? []).map((b) => ({
    name: b.name,
    categoryLabelKey: b.category,
    unit: b.unit,
    value: Number(b.value),
    normalized: normalizeWithRange(Number(b.value), {
      min: Number(b.min_v),
      max: Number(b.max_v),
      count: Number(b.cnt),
      higherIsBetter: b.higher_is_better,
    }),
    measuredAt: String(b.measured_at).slice(0, 10),
    sourceName: b.source_name,
    sourceUrl: b.source_url,
  }));

  return {
    id: m.id, slug: m.slug, name: m.name, description: m.description,
    developerName: m.developer_name, developerSlug: m.developer_slug,
    developerSiteUrl: m.developer_site_url, country: m.country, status: m.status,
    releasedAt: m.released_at ? String(m.released_at).slice(0, 10) : null,
    contextWindow: m.context_window === null ? null : Number(m.context_window),
    inputPricePerM: m.input_price_per_m, outputPricePerM: m.output_price_per_m,
    // enum 배열은 드라이버가 파싱해 주지 않아 '{TEXT,IMAGE}' 문자열로 올 수 있다.
    modalities: parsePgArray(m.modalities),
    isOpenWeight: m.is_open_weight,
    community, benchmark, communityRank, benchmarkRank,
    gap: gapOf(
      communityRank, benchmarkRank,
      community.OVERALL && benchmark.OVERALL ? community.OVERALL.score - benchmark.OVERALL.score : null
    ),
    benchmarks,
  };
}

/**
 * Postgres 배열 리터럴('{A,B}')과 이미 파싱된 배열을 모두 받아 string[]로 만든다.
 *
 * 왜 필요한가: node-postgres는 **커스텀 enum 배열의 OID를 모른다.** text[]·int[] 같은
 * 내장 타입은 알아서 배열로 주지만, modalities(modality[])나 also_for(tool_purpose[])는
 * '{VIDEO,AVATAR}' 문자열 그대로 온다. 타입 선언은 string[]이라 컴파일은 통과하고,
 * 런타임에 .map을 부르는 순간 터진다 — 실제로 /tools/[slug] 프리렌더가 이걸로 죽었다.
 * enum 배열 컬럼을 raw SQL로 꺼낼 때는 반드시 이걸 통과시킨다.
 */
function parsePgArray(v: string[] | string | null | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return [];
  return v.replace(/^\{|\}$/g, "").split(",").map((x) => x.trim().replace(/^"|"$/g, "")).filter(Boolean);
}


export async function getAllModelSlugs(): Promise<string[]> {
  const r = await db.execute<{ slug: string }>(sql`SELECT slug FROM model WHERE is_published`);
  return (r.rows ?? []).map((x) => x.slug);
}

// --- 비교 -----------------------------------------------------------------

export const MAX_COMPARE_MODELS = 3;

/**
 * 두 점수 종류의 모델 수를 한 번에 센다 — 전환 스위치에 붙일 숫자.
 *
 * 같은 필터(카테고리·국가·검색어)를 그대로 적용한다. "한국 모델만" 상태에서
 * 전환 칸에 전체 개수가 떠 있으면 눌렀을 때 나오는 결과와 어긋난다.
 */
export async function getScoreTypeTotals(opts: {
  scope: ScoreScope;
  country?: Country;
  q?: string;
}): Promise<Record<ScoreType, number>> {
  const countryParam: Country | null = opts.country ?? null;
  const like = opts.q ? `%${opts.q.toLowerCase()}%` : null;

  const res = await db.execute<{ score_type: ScoreType; c: number }>(sql`
    SELECT ms.score_type::text AS score_type, COUNT(*)::int AS c
    FROM model_score ms
    JOIN model m ON m.id = ms.model_id
    JOIN developer d ON d.id = m.developer_id
    WHERE ms.scope = ${opts.scope}::score_scope
      AND (${countryParam}::text IS NULL OR d.country::text = ${countryParam}::text)
      AND (${like}::text IS NULL
           OR lower(m.name) LIKE ${like}::text
           OR lower(d.name) LIKE ${like}::text)
    GROUP BY ms.score_type
  `);

  const out: Record<ScoreType, number> = { COMMUNITY: 0, BENCHMARK: 0 };
  for (const r of res.rows ?? []) out[r.score_type] = Number(r.c);
  return out;
}

export async function getCompare(slugs: string[]): Promise<ModelDetail[]> {
  const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))].slice(0, MAX_COMPARE_MODELS);
  const found = await Promise.all(unique.map((s) => getModelDetail(s)));
  return found.filter((m): m is ModelDetail => m !== null);
}

// --- 도구 (SPEC 23) ---------------------------------------------------------

export interface ToolListRow {
  slug: string;
  name: string;
  maker: string;
  purpose: ToolPurpose;
  alsoFor: ToolPurpose[];
  origin: ToolOrigin;
  summary: string;
  pricingKind: PricingKind;
  koreanLevel: KoreanLevel;
  studentFree: boolean;
  caution: string | null;
  /** 후기가 쌓이기 전에는 null이다. 0이 아니라 null이어야 "없음"과 구분된다. */
  score: number | null;
  tier: TierName | null;
  reviewCount: number;
}

export interface ToolListParams {
  purpose?: ToolPurpose;
  origin?: ToolOrigin;
  q?: string;
}

/**
 * 도구 목록.
 *
 * 모델 랭킹(getRanking)과 달리 **점수로 정렬하지 않는다.**
 * 시드 직후에는 모든 도구의 후기가 0개라, 점수 정렬은 사실상 무작위 나열이 된다.
 * 그래서 후기가 있는 것을 위로 올리고, 나머지는 고정된 순서를 쓴다 —
 * 순서가 매번 바뀌면 "아까 봤던 그거"를 다시 못 찾는다.
 *
 * 2순위가 **용도 순**인 이유:
 *   처음에는 국산을 먼저 올렸는데, 후기가 전부 0개라 국산 11개가 통째로 위로 쏠려
 *   첫 화면에서 ChatGPT·Claude·Gemini가 사라졌다. 잘 모르는 사람이 들어와서
 *   제일 먼저 찾을 것들이 스크롤 아래로 내려간 것이다.
 *   용도 enum 순서(CHAT이 첫 번째)를 따르면 범용 챗봇이 맨 위에 오고,
 *   목록 순서가 바로 위 탭 순서와도 일치한다.
 *   국산은 전용 필터가 따로 있으므로 기본 정렬까지 편들 이유가 없다.
 *
 * 용도 필터는 purpose와 also_for를 **함께** 본다. ChatGPT는 대표 용도가 대화지만
 * 이미지 탭에도 떠야 한다 — 일반인에게 가장 쓸모 있는 답이 "이미 쓰는 걸로도 된다"다.
 */
export async function getTools(params: ToolListParams = {}): Promise<ToolListRow[]> {
  const { purpose, origin, q } = params;
  const like = q && q.trim() ? `%${q.trim().toLowerCase()}%` : null;

  const rows = await db.execute<{
    slug: string;
    name: string;
    maker: string;
    purpose: ToolPurpose;
    also_for: ToolPurpose[] | string;
    origin: ToolOrigin;
    summary: string;
    pricing_kind: PricingKind;
    korean_level: KoreanLevel;
    student_free: boolean;
    caution: string | null;
    score: number | null;
    tier: TierName | null;
    review_count: number;
  }>(sql`
    SELECT
      t.slug, t.name, t.maker, t.purpose, t.also_for, t.origin, t.summary,
      t.pricing_kind, t.korean_level, t.student_free, t.caution,
      ts.score, ts.tier,
      COALESCE(ts.sample_count, 0) AS review_count
    FROM tool t
    LEFT JOIN tool_score ts ON ts.tool_id = t.id AND ts.scope = 'OVERALL'
    WHERE t.is_published
      ${purpose ? sql`AND (t.purpose = ${purpose}::tool_purpose OR ${purpose}::tool_purpose = ANY(t.also_for))` : sql``}
      ${origin ? sql`AND t.origin = ${origin}::tool_origin` : sql``}
      ${like ? sql`AND (LOWER(t.name) LIKE ${like} OR LOWER(t.maker) LIKE ${like} OR LOWER(t.summary) LIKE ${like})` : sql``}
    ORDER BY
      -- 티어를 띄울 만큼 후기가 쌓인 것만 위로 올린다.
      -- 단순히 "점수가 있으면" 으로 하면 후기 1개짜리가 37개 위에 앉는다.
      (ts.sample_count IS NULL OR ts.sample_count < ${TOOL_MIN_REVIEWS_FOR_TIER}),
      ts.score DESC NULLS LAST,
      -- 그다음 용도 순. enum 선언 순서를 그대로 쓴다(CHAT이 첫 번째).
      array_position(enum_range(NULL::tool_purpose), t.purpose),
      (t.origin = 'KR') DESC,  -- 같은 용도 안에서는 국산을 앞에
      t.name ASC
  `);

  return (rows.rows ?? []).map((r) => ({
    slug: r.slug,
    name: r.name,
    maker: r.maker,
    purpose: r.purpose,
    alsoFor: parsePgArray(r.also_for) as ToolPurpose[],
    origin: r.origin,
    summary: r.summary,
    pricingKind: r.pricing_kind,
    koreanLevel: r.korean_level,
    studentFree: r.student_free,
    caution: r.caution,
    score: r.score,
    tier: r.tier,
    reviewCount: Number(r.review_count) || 0,
  }));
}

/**
 * 용도별 개수. 탭에 숫자를 붙이기 위한 것이다.
 *
 * 목록과 같은 조건(purpose 또는 also_for)으로 세야 한다. 탭에 5라고 적혀 있는데
 * 눌렀더니 7개가 나오면 둘 중 하나가 거짓말이다.
 * purpose 필터만 빼고 나머지 필터는 그대로 적용한다 — 검색어가 걸린 상태에서
 * 탭 숫자가 전체 개수를 보여주면, 탭을 눌러도 그 숫자가 안 나온다.
 */
export async function getPurposeTotals(
  opts: { origin?: ToolOrigin; q?: string } = {}
): Promise<Record<ToolPurpose, number>> {
  const { origin, q } = opts;
  const like = q && q.trim() ? `%${q.trim().toLowerCase()}%` : null;

  const rows = await db.execute<{ purpose: ToolPurpose; n: number }>(sql`
    SELECT p AS purpose, COUNT(*)::int AS n
    FROM tool t
    -- 대표 용도와 겸하는 용도를 한 줄씩 펼쳐서 센다.
    CROSS JOIN LATERAL unnest(ARRAY[t.purpose] || t.also_for) AS p
    WHERE t.is_published
      ${origin ? sql`AND t.origin = ${origin}::tool_origin` : sql``}
      ${like ? sql`AND (LOWER(t.name) LIKE ${like} OR LOWER(t.maker) LIKE ${like} OR LOWER(t.summary) LIKE ${like})` : sql``}
    GROUP BY p
  `);

  const out = Object.fromEntries(PURPOSES.map((p) => [p, 0])) as Record<ToolPurpose, number>;
  for (const r of rows.rows ?? []) out[r.purpose] = Number(r.n) || 0;
  return out;
}

export interface ToolDetail extends ToolListRow {
  /** 후기 조회에서 slug→id 왕복을 한 번 더 하지 않도록 내려준다. */
  id: string;
  howToStart: string | null;
  priceNote: string | null;
  koreanNote: string | null;
  siteUrl: string;
  platforms: Platform[];
  /** 이 도구가 쓰는 모델. 두 층을 잇는 지점이다(SPEC 23.5). */
  models: { slug: string; name: string; score: number | null; tier: TierName | null }[];
  /** 축별 점수. 후기가 없으면 빈 객체다 — 0이 아니라 "아직 없음"이다. */
  axisScores: Partial<Record<ToolAxis, { score: number; sampleCount: number }>>;
}

export async function getToolDetail(slug: string): Promise<ToolDetail | null> {
  const rows = await db.execute<{
    id: string;
    slug: string;
    name: string;
    maker: string;
    purpose: ToolPurpose;
    also_for: ToolPurpose[] | string;
    origin: ToolOrigin;
    summary: string;
    how_to_start: string | null;
    pricing_kind: PricingKind;
    price_note: string | null;
    student_free: boolean;
    korean_level: KoreanLevel;
    korean_note: string | null;
    site_url: string;
    platforms: Platform[] | string;
    caution: string | null;
    score: number | null;
    tier: TierName | null;
    review_count: number;
  }>(sql`
    SELECT t.*, ts.score, ts.tier, COALESCE(ts.sample_count, 0) AS review_count
    FROM tool t
    LEFT JOIN tool_score ts ON ts.tool_id = t.id AND ts.scope = 'OVERALL'
    WHERE t.slug = ${slug} AND t.is_published
    LIMIT 1
  `);
  const t = rows.rows?.[0];
  if (!t) return null;

  // 축별 점수. OVERALL은 위에서 이미 조인했으므로 나머지 4축만 가져온다.
  const axes = await db.execute<{ scope: ToolAxis; score: number; sample_count: number }>(sql`
    SELECT scope, score, sample_count
    FROM tool_score
    WHERE tool_id = ${t.id} AND scope <> 'OVERALL'
  `);
  const axisScores: Partial<Record<ToolAxis, { score: number; sampleCount: number }>> = {};
  for (const a of axes.rows ?? []) {
    axisScores[a.scope] = { score: Number(a.score), sampleCount: Number(a.sample_count) };
  }

  // 이 도구가 쓰는 모델. 벤치마크 점수가 있는 것만, 높은 순으로.
  const models = await db.execute<{
    slug: string;
    name: string;
    score: number | null;
    tier: TierName | null;
  }>(sql`
    SELECT m.slug, m.name, ms.score, ms.tier
    FROM model m
    LEFT JOIN model_score ms
      ON ms.model_id = m.id AND ms.score_type = 'BENCHMARK' AND ms.scope = 'OVERALL'
    WHERE m.tool_id = ${t.id} AND m.is_published
    ORDER BY ms.score DESC NULLS LAST, m.name ASC
    LIMIT 12
  `);

  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    maker: t.maker,
    purpose: t.purpose,
    alsoFor: parsePgArray(t.also_for) as ToolPurpose[],
    origin: t.origin,
    summary: t.summary,
    howToStart: t.how_to_start,
    pricingKind: t.pricing_kind,
    priceNote: t.price_note,
    studentFree: t.student_free,
    koreanLevel: t.korean_level,
    koreanNote: t.korean_note,
    siteUrl: t.site_url,
    platforms: parsePgArray(t.platforms) as Platform[],
    caution: t.caution,
    score: t.score,
    tier: t.tier,
    reviewCount: Number(t.review_count) || 0,
    models: models.rows ?? [],
    axisScores,
  };
}

export async function getAllToolSlugs(): Promise<string[]> {
  const r = await db.execute<{ slug: string }>(sql`
    SELECT slug FROM tool WHERE is_published ORDER BY slug
  `);
  return (r.rows ?? []).map((x) => x.slug);
}
/* Footer: lib/queries.ts */
