/* ---------------------------------------------------------------------------
 * Header: 집계 캐시(model_score) 갱신 — SPEC 8.2절
 *
 * 랭킹 조회는 이 테이블만 읽는다. 그래서 리뷰나 벤치마크가 바뀌면
 * 반드시 여기를 통해 캐시를 다시 채워야 한다.
 *
 * 재계산 범위가 함수마다 다른 이유:
 *   - 커뮤니티: 전체 평균 C가 바뀌면 모든 모델이 흔들리므로, 리뷰 1건 변경 시에는
 *     해당 모델만 갱신하고 C 재계산은 일 1회 배치에서 전 모델을 돌린다.
 *   - 벤치마크: min-max 정규화라 값 하나만 바뀌어도 전체 모델의 점수가 바뀐다.
 *     부분 갱신이 불가능하므로 항상 전 모델을 다시 계산한다.
 * ------------------------------------------------------------------------- */

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  benchmarkResults,
  benchmarks,
  modelScores,
  models,
  reviewRatings,
  reviews,
  type Category,
  type ScoreScope,
  type ScoreType,
} from "@/db/schema";
import { CATEGORIES, CATEGORY_WEIGHT, CONFIDENCE_M } from "./constants";
import { bayesian, normalize, overallFrom, tierOf, toHundred, weightedMean } from "./score";

type ScoreRow = typeof modelScores.$inferInsert;

async function replaceScores(modelIds: string[], scoreType: ScoreType, rows: ScoreRow[]) {
  await db.transaction(async (tx) => {
    if (modelIds.length > 0) {
      await tx
        .delete(modelScores)
        .where(and(inArray(modelScores.modelId, modelIds), eq(modelScores.scoreType, scoreType)));
    }
    if (rows.length > 0) await tx.insert(modelScores).values(rows);
  });
}

// --- 커뮤니티 --------------------------------------------------------------

interface CatAgg {
  sum: number;
  count: number;
}

/**
 * @param onlyModelId 지정하면 그 모델만 갱신한다. 전체 평균 C는 항상 전 모델 기준으로 구한다 —
 *                    한 모델의 리뷰만 보고 C를 계산하면 보정이 무의미해지기 때문이다.
 */
export async function recomputeCommunity(onlyModelId?: string): Promise<void> {
  const rows = await db
    .select({
      modelId: reviews.modelId,
      category: reviewRatings.category,
      score: reviewRatings.score,
    })
    .from(reviewRatings)
    .innerJoin(reviews, eq(reviewRatings.reviewId, reviews.id));

  // modelId -> category -> {sum, count}
  const byModel = new Map<string, Map<Category, CatAgg>>();
  const global = new Map<Category, CatAgg>();

  for (const r of rows) {
    const m = byModel.get(r.modelId) ?? new Map<Category, CatAgg>();
    const a = m.get(r.category) ?? { sum: 0, count: 0 };
    a.sum += r.score;
    a.count += 1;
    m.set(r.category, a);
    byModel.set(r.modelId, m);

    const g = global.get(r.category) ?? { sum: 0, count: 0 };
    g.sum += r.score;
    g.count += 1;
    global.set(r.category, g);
  }

  /** 카테고리별 전체 평균 C (100점 환산). 표본이 없으면 중앙값 60으로 둔다. */
  const globalMean = new Map<Category, number>();
  for (const cat of CATEGORIES) {
    const g = global.get(cat);
    globalMean.set(cat, g && g.count > 0 ? toHundred(g.sum / g.count) : 60);
  }

  const targetIds = onlyModelId
    ? [onlyModelId]
    : (await db.select({ id: models.id }).from(models)).map((m) => m.id);

  // 모델별 리뷰어 수를 한 번에 집계한다.
  // 예전에는 루프 안에서 모델마다 COUNT를 날려 모델 수만큼 쿼리가 나갔다(N+1).
  const reviewerCounts = await db.execute<{ model_id: string; c: number }>(sql`
    SELECT model_id, COUNT(*)::int AS c FROM review GROUP BY model_id
  `);
  const reviewerBy = new Map<string, number>(
    (reviewerCounts.rows ?? []).map((r) => [r.model_id, Number(r.c)])
  );

  const out: ScoreRow[] = [];

  for (const modelId of targetIds) {
    const perCat = byModel.get(modelId);
    if (!perCat || perCat.size === 0) continue; // 평가가 하나도 없으면 랭킹에 올리지 않는다

    const catScores: Partial<Record<Category, number>> = {};

    for (const cat of CATEGORIES) {
      const a = perCat.get(cat);
      if (!a || a.count === 0) continue;
      const raw = toHundred(a.sum / a.count);
      const score = bayesian(raw, a.count, globalMean.get(cat)!, CONFIDENCE_M);
      catScores[cat] = score;
      out.push({
        modelId,
        scoreType: "COMMUNITY",
        scope: cat as ScoreScope,
        raw,
        score,
        sampleCount: a.count,
        tier: tierOf(score),
      });
    }

    const overall = overallFrom(catScores);
    if (overall === null) continue;

    // 종합의 raw는 보정 전 카테고리 평균들의 가중 평균으로 둔다.
    const rawOverall =
      weightedMean(
        CATEGORIES.filter((c) => perCat.get(c)).map((c) => ({
          value: toHundred(perCat.get(c)!.sum / perCat.get(c)!.count),
          weight: CATEGORY_WEIGHT[c],
        }))
      ) ?? overall;

    // 종합의 표본 수는 "그 모델에 리뷰를 쓴 사람 수"다.
    // 카테고리 평가 수를 다 더하면 한 사람이 4번 센 것이 되어 신뢰도가 부풀려진다.
    const reviewerCount = reviewerBy.get(modelId) ?? 0;

    out.push({
      modelId,
      scoreType: "COMMUNITY",
      scope: "OVERALL",
      raw: rawOverall,
      score: overall,
      sampleCount: reviewerCount,
      tier: tierOf(overall),
    });
  }

  // 상태는 루프 밖에서, 대상 전체에 대해 한 번에 다시 매긴다.
  //
  // 예전에는 리뷰가 있는 모델만 루프를 돌며 갱신했다. 그래서 리뷰가 전부 삭제된
  // 모델은 continue로 빠져나가 status가 CERTIFIED인 채로 남았다.
  // 실제로 더미 리뷰 2,879건을 지운 뒤 리뷰 0개짜리 모델들이 "공인" 배지를 달고 있었다.
  // 상태는 리뷰 수에서 파생되는 값이므로, 리뷰가 사라지면 같이 내려가야 한다.
  await db.execute(sql`
    UPDATE model m
    SET status = CASE
      WHEN (SELECT COUNT(*) FROM review r WHERE r.model_id = m.id) >= ${CONFIDENCE_M}
      THEN 'CERTIFIED'::model_status
      ELSE 'PROVISIONAL'::model_status
    END
    ${onlyModelId ? sql`WHERE m.id = ${onlyModelId}` : sql``}
  `);

  await replaceScores(targetIds, "COMMUNITY", out);
}

