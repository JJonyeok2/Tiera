/* ---------------------------------------------------------------------------
 * Header: 손으로 옮기는 월간 수치 — 잣대 A(국내 앱)·B(세계 웹). SPEC 26.2.
 *
 * 작성 규칙 (db/seed-tools-popularity.ts와 같다)
 *
 * 1. **공개된 수치만 넣는다.** 그 달에 어떤 브랜드 값이 없으면 비워 둔다. 앞뒤 달로
 *    보간하지 않는다. 그래프는 확인된 달에만 점을 찍는다.
 * 2. **출처를 달마다 적는다.** Similarweb은 매달 X에 7개 사이트 점유율을 올리지만
 *    원 게시물을 직접 열 수 없어서, 그 게시물을 인용한 보도를 출처로 쓰고
 *    secondHand로 표시한다(SPEC 26.7 U2). 원 게시물 링크를 확보하면 바꾼다.
 * 3. **수치만 옮긴다.** 차트나 문장은 옮기지 않는다.
 * 4. **잣대끼리 섞지 않는다.** A는 "명", B는 "%"다. 합산 순위를 만들지 않는다.
 *
 * 조사일 2026-11-24.
 * ------------------------------------------------------------------------- */
import { POPULARITY, POPULARITY_SOURCES } from "@/db/seed-tools-popularity";

export interface SourceRef {
  label: string;
  url: string;
  /** 원 출처가 아니라 그것을 인용한 보도 */
  secondHand?: boolean;
}

// --- B. 세계 웹 방문 점유율 (Similarweb) ------------------------------------------

export interface WebShareMonth {
  /** YYYY-MM */
  month: string;
  /**
   * 브랜드 key → 점유율(%). Similarweb이 집계하는 생성형 AI 웹 방문 전체에서 각 사이트의 몫.
   * 7곳을 더하면 99% 남짓이다 — 나머지는 목록에 없는 사이트 몫이라 100으로 맞추지 않는다.
   */
  share: Partial<Record<string, number>>;
  source: SourceRef;
}

const FWM_NOV =
  "https://fourweekmba.com/ai-claude-gains-1-9-points-of-ai-web-share-in-a-month-to-11-5/";
const FWM_OCT =
  "https://fourweekmba.com/ai-claudes-ai-web-traffic-share-quadruples-in-a-year-to-9-6/";
const AC_JAN =
  "https://www.androidcentral.com/apps-software/ai/battle-of-gen-ai-googles-gemini-gains-ground-on-its-chatgpt-competitor";

/** 오래된 달부터. 마지막 원소가 "지금" */
export const WEB_SHARE: WebShareMonth[] = [
  {
    month: "2025-10",
    share: { chatgpt: 71.8, gemini: 13.6, claude: 2.3, deepseek: 4.1, grok: 2.8, copilot: 2.0, perplexity: 2.5 },
    source: { label: "Similarweb 2026-10-12 게시물 (FourWeekMBA 인용)", url: FWM_OCT, secondHand: true },
  },
  {
    month: "2025-11",
    share: { chatgpt: 69.5, gemini: 15.9, claude: 2.1, deepseek: 4.1, grok: 3.3, copilot: 2.0, perplexity: 2.2 },
    source: { label: "Similarweb 2026-11-10 게시물 (FourWeekMBA 인용)", url: FWM_NOV, secondHand: true },
  },
  {
    // 2026-01-02 시점 값. Similarweb은 이때 ChatGPT·Gemini만 숫자로 밝혔다.
    month: "2026-01",
    share: { chatgpt: 64.5, gemini: 21.5 },
    source: { label: "Similarweb 2026-01 게시물 (Android Central 인용)", url: AC_JAN, secondHand: true },
  },
  {
    month: "2026-04",
    share: { claude: 8.0 },
    source: { label: "Similarweb 2026-11-10 게시물 (FourWeekMBA 인용)", url: FWM_NOV, secondHand: true },
  },
  {
    month: "2026-08",
    share: { gemini: 25.6, claude: 9.3 },
    source: { label: "Similarweb 2026-11-10 게시물 (FourWeekMBA 인용)", url: FWM_NOV, secondHand: true },
  },
  {
    month: "2026-09",
    share: { chatgpt: 56.4, gemini: 25.0, claude: 9.6, deepseek: 3.4, grok: 2.3, copilot: 1.5, perplexity: 0.9 },
    source: { label: "Similarweb 2026-10-12 게시물 (FourWeekMBA 인용)", url: FWM_OCT, secondHand: true },
  },
  {
    month: "2026-10",
    share: { chatgpt: 55.7, gemini: 24.2, claude: 11.5, deepseek: 3.4, grok: 2.2, copilot: 1.1, perplexity: 0.8 },
    source: { label: "Similarweb 2026-11-10 게시물 (FourWeekMBA 인용)", url: FWM_NOV, secondHand: true },
  },
];

/** 가장 최근의 "7개 사이트가 다 있는" 달. 1등 비교는 이 달로만 한다 */
export function latestFullWebMonth(): WebShareMonth {
  const full = WEB_SHARE.filter((m) => Object.keys(m.share).length >= 7);
  return full[full.length - 1];
}

// --- A. 국내 앱 사용자 (와이즈앱·리테일) ------------------------------------------

export interface AppUsers {
  brand: string;
  /** 월간 사용자, 만 명 */
  manUsers: number;
  month: string;
}

/**
 * 도구 정렬(SPEC 24)에 이미 쓰는 값을 그대로 가져온다. 같은 숫자를 두 군데 적으면
 * 한쪽만 고쳐지는 날이 온다.
 */
const APP_TOOL_TO_BRAND: Record<string, string> = {
  chatgpt: "chatgpt",
  gemini: "gemini",
  claude: "claude",
  perplexity: "perplexity",
};

export const APP_USERS: AppUsers[] = POPULARITY.flatMap((p) => {
  const brand = APP_TOOL_TO_BRAND[p.slug];
  return brand && p.kr ? [{ brand, manUsers: p.kr.manUsers, month: p.kr.month }] : [];
}).sort((a, b) => b.manUsers - a.manUsers);

export const APP_SOURCE: SourceRef = {
  label: `${POPULARITY_SOURCES.kr.name} ${POPULARITY_SOURCES.kr.month} (보도 인용)`,
  url: POPULARITY_SOURCES.kr.url,
  secondHand: true,
};
/* Footer: lib/usage/monthly.ts */
