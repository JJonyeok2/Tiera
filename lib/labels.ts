/* Header: 표시용 라벨. DB에 의존하지 않아 클라이언트 컴포넌트에서도 안전하게 import된다.
   (lib/queries.ts는 pg 커넥션을 끌고 오므로 클라이언트에서 import하면 번들이 깨진다.) */
import type { Country, ScoreScope, ScoreType } from "@/db/schema";

export const CATEGORY_LABEL: Record<ScoreScope, string> = {
  OVERALL: "종합",
  CODING: "코딩",
  WRITING: "글쓰기",
  REASONING: "추론",
  MULTIMODAL: "멀티모달",
};

export const COUNTRY_LABEL: Record<Country, string> = {
  US: "미국",
  CN: "중국",
  KR: "한국",
};

export const SCORE_TYPE_LABEL: Record<ScoreType, string> = {
  COMMUNITY: "커뮤니티 평가",
  BENCHMARK: "벤치마크",
};
/**
 * 리뷰 목록에 띄울 작성자 표시명.
 *
 * 익명이면 서버가 이름을 내려주더라도 무시한다. 익명 처리는 쿼리에서 이미
 * 하고 있지만(lib/reviews.ts), 그 한 겹만 두면 쿼리가 회귀하는 날 이름이
 * 그대로 화면에 찍힌다. 표시 규칙은 화면 쪽에서도 독립적으로 강제한다.
 */
export function displayAuthorName(r: { isAnonymous: boolean; authorName: string | null }): string {
  if (r.isAnonymous) return "익명";
  return r.authorName?.trim() || "익명";
}
/* Footer: lib/labels.ts */