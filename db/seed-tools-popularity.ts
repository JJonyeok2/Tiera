/* ---------------------------------------------------------------------------
 * Header: 도구 "많이 쓰는 순" 근거 데이터 — SPEC 24.
 *
 * 홈 목록의 기본 정렬이 이 파일의 **배열 순서**를 따른다. 맨 위가 1위다.
 * 도구 설명(seed-tools-data.ts)과 파일을 나눈 이유는 배울 곳 링크와 같다 —
 * 사용량은 달마다 바뀌어서, 설명과 섞여 있으면 갱신할 때 diff를 읽기 어렵다.
 *
 * 작성 규칙 네 가지.
 *
 * 1. **공개된 수치가 있는 도구만 넣는다.** 못 찾은 도구는 여기 없고, DB에는 null로
 *    들어가 순위 있는 도구 뒤에 놓인다. "이 정도는 쓰겠지"로 끼워 넣지 않는다.
 *    seed-tools-data.ts 규칙 1(모르면 UNKNOWN)과 같은 원칙이다.
 *
 * 2. **국내 수치가 먼저다.** 이 사이트는 한국 사용자가 읽는다. 국내 앱 이용자 수
 *    (kr)가 있는 도구끼리는 그 숫자 순으로 줄을 세운다.
 *
 * 3. **국내 수치가 없으면 세계 순위로 자리를 잡는다.** a16z 순위표의 웹·모바일 중
 *    더 높은 쪽(best)을 쓴다. 캡컷처럼 휴대폰에서 쓰는 도구를 웹 방문 수로 재면
 *    실제보다 한참 낮게 나오기 때문이다. 국내 수치가 있는 도구도 세계 순위를 같이
 *    적어 두는데, 이게 두 줄을 이어 붙이는 눈금 역할을 한다(예: 캔바는 세계 4위라
 *    세계 3위인 Claude 바로 다음).
 *
 * 4. **서로 다른 조사를 이어 붙인 순서다.** 국내 앱 이용자 수와 세계 웹 방문 수는
 *    단위가 다르다. 그래서 화면에 "N위"로 내보내지 않고 정렬에만 쓴다.
 *    규칙 2·3이 지켜졌는지는 tests/seed-tools.test.ts가 확인한다.
 *
 * 알려진 한계(SPEC 24.5):
 *   - 국내 조사는 휴대폰 앱만 센다. PC 웹으로만 쓰는 사람은 빠진다.
 *   - 국산 도구(파파고·클로바노트·미리캔버스·네이버 AI탭 등)는 국내 수치를 찾지
 *     못해 실제보다 낮게 놓였거나 순위가 없다. 수치를 찾으면 여기에 kr로 넣는다.
 *
 * 조사일 2026-11-13.
 * ------------------------------------------------------------------------- */

/** 국내 앱 이용자 수. 와이즈앱·리테일 추정치(안드로이드+iOS, 한국인 스마트폰 사용자). */
export interface KrUsers {
  /** 월간 사용자 수, 만 명 단위. */
  manUsers: number;
  /** 조사 월(YYYY-MM). 같은 달 수치를 못 구한 도구가 있어 도구마다 적는다. */
  month: string;
}

/** a16z "Top 100 Gen AI Consumer Apps" 7판(2026-10-05 발표, 2026-08 데이터)의 순위. */
export interface GlobalRank {
  /** 웹 Top 50 순위(Similarweb 월간 방문). 50위 밖이면 생략. */
  web?: number;
  /** 모바일 Top 50 순위(Sensor Tower 월간 사용자). 50위 밖이면 생략. */
  mobile?: number;
}

export interface PopularityEntry {
  slug: string;
  kr?: KrUsers;
  global?: GlobalRank;
}

/** 출처. /about과 SPEC 24가 같은 값을 쓴다. */
export const POPULARITY_SOURCES = {
  checkedAt: "2026-11-13",
  kr: {
    name: "와이즈앱·리테일",
    what: "한국인 스마트폰 사용자의 앱 월간 사용자 수(추정)",
    month: "2026-10",
    url: "https://www.fnnews.com/news/202611100846384439",
  },
  global: {
    name: "a16z Top 100 Gen AI Consumer Apps (7판)",
    what: "세계 웹 방문 수·모바일 앱 사용자 수 순위",
    month: "2026-08",
    url: "https://a16z.com/100-gen-ai-apps-7/",
  },
} as const;

