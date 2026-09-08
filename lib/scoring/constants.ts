/* ---------------------------------------------------------------------------
 * Header: 점수 산정 상수 — SPEC 5절
 * 이 파일 밖에서 이 숫자들을 하드코딩하지 말 것.
 * ------------------------------------------------------------------------- */

import type { Category, ScoreScope } from "@/db/schema";

/**
 * 베이지안 신뢰 임계값 m.
 * 리뷰 3개짜리 신규 모델이 평균 5.0으로 1위를 먹는 사고를 막는다.
 * 값이 클수록 신규 모델이 전체 평균 쪽으로 강하게 끌려간다.
 * 트래픽이 붙으면 상향할 것.
 */
export const CONFIDENCE_M = 30;

/**
 * 종합 점수 산출 가중치.
 * 개발자 타깃이라 코딩·추론에 무게를 뒀다. SPEC 13절 #4.
 * 평가 수가 0인 카테고리는 분모·분자에서 제외되므로 합이 1일 필요는 없다.
 */
export const CATEGORY_WEIGHT: Record<Category, number> = {
  CODING: 0.3,
  REASONING: 0.3,
  WRITING: 0.2,
  MULTIMODAL: 0.2,
};

export const CATEGORIES: Category[] = ["CODING", "WRITING", "REASONING", "MULTIMODAL"];

export const SCOPES: ScoreScope[] = ["OVERALL", ...CATEGORIES];

/** 5점 척도 → 100점 환산. 1점=20, 5점=100. SPEC 13절 #2. */
export const RATING_MIN = 1;
export const RATING_MAX = 5;

/** 벤치마크 min-max 정규화는 표본이 이 수 미만이면 신뢰할 수 없어 제외한다. */
export const MIN_MODELS_FOR_NORMALIZATION = 3;

/**
 * 벤치마크 정규화의 하한.
 *
 * min-max를 0~100으로 펴면 최하위 모델이 항상 0점이 된다. 반면 커뮤니티 점수는
 * 5점 척도를 환산한 것이라 바닥이 20점이다. 두 점수를 나란히 놓고 비교하는 것이
 * 이 서비스의 핵심인데, 축의 바닥이 다르면 비교 자체가 성립하지 않는다.
 * 그래서 벤치마크도 같은 20~100 밴드에 올린다.
 */
export const BENCH_FLOOR = 20;

/**
 * 괴리 판정 기준 = "순위 차이".
 *
 * 점수 차이로 판정하지 않는 이유: 벤치마크 점수는 min-max라 본질적으로 상대 순위이고
 * 커뮤니티 점수는 절대 평점이다. 둘의 점수 차를 빼면 "실제로 평가가 엇갈렸다"가 아니라
 * "두 척도의 분포가 다르다"를 재게 된다. 순위 차이는 척도에 무관하고,
 * "벤치마크 3위인데 커뮤니티 9위"라고 그대로 보여줄 수 있어 설명하기도 쉽다.
 */
export const GAP_RANK_THRESHOLD = 3;
/* Footer: lib/scoring/constants.ts */
