/* Header: 티어 별 그라데이션 <defs> 스프라이트 — 문서당 1회만 마운트 */
// components/tier/TierStarDefs.tsx
// 티어 별의 그라데이션 정의를 문서 전체에서 "한 번만" 렌더하는 스프라이트.
//
// 왜 분리했나:
//   같은 티어의 별은 그라데이션이 100% 동일하다. 별마다 <defs>를 새로 만들면
//   랭킹 20행 = linearGradient 200개가 DOM에 쌓인다. 순수 낭비다.
//   defs를 밖으로 빼면 (1) DOM이 가벼워지고 (2) useId가 필요 없어져
//   TierStar가 서버 컴포넌트로 남는다 = 클라이언트 번들 0.
//
// 사용법: app/layout.tsx의 <body> 최상단에 한 번만 두면 된다.
//   <body><TierStarDefs />{children}</body>
//
// 주의: 이걸 마운트하지 않으면 별이 검게 렌더된다.

import { TIERS, TIER_ART, FACET_AXIS, TIER_RING_STOPS } from "./tierTokens";

export default function TierStarDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {TIERS.map((tier) =>
          TIER_ART[tier].facets.map((stops, i) => {
            const [x1, y1, x2, y2] = FACET_AXIS[i];
            return (
              <linearGradient
                key={`${tier}-${i}`}
                id={`tierstar-${tier}-f${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                gradientUnits="userSpaceOnUse"
              >
                {stops.map((s) => (
                  <stop key={s.o} offset={`${s.o}%`} stopColor={s.c} />
                ))}
              </linearGradient>
            );
          })
        )}

        {/* 점수 링 게이지의 스트로크 그라데이션. ScoreRing이 url(#tierring-*)로 참조한다. */}
        {TIERS.map((tier) => (
          <linearGradient
            key={`ring-${tier}`}
            id={`tierring-${tier}`}
            x1="0" y1="0" x2="110" y2="110"
            gradientUnits="userSpaceOnUse"
          >
            {TIER_RING_STOPS[tier].map((s) => (
              <stop key={s.o} offset={`${s.o}%`} stopColor={s.c} />
            ))}
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
}
/* Footer: components/tier/TierStarDefs.tsx */
