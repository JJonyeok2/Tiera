/* ---------------------------------------------------------------------------
 * Header: 외부 소스 → DB 반영
 *
 * 수집(collect) / 정규화(normalize) / 집계(aggregate) / 표시(present)를 갈라둔
 * 설계(SPEC 10절)의 "반영" 지점이다. 소스는 RawBenchmarkResult만 뱉고,
 * 여기서 DB에 upsert한 뒤 스코어링 파이프라인을 돌린다.
 *
 * 원칙 두 가지:
 *  - 기존 행을 지우지 않는다. 소스가 일시적으로 모델을 빠뜨려도 데이터가 증발하면 안 된다.
 *    (수집이 실패한 것과 모델이 사라진 것을 API 응답만으로 구분할 수 없다.)
 *  - 사람이 채운 값은 덮어쓰지 않는다. 컨텍스트 길이·모달리티·설명처럼
 *    API가 주지 않는 필드는 손대지 않는다.
 * ------------------------------------------------------------------------- */

import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { benchmarkResults, benchmarks, developers, models } from "@/db/schema";
import { recomputeBenchmarks, recomputeCommunity } from "@/lib/scoring/recompute";
import { ArtificialAnalysisSource, type AASyncPayload } from "./artificial-analysis";

export interface SyncReport {
  /** 실데이터 반영과 함께 걷어낸 시드 예시 벤치마크 수 */
  seedBenchmarksPurged?: number;
  developersUpserted: number;
  modelsUpserted: number;
  benchmarksUpserted: number;
  resultsUpserted: number;
  skippedCreators: string[];
}

export async function applySync(payload: AASyncPayload, defs: Awaited<ReturnType<ArtificialAnalysisSource["definitions"]>>): Promise<SyncReport> {
  // --- 개발사 ---
  const bySlug = new Map<string, { name: string; country: "US" | "CN" | "KR"; siteUrl?: string }>();
  for (const m of payload.models) {
    const slug = m.creator.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    bySlug.set(slug, m.creator);
  }

  for (const [slug, c] of bySlug) {
    await db
      .insert(developers)
      .values({ slug, name: c.name, country: c.country, siteUrl: c.siteUrl ?? null })
      .onConflictDoUpdate({
        target: developers.slug,
        set: { name: c.name, country: c.country },
      });
  }
  const devRows = await db.select({ id: developers.id, slug: developers.slug }).from(developers);
  const devIdBySlug = new Map(devRows.map((d) => [d.slug, d.id]));

  // --- 모델 ---
  for (const m of payload.models) {
    const devSlug = m.creator.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const developerId = devIdBySlug.get(devSlug);
    if (!developerId) continue;

    await db
      .insert(models)
      .values({
        slug: m.slug,
        name: m.name,
        developerId,
        inputPricePerM: m.inputPricePerM,
        outputPricePerM: m.outputPricePerM,
      })
      .onConflictDoUpdate({
        target: models.slug,
        // 이름·개발사·가격만 갱신한다. 설명/컨텍스트/모달리티는 사람이 채우는 값이라 건드리지 않는다.
        set: {
          name: m.name,
          developerId,
          inputPricePerM: m.inputPricePerM,
          outputPricePerM: m.outputPricePerM,
        },
      });
  }
  const modelRows = await db.select({ id: models.id, slug: models.slug }).from(models);
  const modelIdBySlug = new Map(modelRows.map((m) => [m.slug, m.id]));

  // --- 벤치마크 정의 ---
  for (const d of defs) {
    await db
      .insert(benchmarks)
      .values(d)
      .onConflictDoUpdate({
        target: benchmarks.slug,
        set: {
          name: d.name,
          category: d.category,
          unit: d.unit,
          higherIsBetter: d.higherIsBetter,
          weight: d.weight,
          sourceName: d.sourceName,
          sourceUrl: d.sourceUrl,
        },
      });
  }
  const benchRows = await db.select({ id: benchmarks.id, slug: benchmarks.slug }).from(benchmarks);
  const benchIdBySlug = new Map(benchRows.map((b) => [b.slug, b.id]));

  // --- 측정값 ---
  let resultsUpserted = 0;
  for (const r of payload.results) {
    const modelId = modelIdBySlug.get(r.modelSlug);
    const benchmarkId = benchIdBySlug.get(r.benchmarkSlug);
    if (!modelId || !benchmarkId) continue;

    await db
      .insert(benchmarkResults)
      .values({
        modelId,
        benchmarkId,
        value: r.value,
        measuredAt: r.measuredAt,
        sourceUrl: r.sourceUrl ?? null,
      })
      .onConflictDoUpdate({
        target: [benchmarkResults.modelId, benchmarkResults.benchmarkId],
        set: { value: r.value, measuredAt: r.measuredAt, sourceUrl: r.sourceUrl ?? null },
      });
    resultsUpserted += 1;
  }

  // 벤치마크 점수는 min-max 정규화라 값 하나만 바뀌어도 전 모델이 흔들린다. 전체 재계산.
  await recomputeBenchmarks();
  // 커뮤니티 쪽은 모델이 새로 생겼을 수 있으니 같이 돌린다.
  await recomputeCommunity();

  return {
    developersUpserted: bySlug.size,
    modelsUpserted: payload.models.length,
    benchmarksUpserted: defs.length,
    resultsUpserted,
    skippedCreators: payload.skippedCreators,
  };
}

export async function syncFromArtificialAnalysis(apiKey: string): Promise<SyncReport> {
  const source = new ArtificialAnalysisSource(apiKey);
  const [payload, defs] = await Promise.all([source.fetchAll(), source.definitions()]);

  // 실데이터가 들어오는 순간 초기 시드의 "예시 값"은 남아 있으면 안 된다.
  // 둘이 섞이면 화면에서 어떤 숫자가 실측인지 구분할 방법이 없어진다.
  // 수집이 성공한 뒤에만 지운다 — 실패 시 기존 데이터를 날리지 않기 위해서다.
  const purged = await purgeSeedBenchmarks();

  const report = await applySync(payload, defs);
  return { ...report, seedBenchmarksPurged: purged };
}

/** 시드로 넣었던 예시 벤치마크를 걷어낸다. 실데이터로 전환할 때 한 번만 쓴다. */
export async function purgeSeedBenchmarks(): Promise<number> {
  const seeded = await db
    .select({ id: benchmarks.id })
    .from(benchmarks)
    .where(eq(benchmarks.sourceName, "시드 데이터(예시)"));
  if (seeded.length === 0) return 0;
  const ids = seeded.map((s) => s.id);
  await db.delete(benchmarkResults).where(inArray(benchmarkResults.benchmarkId, ids));
  await db.delete(benchmarks).where(inArray(benchmarks.id, ids));
  return ids.length;
}
/* Footer: lib/data-sources/sync.ts */
