/* ---------------------------------------------------------------------------
 * Header: 로컬 모델의 "똑똑함" 티어 조회. SPEC 25.2 #4.
 *
 * 새로 수집하지 않는다. 이미 매일 받는 Artificial Analysis 벤치마크 종합 점수를
 * 모델 slug로 찾아 쓴다. 우리 DB에 없는 모델(Hermes 3, EXAONE 3.5 등)은 티어 없이
 * 보여준다 — 지어낸 티어로 채우지 않는다.
 *
 * /local은 DB가 없어도 떠야 한다. 메모리 계산은 코드에 든 데이터만으로 끝나고,
 * 티어는 덤이다. 그래서 db를 동적 import하고(접속 주소가 없으면 import에서 던진다,
 * SPEC 19.3) 실패·지연 시 빈 결과를 돌려준다.
 * ------------------------------------------------------------------------- */
import { sql } from "drizzle-orm";
import { tierOf, type Tier } from "@/components/tier/tierTokens";
import type { LocalVariant } from "./data";

export interface LocalModelScore {
  /** 실제로 찾은 우리 model slug — 상세 링크에 쓴다 */
  slug: string;
  score: number;
  tier: Tier;
}

const DB_TIMEOUT_MS = 3000;

/** 변형 id → 점수. 못 찾은 변형은 맵에 없다 */
export async function getLocalScores(
  variants: LocalVariant[],
): Promise<Map<string, LocalModelScore>> {
  const out = new Map<string, LocalModelScore>();
  const wanted = [...new Set(variants.flatMap((v) => v.modelSlugs))];
  if (wanted.length === 0) return out;

  try {
    const { db } = await import("@/db");
    const query = db.execute<{ slug: string; score: number }>(sql`
      SELECT m.slug, s.score
      FROM model m
      JOIN model_score s ON s.model_id = m.id
      WHERE m.is_published
        AND s.score_type = 'BENCHMARK'
        AND s.scope = 'OVERALL'
        AND m.slug IN (${sql.join(wanted.map((s) => sql`${s}`), sql`, `)})
    `);
    const res = await Promise.race([
      query,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("local scores timeout")), DB_TIMEOUT_MS),
      ),
    ]);

    const bySlug = new Map((res.rows ?? []).map((r) => [r.slug, Number(r.score)]));
    for (const v of variants) {
      // 후보를 앞에서부터 본다. 2507 개정판이 있으면 그걸, 없으면 원판을 쓴다.
      const slug = v.modelSlugs.find((s) => bySlug.has(s));
      if (!slug) continue;
      const score = bySlug.get(slug)!;
      out.set(v.id, { slug, score, tier: tierOf(score) });
    }
  } catch (err) {
    console.warn("[local] 티어 조회 실패 — 티어 없이 표시", err);
  }
  return out;
}
/* Footer: lib/local/queries.ts */
