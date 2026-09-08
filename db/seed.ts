/* ---------------------------------------------------------------------------
 * Header: 시드 스크립트
 *   npm run db:seed
 *
 * 더미 리뷰는 개발 환경에서만 만든다 (SPEC 10절).
 * 프로덕션 DB에 가짜 사용자와 가짜 평가를 심으면 점수 자체가 거짓말이 된다.
 * ------------------------------------------------------------------------- */

import "dotenv/config";
import { like, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  benchmarkResults,
  benchmarks,
  developers,
  modelScores,
  models,
  rankSnapshots,
  reviewRatings,
  reviews,
  users,
  type Category,
} from "@/db/schema";
import {
  BENCHMARKS,
  DEVELOPERS,
  MODELS,
  REVIEW_PROFILES,
  seedBenchmarkResults,
} from "@/db/seed-data";
import { recomputeAll } from "@/lib/scoring/recompute";
import { CATEGORIES } from "@/lib/scoring/constants";
import { takeSnapshot } from "@/lib/snapshot";

const isDev = process.env.NODE_ENV !== "production";

/** 시드가 매번 같은 결과를 내도록 고정 시드 PRNG를 쓴다 (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 기대 평균 bias 주변으로 1~5 정수를 흩뿌린다. */
function sampleRating(bias: number, rand: () => number): number {
  const noise = (rand() + rand() + rand() - 1.5) * 1.15; // 대략 정규분포
  return Math.min(5, Math.max(1, Math.round(bias + noise)));
}

async function main() {
  console.log("· 기존 데이터 정리");
  await db.delete(rankSnapshots);
  await db.delete(modelScores);
  await db.delete(reviewRatings);
  await db.delete(reviews);
  await db.delete(benchmarkResults);
  await db.delete(benchmarks);
  await db.delete(models);
  await db.delete(developers);
  // 시드가 만든 더미 계정만 지운다. 실제 사용자 계정은 건드리지 않는다.
  await db.delete(users).where(like(users.email, "seed-user-%@tiera.local"));

  console.log("· 개발사 / 모델");
  const devRows = await db.insert(developers).values(DEVELOPERS).returning();
  const devIdBySlug = new Map(devRows.map((d) => [d.slug, d.id]));

  const modelRows = await db
    .insert(models)
    .values(
      MODELS.map((m) => ({
        slug: m.slug,
        name: m.name,
        developerId: devIdBySlug.get(m.developerSlug)!,
        description: m.description,
        releasedAt: new Date(m.releasedAt),
        contextWindow: m.contextWindow,
        inputPricePerM: m.inputPricePerM,
        outputPricePerM: m.outputPricePerM,
        modalities: m.modalities,
        isOpenWeight: m.isOpenWeight,
      }))
    )
    .returning();
  const modelIdBySlug = new Map(modelRows.map((m) => [m.slug, m.id]));

  console.log("· 벤치마크");
  const benchRows = await db.insert(benchmarks).values(BENCHMARKS).returning();
  const benchIdBySlug = new Map(benchRows.map((b) => [b.slug, b.id]));

  const results = seedBenchmarkResults()
    .filter((r) => modelIdBySlug.has(r.modelSlug) && benchIdBySlug.has(r.benchmarkSlug))
    .map((r) => ({
      modelId: modelIdBySlug.get(r.modelSlug)!,
      benchmarkId: benchIdBySlug.get(r.benchmarkSlug)!,
      value: r.value,
      measuredAt: r.measuredAt,
      sourceUrl: r.sourceUrl ?? null,
    }));
  await db.insert(benchmarkResults).values(results);
  console.log(`  벤치마크 결과 ${results.length}건`);

  if (isDev) {
    console.log("· 개발용 더미 리뷰 (프로덕션에서는 생성하지 않음)");
    const total = Object.values(REVIEW_PROFILES).reduce((s, p) => s + p.n, 0);
    const userValues = Array.from({ length: total }, (_, i) => ({
      email: `seed-user-${i}@tiera.local`,
      name: `평가자 ${i + 1}`,
    }));
    // Postgres의 바인드 파라미터 상한(65535)에 걸리지 않도록 나눠 넣는다.
    const userRows: (typeof users.$inferSelect)[] = [];
    for (let i = 0; i < userValues.length; i += 500) {
      userRows.push(...(await db.insert(users).values(userValues.slice(i, i + 500)).returning()));
    }

    let cursor = 0;
    const rand = rng(20260907);
    const reviewValues: (typeof reviews.$inferInsert)[] = [];
    const ratingPlan: { reviewId: string; category: Category; score: number }[] = [];

    for (const [slug, profile] of Object.entries(REVIEW_PROFILES)) {
      const modelId = modelIdBySlug.get(slug);
      if (!modelId) continue;
      for (let i = 0; i < profile.n; i++) {
        const user = userRows[cursor++];
        const reviewId = crypto.randomUUID();
        reviewValues.push({ id: reviewId, userId: user.id, modelId, comment: null });
        for (const cat of CATEGORIES) {
          const bias = profile.bias[cat];
          if (bias === undefined) continue;
          // 해당 카테고리를 "평가 안 함"으로 두는 사람이 15% 정도 있다고 본다.
          if (rand() < 0.15) continue;
          ratingPlan.push({ reviewId, category: cat, score: sampleRating(bias, rand) });
        }
      }
    }

    for (let i = 0; i < reviewValues.length; i += 1000) {
      await db.insert(reviews).values(reviewValues.slice(i, i + 1000));
    }
    for (let i = 0; i < ratingPlan.length; i += 2000) {
      await db.insert(reviewRatings).values(ratingPlan.slice(i, i + 2000));
    }
    console.log(`  리뷰 ${reviewValues.length}건 / 항목 평가 ${ratingPlan.length}건`);
  }

  console.log("· 점수 집계");
  await recomputeAll();

  // 어제자 스냅샷을 심어 순위 변동(▲/▼)이 화면에서 실제로 보이게 한다.
  // 개발 편의용이며, 프로덕션에서는 크론이 매일 쌓는다.
  if (isDev) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await takeSnapshot(yesterday);
    // 일부 모델의 어제 순위를 흔들어 상승/하락을 만든다.
    await db.execute(
      sql`UPDATE rank_snapshot SET rank = rank + 2
          WHERE date = ${yesterday}::date AND model_id IN (
            SELECT id FROM model WHERE slug IN ('claude-sonnet-4-6','deepseek-v3-1','glm-4-6'))`
    );
    await db.execute(
      sql`UPDATE rank_snapshot SET rank = GREATEST(1, rank - 1)
          WHERE date = ${yesterday}::date AND model_id IN (
            SELECT id FROM model WHERE slug IN ('gemini-2-5-pro','grok-4'))`
    );
  }

  const scored = await db.$count(modelScores);
  console.log(`완료 — model_score ${scored}행`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
/* Footer: db/seed.ts */