// --- 벤치마크 --------------------------------------------------------------

/**
 * 벤치마크 점수는 항상 전 모델을 다시 계산한다.
 * min-max 정규화라 값 하나가 바뀌면 모든 모델의 정규화 점수가 바뀌기 때문이다.
 */
export async function recomputeBenchmarks(): Promise<void> {
  const rows = await db
    .select({
      modelId: benchmarkResults.modelId,
      value: benchmarkResults.value,
      benchmarkId: benchmarks.id,
      category: benchmarks.category,
      weight: benchmarks.weight,
      higherIsBetter: benchmarks.higherIsBetter,
    })
    .from(benchmarkResults)
    .innerJoin(benchmarks, eq(benchmarkResults.benchmarkId, benchmarks.id));

  // 벤치마크별 값 분포 — 정규화의 min/max 모집단
  const valuesByBenchmark = new Map<string, number[]>();
  for (const r of rows) {
    const arr = valuesByBenchmark.get(r.benchmarkId) ?? [];
    arr.push(r.value);
    valuesByBenchmark.set(r.benchmarkId, arr);
  }

  interface Norm {
    category: Category | null;
    weight: number;
    normalized: number;
  }
  const byModel = new Map<string, Norm[]>();

  for (const r of rows) {
    const normalized = normalize(r.value, {
      values: valuesByBenchmark.get(r.benchmarkId)!,
      higherIsBetter: r.higherIsBetter,
    });
    if (normalized === null) continue; // 표본 부족 → 이 벤치마크는 통째로 제외
    const arr = byModel.get(r.modelId) ?? [];
    arr.push({ category: r.category, weight: r.weight, normalized });
    byModel.set(r.modelId, arr);
  }

  const allIds = (await db.select({ id: models.id }).from(models)).map((m) => m.id);
  const out: ScoreRow[] = [];

  for (const [modelId, norms] of byModel) {
    const catScores: Partial<Record<Category, number>> = {};

    for (const cat of CATEGORIES) {
      const items = norms.filter((n) => n.category === cat);
      if (items.length === 0) continue;
      const v = weightedMean(items.map((n) => ({ value: n.normalized, weight: n.weight })));
      if (v === null) continue;
      catScores[cat] = v;
      out.push({
        modelId,
        scoreType: "BENCHMARK",
        scope: cat as ScoreScope,
        raw: v,
        score: v,
        sampleCount: items.length,
        tier: tierOf(v),
      });
    }

    // 종합: 카테고리 점수의 가중 평균. 카테고리 없는 벤치마크(category=null)는
    // 종합에만 반영되므로 별도 항목으로 섞는다.
    const catPart = CATEGORIES.filter((c) => catScores[c] !== undefined).map((c) => ({
      value: catScores[c]!,
      weight: CATEGORY_WEIGHT[c],
    }));
    const generalPart = norms
      .filter((n) => n.category === null)
      .map((n) => ({ value: n.normalized, weight: n.weight }));

    const overall = weightedMean([...catPart, ...generalPart]);
    if (overall === null) continue;

    out.push({
      modelId,
      scoreType: "BENCHMARK",
      scope: "OVERALL",
      raw: overall,
      score: overall,
      sampleCount: norms.length,
      tier: tierOf(overall),
    });
  }

  await replaceScores(allIds, "BENCHMARK", out);
}

export async function recomputeAll(): Promise<void> {
  await recomputeBenchmarks();
  await recomputeCommunity();
}
/* Footer: lib/scoring/recompute.ts */
