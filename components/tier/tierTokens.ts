/* Header: 티어 지오메트리 + 컬러 토큰 — 단일 소스 오브 트루스 */
// components/tier/tierTokens.ts
// Tiera 티어 별 마크 - 지오메트리 + 티어별 컬러 토큰 (단일 소스 오브 트루스)
// 출처: Figma "Tiera" / Sources 프레임
// https://www.figma.com/design/dLClHMt343tarQe1NuQUz3/Tiera?node-id=0-1

export const TIERS = ["prism", "gold", "silver", "bronze"] as const;
export type Tier = (typeof TIERS)[number];

/** 티어 대표색 - 배지 테두리, 점수 링, 텍스트에 사용 */
export const TIER_COLOR: Record<Tier, string> = {
  prism: "#7B68FF",          // 그라데이션 시작점. 필/텍스트는 TIER_GRADIENT 사용
  gold: "#FFD700",
  silver: "#C0C6D4",
  bronze: "#CD7F32",
};

export const TIER_GRADIENT = "linear-gradient(90deg, #7B68FF 0%, #FFB868 100%)";

/**
 * 점수 링 게이지의 그라데이션 스톱.
 * PRISM만 브랜드 멀티 휴이고, 나머지는 자기 색의 밝음→어두움 2스톱이다.
 * 티어를 색으로만 구분하지 않는다는 규칙은 그대로다 — 링 옆에 늘 별과 라벨이 붙는다.
 */
export const TIER_RING_STOPS: Record<Tier, { o: number; c: string }[]> = {
  prism: [
    { o: 0, c: "#00D2D3" },
    { o: 35, c: "#54A0FF" },
    { o: 65, c: "#7B68FF" },
    { o: 100, c: "#FF3DF5" },
  ],
  gold: [
    { o: 0, c: "#FFE96B" },
    { o: 100, c: "#E0A800" },
  ],
  silver: [
    { o: 0, c: "#F1F5F9" },
    { o: 100, c: "#94A3B8" },
  ],
  bronze: [
    { o: 0, c: "#F0A868" },
    { o: 100, c: "#B4651F" },
  ],
};

/**
 * 티어 색을 CSS 변수로 참조한다.
 * TIER_COLOR의 하드코딩 값을 그대로 쓰면 라이트 테마에서 따라오지 않는다 —
 * 예를 들어 #FFD700은 흰 배경에서 대비 1.4:1이라 글자로는 안 보인다.
 * 실제 값은 globals.css가 테마별로 정의한다.
 */
export const tierVar = (tier: Tier) => `var(--color-tier-${tier})`;

export const TIER_LABEL: Record<Tier, string> = {
  prism: "PRISM",
  gold: "GOLD",
  silver: "SILVER",
  bronze: "BRONZE",
};

export const TIER_DESC: Record<Tier, string> = {
  prism: "가장 뛰어난 성능의 최상위 티어",
  gold: "매우 우수한 성능의 상위 티어",
  silver: "안정적인 성능의 중간 티어",
  bronze: "기본적인 성능의 하위 티어",
};

/** 점수 -> 티어. 컷은 여기서만 바꾼다. */
export const TIER_CUT = { prism: 90, gold: 80, silver: 65 } as const;

/**
 * 티어별 점수 구간 라벨. TIER_CUT에서 계산하므로 컷을 바꾸면 자동으로 따라온다.
 * 문구를 손으로 적어두면 컷을 조정했을 때 화면만 거짓말을 하게 된다.
 */
export const TIER_RANGE_LABEL: Record<Tier, string> = {
  prism: `${TIER_CUT.prism} +`,
  gold: `${TIER_CUT.gold} – ${TIER_CUT.prism - 0.1}`,
  silver: `${TIER_CUT.silver} – ${TIER_CUT.gold - 0.1}`,
  bronze: `${TIER_CUT.silver} 미만`,
};

export function tierOf(score: number): Tier {
  if (score >= TIER_CUT.prism) return "prism";
  if (score >= TIER_CUT.gold) return "gold";
  if (score >= TIER_CUT.silver) return "silver";
  return "bronze";
}

// ---------------------------------------------------------------------------
// 지오메트리 - 중심(256,235)에서 뻗은 10개 삼각 패싯
// 인덱스: 0,1 = 위쪽 뿔 / 2,3 = 오른쪽 팔 / 4,5 = 우하단 다리
//         6,7 = 좌하단 다리 / 8,9 = 왼쪽 팔
// ---------------------------------------------------------------------------
export const CENTER = [256, 235] as const;

