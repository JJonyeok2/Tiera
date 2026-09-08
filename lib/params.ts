/* Header: URL 쿼리 파싱 — 화이트리스트 방식.
   사용자 입력을 그대로 SQL 정렬/필터에 넘기지 않기 위해 반드시 여기를 통과시킨다. */
import type { Country, ScoreScope, ScoreType } from "@/db/schema";

const SCORE_TYPES: ScoreType[] = ["COMMUNITY", "BENCHMARK"];
const SCOPES: ScoreScope[] = ["OVERALL", "CODING", "WRITING", "REASONING", "MULTIMODAL"];
const COUNTRIES: Country[] = ["US", "CN", "KR"];

export function parseScoreType(v: unknown): ScoreType {
  return SCORE_TYPES.includes(v as ScoreType) ? (v as ScoreType) : "COMMUNITY";
}
export function parseScope(v: unknown): ScoreScope {
  return SCOPES.includes(v as ScoreScope) ? (v as ScoreScope) : "OVERALL";
}
export function parseCountry(v: unknown): Country | undefined {
  return COUNTRIES.includes(v as Country) ? (v as Country) : undefined;
}
export function parseQuery(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, 60);
  return t.length > 0 ? t : undefined;
}
export function parseLimit(v: unknown, def = 20, max = 50): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), max) : def;
}
export function parseOffset(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export { SCOPES, COUNTRIES };
/* Footer: lib/params.ts */