/**
 * 많이 쓰는 순서. **배열 순서가 곧 순위다.**
 *
 * 줄을 옮길 때는 위 규칙 2·3을 따른다. 어기면 테스트가 실패한다.
 */
export const POPULARITY: PopularityEntry[] = [
  { slug: "chatgpt", kr: { manUsers: 2551, month: "2026-10" }, global: { web: 1, mobile: 1 } },
  { slug: "gemini", kr: { manUsers: 914, month: "2026-10" }, global: { web: 2, mobile: 3 } },
  // 웹 22위지만 모바일 2위다. 휴대폰 편집 앱이라 모바일 순위가 실제 쓰임에 가깝다.
  { slug: "capcut", global: { web: 22, mobile: 2 } },
  { slug: "claude", kr: { manUsers: 500, month: "2026-10" }, global: { web: 3, mobile: 12 } },
  { slug: "canva", global: { web: 4, mobile: 4 } },
  // a16z는 "Notion" 제품 전체로 센다. 노션 AI만 따로 센 수치는 없다.
  { slug: "notion-ai", global: { web: 7, mobile: 28 } },
  // 세계 순위는 제미나이 노트북(9위)이 퍼플렉시티(12위)보다 높지만,
  // 국내 앱 이용자는 퍼플렉시티가 더 많다. 규칙 2에 따라 국내 수치를 따른다.
  { slug: "perplexity", kr: { manUsers: 134, month: "2026-10" }, global: { web: 12, mobile: 25 } },
  { slug: "gemini-notebook", kr: { manUsers: 73, month: "2026-10" }, global: { web: 9, mobile: 35 } },
  { slug: "google-ai-studio", global: { web: 11 } },
  { slug: "lovable", global: { web: 14 } },
  { slug: "suno", global: { web: 19, mobile: 47 } },
  { slug: "elevenlabs", global: { web: 25 } },
  { slug: "higgsfield", global: { web: 28 } },
  { slug: "gamma", global: { web: 34 } },
  // 국내 수치를 찾지 못해 세계 모바일 순위로만 놓았다. 한국에서는 이보다 훨씬 많이
  // 쓸 가능성이 높다 — 국내 수치를 구하면 kr을 채워 위로 올린다.
  { slug: "papago", global: { mobile: 36 } },
  // 세계 순위표에 없는 국산 도구. 국내 수치로만 자리를 잡는다.
  { slug: "wrtn", kr: { manUsers: 37, month: "2026-10" } },
  // 10월 수치를 구하지 못해 9월 수치를 썼다. 9월 조사에서 젠스파크는 10위(32만),
  // 마누스는 10위 밖이었다.
  { slug: "genspark", kr: { manUsers: 32, month: "2026-09" }, global: { web: 50 } },
  { slug: "manus", kr: { manUsers: 30, month: "2026-10" }, global: { web: 38 } },
  { slug: "antigravity", global: { web: 44 } },
  { slug: "base44", global: { web: 46 } },
  { slug: "replit", global: { web: 48 } },
  { slug: "kling", global: { web: 49 } },
];

/** 세계 순위표에서 웹·모바일 중 더 높은 쪽. 없으면 undefined. */
export function bestGlobalRank(e: PopularityEntry): number | undefined {
  const ranks = [e.global?.web, e.global?.mobile].filter(
    (n): n is number => typeof n === "number",
  );
  return ranks.length > 0 ? Math.min(...ranks) : undefined;
}

/** slug → 순위(1부터). 시드가 tool.popularity_rank에 그대로 넣는다. */
export const POPULARITY_RANK: Record<string, number> = Object.fromEntries(
  POPULARITY.map((e, i) => [e.slug, i + 1]),
);
/* Footer: db/seed-tools-popularity.ts */