export const FACET_POINTS = [
  "256,70 186,201 256,235",
  "256,70 326,201 256,235",
  "436,201 326,201 256,235",
  "436,201 300,305 256,235",
  "367,412 300,305 256,235",
  "367,412 256,272 256,235",
  "145,412 256,272 256,235",
  "145,412 212,305 256,235",
  "76,201 212,305 256,235",
  "76,201 186,201 256,235",
] as const;

/** 각 패싯의 그라데이션 축 (userSpaceOnUse) - 팁에서 중심 방향 */
export const FACET_AXIS: readonly (readonly [number, number, number, number])[] = [
  [256, 64, 256, 230], [256, 64, 256, 230],
  [440, 198, 256, 230], [440, 198, 256, 230],
  [370, 416, 256, 230], [370, 416, 256, 230],
  [142, 416, 256, 230], [142, 416, 256, 230],
  [72, 198, 256, 230], [72, 198, 256, 230],
];

/** 중심에서 각 뿔로 뻗는 능선 하이라이트 */
export const SPINES: readonly (readonly [number, number, number, number, number])[] = [
  // x1, y1, strokeWidth, opacity, spines[] 인덱스
  [256, 70, 2, 0.9, 0],
  [436, 201, 1.5, 0.75, 1],
  [76, 201, 1.5, 0.8, 2],
  [367, 412, 1.2, 0.55, 3],
  [145, 412, 1.2, 0.6, 4],
];

export interface TierArt {
  facets: { o: number; c: string }[][];
  spines: string[];
  core: string;
}

/**
 * 앰비언트 글로우.
 * radialGradient + circle이 아니라 CSS drop-shadow를 쓴다 —
 * Figma의 글로우는 원형 디스크가 아니라 별 실루엣을 따라 번지는 블룸이고,
 * drop-shadow만이 그 모양을 낸다. (원형 그라데이션은 별 뒤에 동그란 판이 보인다.)
 * 블러라서 비싸다. 히어로에서만 켤 것.
 */
const GLOW_RGB: Record<Tier, [string, string]> = {
  prism: ["123,104,255", "255,61,245"],
  gold: ["255,215,0", "212,175,55"],
  silver: ["226,232,240", "148,163,184"],
  bronze: ["205,127,50", "139,69,19"],
};

export function glowFilter(tier: Tier, size: number): string {
  const [near, far] = GLOW_RGB[tier];
  const a = Math.max(3, Math.round(size * 0.07));
  const b = Math.max(8, Math.round(size * 0.19));
  return `drop-shadow(0 0 ${a}px rgba(${near},0.5)) drop-shadow(0 0 ${b}px rgba(${far},0.26))`;
}

