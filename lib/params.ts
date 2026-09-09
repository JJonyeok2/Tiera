/* Header: URL 쿼리 파싱 — 화이트리스트 방식.
   사용자 입력을 그대로 SQL 정렬/필터에 넘기지 않기 위해 반드시 여기를 통과시킨다. */
import type { Country, ScoreScope, ScoreType } from "@/db/schema";

const SCORE_TYPES: ScoreType[] = ["COMMUNITY", "BENCHMARK"];
const SCOPES: ScoreScope[] = ["OVERALL", "CODING", "WRITING", "REASONING", "MULTIMODAL"];
const COUNTRIES: Country[] = ["US", "CN", "KR"];

/**
 * 점수 종류의 기본값.
 *
 * 서버(page.tsx)와 클라이언트(Header, RankingList)가 각자 기본값을 정하면
 * 서버는 벤치마크를 그리는데 탭은 커뮤니티가 켜지고 행은 "리뷰 N개"로 뜨는,
 * 화면 안에서 앞뒤가 안 맞는 상태가 된다. 실제로 그렇게 어긋났었다.
 * 기본값은 여기 한 곳에만 둔다.
 */
export const DEFAULT_SCORE_TYPE: ScoreType = "BENCHMARK";

/**
 * 기본값은 **벤치마크**다.
 *
 * 첫 화면은 항상 채워져 있어야 한다. 커뮤니티 점수는 평가가 쌓이기 전까지
 * 모델이 몇 개뿐이라, 기본으로 두면 302개짜리 사이트가 2개짜리로 보인다.
 * 실제로 첫 평가가 들어온 직후 홈이 "2개 모델"로 떴다.
 */
export function parseScoreType(v: unknown): ScoreType {
  return SCORE_TYPES.includes(v as ScoreType) ? (v as ScoreType) : DEFAULT_SCORE_TYPE;
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
