/* Header: Tiera 티어 별 — PRISM / GOLD / SILVER / BRONZE */
// components/tier/TierStar.tsx
// Tiera 티어 별 - PRISM / GOLD / SILVER / BRONZE
//
//   <TierStar tier="prism" size={22} />                    // 랭킹 행 (장식용, 기본)
//   <TierStar tier="gold" size={140} glow labelled />      // 모델 상세 히어로
//
// 서버 컴포넌트다. 훅을 쓰지 않으므로 "use client"가 필요 없고
// 클라이언트 번들에 아무것도 싣지 않는다.
//
// 전제: app/layout.tsx에 <TierStarDefs />가 한 번 마운트되어 있어야 한다.
//
// glow는 CSS drop-shadow(블러)다. Figma의 글로우가 원형 판이 아니라
// 별 실루엣을 따라 번지는 형태라서 그렇다. 블러는 비싸므로
// 별이 여러 개 깔리는 리스트에서는 기본값(false)을 유지한다.

import { FACET_POINTS, SPINES, TIER_ART, TIER_LABEL, glowFilter, type Tier } from "./tierTokens";

/** 이 크기 미만에서는 능선/중심점이 서브픽셀이라 보이지 않으므로 그리지 않는다 */
const DETAIL_MIN_PX = 28;

export interface TierStarProps {
  tier: Tier;
  /** 렌더 크기(px). 권장: 22(리스트) / 40(카드) / 96~160(히어로) */
  size?: number;
  /** 뒤쪽 앰비언트 글로우. 히어로에서만 켠다 */
  glow?: boolean;
  /**
   * true면 스크린리더에 티어명을 읽어준다.
   * 기본 false — 별 옆에 텍스트 라벨(PRISM 등)을 항상 두는 것이 디자인 규칙이라,
   * 리스트에서 켜면 "프리즘 티어 PRISM"으로 두 번 읽힌다.
   */
  labelled?: boolean;
  className?: string;
}

export default function TierStar({
  tier,
  size = 22,
  glow = false,
  labelled = false,
  className,
}: TierStarProps) {
  const art = TIER_ART[tier];
  const detailed = size >= DETAIL_MIN_PX;
  const a11y = labelled
    ? ({ role: "img" as const, "aria-label": `${TIER_LABEL[tier]} 티어` })
    : ({ "aria-hidden": true as const, focusable: false as const });

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        // 라이트 테마에서는 --star-outline이 얇은 외곽선을, 다크에서는 none이다.
        filter: glow ? `${glowFilter(tier, size)} var(--star-outline, none)` : "var(--star-outline, none)",
      }}
      {...a11y}
    >
      {FACET_POINTS.map((points, i) => (
        <polygon key={i} points={points} fill={`url(#tierstar-${tier}-f${i})`} />
      ))}

      {detailed && (
        <>
          {SPINES.map(([x, y, w, o, si], i) => (
            <line
              key={i}
              x1={x} y1={y} x2={256} y2={235}
              stroke={art.spines[si]}
              strokeWidth={w}
              strokeLinecap="round"
              opacity={o}
            />
          ))}
          <circle cx="256" cy="235" r="3.5" fill={art.core} />
        </>
      )}
    </svg>
  );
}
/* Footer: components/tier/TierStar.tsx */
