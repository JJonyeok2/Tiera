/* ---------------------------------------------------------------------------
 * Header: 조회 레이어
 *
 * 랭킹은 model_score(집계 캐시)만 읽는다. review를 런타임 집계하지 않는다.
 * 순위와 괴리 판정은 SQL 윈도우 함수(RANK)로 한 번에 뽑는다 —
 * 애플리케이션에서 전체 모델을 메모리에 올려 정렬하면 페이지네이션과 어긋난다.
 * ------------------------------------------------------------------------- */

import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { Category, Country, ScoreScope, ScoreType, TierName } from "@/db/schema";
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

/** Postgres 배열 리터럴('{A,B}')과 이미 파싱된 배열을 모두 받아 string[]로 만든다. */
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

export async function getCompare(slugs: string[]): Promise<ModelDetail[]> {
  const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))].slice(0, MAX_COMPARE_MODELS);
  const found = await Promise.all(unique.map((s) => getModelDetail(s)));
  return found.filter((m): m is ModelDetail => m !== null);
}
/* Footer: lib/queries.ts */
