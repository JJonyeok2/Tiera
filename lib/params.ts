/* Header: URL 쿼리 파싱 — 화이트리스트 방식.
   사용자 입력을 그대로 SQL 정렬/필터에 넘기지 않기 위해 반드시 여기를 통과시킨다. */
import type { Country, ScoreScope, ScoreType, ToolOrigin, ToolPurpose } from "@/db/schema";

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

// --- 도구 ------------------------------------------------------------------

/** 용도 탭의 순서. 화면에 이 순서 그대로 나간다. */
const PURPOSES: ToolPurpose[] = [
  "CHAT",
  "RESEARCH",
  "TRANSLATE",
  "SLIDES",
  "NOTE",
  "IMAGE",
  "VIDEO",
  "AVATAR",
  "AUDIO",
  "WEBSITE",
  "CODE",
];

const ORIGINS: ToolOrigin[] = ["KR", "GLOBAL"];

/**
 * 용도 필터.
 *
 * 모델 쪽 parseScope와 달리 **기본값이 없다(undefined = 전체)**.
 * 도구 목록의 첫 화면은 "전체"여야 한다. 잘 모르는 사람이 들어왔을 때
 * 특정 용도가 먼저 선택돼 있으면, 그 탭에 없는 도구는 사이트에 없는 것이 된다.
 */
export function parseToolPurpose(v: unknown): ToolPurpose | undefined {
  return PURPOSES.includes(v as ToolPurpose) ? (v as ToolPurpose) : undefined;
}

export function parseToolOrigin(v: unknown): ToolOrigin | undefined {
  return ORIGINS.includes(v as ToolOrigin) ? (v as ToolOrigin) : undefined;
}

export { SCOPES, COUNTRIES, PURPOSES };
/* Footer: lib/params.ts */
