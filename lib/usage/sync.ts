/* ---------------------------------------------------------------------------
 * Header: OpenRouter 사용량 동기화 — 크론(/api/cron/usage)이 부른다. SPEC 26.5.
 *
 * 최근 15일을 받아 (날짜, 개발사) 합계를 upsert한다. 15일인 이유: 화면이 "최근 7일"과
 * "그 전 7일"을 비교하는데, 크론이 하루 이틀 빠져도 다음 실행에서 메워지게 여유를 둔다.
 * 호출은 하루 한 번, 요청 1건이라 레이트 리밋(하루 500회)과 거리가 멀다.
 *
 * 받는 데 실패하면 아무것도 쓰지 않는다(SPEC 20.4). 쓰기는 한 트랜잭션이다 —
 * 날짜 절반만 갱신된 상태로 점유율을 계산하면 숫자가 틀린다.
 *
 * fetched_at에는 응답의 meta.as_of를 넣는다. CC BY 출처 표기
 * "Source: OpenRouter (openrouter.ai/rankings), as of <as_of>."에 그 값을 쓴다.
 * ------------------------------------------------------------------------- */
import { sql } from "drizzle-orm";
import { aggregateByAuthor, fetchRankingsDaily } from "@/lib/data-sources/openrouter";

export const USAGE_SOURCE = "openrouter";
const LOOKBACK_DAYS = 15;

export interface UsageSyncReport {
  days: number;
  rows: number;
  asOf: string;
}

export async function syncOpenRouterUsage(apiKey: string, now = new Date()): Promise<UsageSyncReport> {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - LOOKBACK_DAYS);
  const { rows, asOf } = await fetchRankingsDaily(apiKey, { start: start.toISOString().slice(0, 10) });
  const days = aggregateByAuthor(rows);
  if (days.length === 0) return { days: 0, rows: 0, asOf };

  const fetchedAt = Number.isNaN(Date.parse(asOf)) ? new Date() : new Date(asOf);
  const { db } = await import("@/db");
  const { usageDaily } = await import("@/db/schema");

  await db.transaction(async (tx) => {
    // 500줄 단위로 끊는다. 15일 × 개발사 수십 곳이라 보통 한 번에 끝난다.
    for (let i = 0; i < days.length; i += 500) {
      const chunk = days.slice(i, i + 500);
      await tx
        .insert(usageDaily)
        .values(chunk.map((d) => ({ source: USAGE_SOURCE, date: d.date, author: d.author, tokens: d.tokens, fetchedAt })))
        .onConflictDoUpdate({
          target: [usageDaily.source, usageDaily.date, usageDaily.author],
          set: { tokens: sql`excluded.tokens`, fetchedAt: sql`excluded.fetched_at` },
        });
    }
  });

  return { days: new Set(days.map((d) => d.date)).size, rows: days.length, asOf };
}
/* Footer: lib/usage/sync.ts */