export const TIER_ART: Record<Tier, TierArt> = {
  prism: {
    facets: [
      [{ o: 0, c: "#FFFFFF" }, { o: 30, c: "#D0F8FF" }, { o: 70, c: "#79B8FF" }, { o: 100, c: "#6C5CE7" }],
      [{ o: 0, c: "#FFFFFF" }, { o: 35, c: "#FFEAA7" }, { o: 70, c: "#FF9FF3" }, { o: 100, c: "#E056FD" }],
      [{ o: 0, c: "#FFF3E0" }, { o: 40, c: "#FFB868" }, { o: 80, c: "#FF6584" }, { o: 100, c: "#C0392B" }],
      [{ o: 0, c: "#FF8AA2" }, { o: 50, c: "#E6528D" }, { o: 100, c: "#C91C93" }],
      [{ o: 0, c: "#FF89DD" }, { o: 50, c: "#CC5F7E" }, { o: 100, c: "#733FDA" }],
      [{ o: 0, c: "#B46BCF" }, { o: 60, c: "#982DDD" }, { o: 100, c: "#801FCD" }],
      [{ o: 0, c: "#828BEB" }, { o: 60, c: "#4C53CE" }, { o: 100, c: "#3540BD" }],
      [{ o: 0, c: "#00FCFD" }, { o: 45, c: "#4B97E3" }, { o: 100, c: "#4127BD" }],
      [{ o: 0, c: "#3ED6F6" }, { o: 60, c: "#20A7E9" }, { o: 100, c: "#1780C0" }],
      [{ o: 0, c: "#E0FBFC" }, { o: 40, c: "#54A0FF" }, { o: 100, c: "#5F27CD" }],
    ],
    spines: ["#FFFFFF", "#FFF0F5", "#E6FFFF", "#B83B5E", "#2575FC"],
    core: "#FFFFFF",
    },
  gold: {
    facets: [
      [{ o: 0, c: "#FFF8D6" }, { o: 45, c: "#FFE066" }, { o: 100, c: "#FFC000" }],
      [{ o: 0, c: "#FFFDF0" }, { o: 40, c: "#FFD700" }, { o: 100, c: "#CC9900" }],
      [{ o: 0, c: "#FFF6CC" }, { o: 55, c: "#FFCE00" }, { o: 100, c: "#D49B00" }],
      [{ o: 0, c: "#FFC21D" }, { o: 65, c: "#F9B400" }, { o: 100, c: "#D29600" }],
      [{ o: 0, c: "#FFD83A" }, { o: 50, c: "#FEBA00" }, { o: 100, c: "#CB9300" }],
      [{ o: 0, c: "#FFC223" }, { o: 60, c: "#FFB807" }, { o: 100, c: "#EDAA00" }],
      [{ o: 0, c: "#FFC52B" }, { o: 50, c: "#FFBA0B" }, { o: 100, c: "#F1AD00" }],
      [{ o: 0, c: "#FFE57E" }, { o: 50, c: "#FFDD24" }, { o: 100, c: "#EEB000" }],
      [{ o: 0, c: "#FFC219" }, { o: 60, c: "#F6B200" }, { o: 100, c: "#D49800" }],
      [{ o: 0, c: "#FFFBEB" }, { o: 40, c: "#FFE266" }, { o: 100, c: "#FFD700" }],
    ],
    spines: ["#FFFDEB", "#FFF7D1", "#FFF9DB", "#C79200", "#E6A800"],
    core: "#FFFFFF",
    },
  silver: {
    facets: [
      [{ o: 0, c: "#FFFFFF" }, { o: 50, c: "#E2E8F0" }, { o: 100, c: "#CBD5E1" }],
      [{ o: 0, c: "#F8FAFC" }, { o: 40, c: "#CBD5E1" }, { o: 100, c: "#94A3B8" }],
      [{ o: 0, c: "#FFFFFF" }, { o: 60, c: "#E2E8F0" }, { o: 100, c: "#94A3B8" }],
      [{ o: 0, c: "#AEB9C9" }, { o: 70, c: "#8795A9" }, { o: 100, c: "#687C99" }],
      [{ o: 0, c: "#D2DBE5" }, { o: 50, c: "#A3B0C2" }, { o: 100, c: "#77879D" }],
      [{ o: 0, c: "#9AA6B6" }, { o: 60, c: "#7F90A9" }, { o: 100, c: "#6982A5" }],
      [{ o: 0, c: "#BBC4D2" }, { o: 50, c: "#9AA6B6" }, { o: 100, c: "#7F90A9" }],
      [{ o: 0, c: "#E6EBF2" }, { o: 50, c: "#D2DBE5" }, { o: 100, c: "#A3B0C2" }],
      [{ o: 0, c: "#B0BBCA" }, { o: 60, c: "#8A98AB" }, { o: 100, c: "#6C7F9B" }],
      [{ o: 0, c: "#FFFFFF" }, { o: 40, c: "#F1F5F9" }, { o: 100, c: "#CBD5E1" }],
    ],
    spines: ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#94A3B8", "#CBD5E1"],
    core: "#FFFFFF",
    },
  bronze: {
    facets: [
      [{ o: 0, c: "#FFD1A4" }, { o: 45, c: "#E39252" }, { o: 100, c: "#CD7F32" }],
      [{ o: 0, c: "#FCE1C5" }, { o: 40, c: "#CD7F32" }, { o: 100, c: "#A55A22" }],
      [{ o: 0, c: "#FEDBB7" }, { o: 55, c: "#D9823E" }, { o: 100, c: "#A8571E" }],
      [{ o: 0, c: "#DB7A36" }, { o: 65, c: "#C95F1C" }, { o: 100, c: "#B04B11" }],
      [{ o: 0, c: "#DE9359" }, { o: 50, c: "#CD6A25" }, { o: 100, c: "#A94F17" }],
      [{ o: 0, c: "#E2742F" }, { o: 60, c: "#DE5E15" }, { o: 100, c: "#CE5212" }],
      [{ o: 0, c: "#E48039" }, { o: 50, c: "#EA6E15" }, { o: 100, c: "#D85A0D" }],
      [{ o: 0, c: "#E7A16A" }, { o: 50, c: "#D4914F" }, { o: 100, c: "#C56522" }],
      [{ o: 0, c: "#DC7832" }, { o: 60, c: "#CA6019" }, { o: 100, c: "#B34E10" }],
      [{ o: 0, c: "#FFE0C2" }, { o: 40, c: "#F09F62" }, { o: 100, c: "#CD7F32" }],
    ],
    spines: ["#FFE9D6", "#FFD8B5", "#FFE1C7", "#9E511B", "#CD7F32"],
    core: "#FFF3E8",
    },
};
/* Footer: components/tier/tierTokens.ts */
