/* ---------------------------------------------------------------------------
 * Header: 일일 랭킹 스냅샷 — 순위 변동(▲2/▼1)의 원천
 * 하루 한 번 (점수타입 × 스코프 × 모델)의 순위를 그대로 박아둔다.
 * ------------------------------------------------------------------------- */
import { sql } from "drizzle-orm";
import { db } from "@/db";

/** @param date 'YYYY-MM-DD'. 생략하면 오늘. */
export async function takeSnapshot(date?: string): Promise<number> {
  const res = await db.execute<{ count: string }>(sql`
    WITH ranked AS (
      SELECT ms.model_id, ms.score_type, ms.scope, ms.score,
             RANK() OVER (PARTITION BY ms.score_type, ms.scope ORDER BY ms.score DESC) AS rank
      FROM model_score ms
      JOIN model m ON m.id = ms.model_id AND m.is_published
    ),
    ins AS (
      INSERT INTO rank_snapshot (id, model_id, score_type, scope, rank, score, date)
      SELECT gen_random_uuid()::text, model_id, score_type, scope, rank, score,
             COALESCE(${date ?? null}::date, CURRENT_DATE)
      FROM ranked
      ON CONFLICT (model_id, score_type, scope, date)
      DO UPDATE SET rank = EXCLUDED.rank, score = EXCLUDED.score
      RETURNING 1
    )
    SELECT COUNT(*)::text AS count FROM ins
  `);
  return Number(res.rows?.[0]?.count ?? 0);
}
/* Footer: lib/snapshot.ts */
