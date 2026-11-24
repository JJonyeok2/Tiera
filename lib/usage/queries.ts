/* ---------------------------------------------------------------------------
 * Header: 잣대 C 읽기 — usage_daily에서 최근 15일. SPEC 26.5.
 *
 * DB가 없거나 느리면 undefined를 돌려준다. /usage는 A·B(코드 데이터)만으로도
 * 떠야 하고, C 칸만 "불러오지 못했어요"가 된다. db는 동적 import —
 * 접속 주소가 없으면 import에서 던진다(SPEC 19.3).
 * ------------------------------------------------------------------------- */
import { sql } from "drizzle-orm";
import type { AuthorDay } from "@/lib/data-sources/openrouter";
import { apiShareWindow, type ApiShareWindow } from "./share";
import { USAGE_SOURCE } from "./sync";

const DB_TIMEOUT_MS = 3000;

export interface ApiUsage extends ApiShareWindow {
  /** OpenRouter 응답의 as_of. CC BY 출처 표기에 쓴다 */
  asOf: string;
}

export type ApiUsageResult =
  | { status: "ok"; usage: ApiUsage }
  /** 테이블은 있는데 7일치가 아직 안 쌓였다 */
  | { status: "empty" }
  /** DB 오류·지연 */
  | { status: "error" };

export async function getApiUsage(): Promise<ApiUsageResult> {
  try {
    const { db } = await import("@/db");
    const query = db.execute<{ date: string; author: string; tokens: string; fetched_at: string }>(sql`
      SELECT date::text AS date, author, tokens::text AS tokens, fetched_at::text AS fetched_at
      FROM usage_daily
      WHERE source = ${USAGE_SOURCE}
        AND date >= (SELECT max(date) FROM usage_daily WHERE source = ${USAGE_SOURCE}) - 14
    `);
    const res = await Promise.race([
      query,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("usage timeout")), DB_TIMEOUT_MS)),
    ]);
    const rows = res.rows ?? [];
    const days: AuthorDay[] = rows.map((r) => ({ date: r.date, author: r.author, tokens: Number(r.tokens) }));
    const w = apiShareWindow(days);
    if (!w) return { status: "empty" };
    const asOf = rows.reduce((m, r) => (r.fetched_at > m ? r.fetched_at : m), "");
    return { status: "ok", usage: { ...w, asOf } };
  } catch (err) {
    console.warn("[usage] 사용량 조회 실패", err);
    return { status: "error" };
  }
}
/* Footer: lib/usage/queries.ts */
