/* Header: 표시용 라벨. DB에 의존하지 않아 클라이언트 컴포넌트에서도 안전하게 import된다.
   (lib/queries.ts는 pg 커넥션을 끌고 오므로 클라이언트에서 import하면 번들이 깨진다.) */
import type {
  Country,
  KoreanLevel,
  Platform,
  PricingKind,
  ScoreScope,
  ScoreType,
  ToolAxis,
  ToolPurpose,
} from "@/db/schema";

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
// --- 도구 ------------------------------------------------------------------

/** 용도 탭의 이름. 화면에 그대로 나가는 문구다. */
export const PURPOSE_LABEL: Record<ToolPurpose, string> = {
  CHAT: "대화",
  RESEARCH: "자료조사",
  TRANSLATE: "번역·글쓰기",
  SLIDES: "발표자료",
  NOTE: "기록·정리",
  IMAGE: "이미지",
  VIDEO: "영상",
  AVATAR: "아바타 영상",
  AUDIO: "음악·목소리",
  CODE: "코딩",
};

/** 용도 탭 아래 한 줄. "이 탭에 뭐가 있는지"를 미리 알려준다. */
export const PURPOSE_HINT: Record<ToolPurpose, string> = {
  CHAT: "뭐든 물어보는 AI",
  RESEARCH: "과제 자료 찾고 논문 읽기",
  TRANSLATE: "번역하고 글 다듬기",
  SLIDES: "발표자료와 디자인 만들기",
  NOTE: "녹음하고 받아 적고 정리하기",
  IMAGE: "그림 만들고 사진 고치기",
  VIDEO: "영상 만들고 자막 넣기",
  AVATAR: "사람이 말하는 영상 만들기",
  AUDIO: "노래 만들고 목소리 입히기",
  CODE: "코드 짜고 앱 만들기",
};

/**
 * 과금 형태.
 *
 * FREEMIUM과 TRIAL의 문구가 이 표에서 제일 중요하다. 둘 다 "무료"라는 말을
 * 쓰면 구분한 의미가 없어진다. 갱신되는 쪽만 "무료로 시작"이라고 쓴다.
 */
export const PRICING_LABEL: Record<PricingKind, string> = {
  FREE: "무료",
  FREEMIUM: "무료로 시작",
  TRIAL: "체험만 무료",
  PAID: "유료",
};

export const KOREAN_LEVEL_LABEL: Record<KoreanLevel, string> = {
  // "한국 서비스"였는데 제작사 배지가 '한국'이 되면서 둘이 같은 말로 보였다.
  // 배지는 **어디서 만들었나**이고 이 라벨은 **한국어가 되나**다. 다른 질문이다.
  NATIVE: "한국어 완벽",
  GOOD: "한국어 잘 됨",
  PARTIAL: "한국어 아쉬움",
  NONE: "영어만",
  // 비워두면 "한국어 안 됨"으로 읽힌다. 모른다는 걸 말로 해야 한다.
  UNKNOWN: "한국어 확인 중",
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  WEB: "웹",
  IOS: "아이폰",
  ANDROID: "안드로이드",
  DESKTOP: "PC 프로그램",
  EXTENSION: "브라우저 확장",
  PLUGIN: "플러그인",
};

/** 도구 평가 4축 — 질문 형태로 쓴다. 명사로 두면 뭘 묻는지 모호하다. */
export const TOOL_AXIS_LABEL: Record<ToolAxis, string> = {
  EASE: "쉬움",
  OUTPUT: "결과물",
  PRICE: "가격",
  KOREAN: "한국어",
};

export const TOOL_AXIS_QUESTION: Record<ToolAxis, string> = {
  EASE: "처음 써도 할 만한가",
  OUTPUT: "나온 게 실제로 쓸 만한가",
  PRICE: "값어치를 하는가",
  KOREAN: "한국어로 잘 되는가",
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