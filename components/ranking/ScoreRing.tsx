/* ---------------------------------------------------------------------------
 * Header: 점수 링
 *
 * 단순한 테두리 원이 아니라 SVG 게이지다. 호(arc) 길이가 점수를 나타내므로
 * 숫자를 읽기 전에 "얼마나 찼는지"가 먼저 보인다.
 *
 * 스트로크는 티어별 그라데이션을 쓴다. PRISM은 브랜드 멀티 휴
 * (cyan → violet → magenta)이고, 나머지 티어는 자기 색의 밝음→어두움 2스톱이다.
 * 그라데이션 정의는 TierStarDefs에 함께 실려 문서당 한 번만 렌더된다.
 *
 * 게이지 눈금은 20~100이다. 0이 아니라 20에서 시작하는 이유는
 * 두 점수 체계의 하한이 20이기 때문이다 (lib/scoring/constants.ts의 BENCH_FLOOR).
 * 0부터 그리면 최하위 모델도 링이 5분의 1쯤 차 있는 것처럼 보인다.
 * ------------------------------------------------------------------------- */
import { BENCH_FLOOR } from "@/lib/scoring/constants";
import type { TierName } from "@/db/schema";

const toKey = (t: TierName) => t.toLowerCase() as "prism" | "gold" | "silver" | "bronze";

export default function ScoreRing({
  score,
  tier,
  provisional = false,
  size = 40,
}: {
  score: number;
  tier: TierName;
  provisional?: boolean;
  size?: number;
}) {
  const key = toKey(tier);
  const R = 46;
  const C = 2 * Math.PI * R;
  const filled = Math.max(0, Math.min(1, (score - BENCH_FLOOR) / (100 - BENCH_FLOOR)));
  const strokeW = 8;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={provisional ? "평가 수가 아직 적어 점수가 크게 움직일 수 있습니다" : undefined}
    >
      <svg
        viewBox="0 0 110 110"
        width={size}
        height={size}
        aria-hidden="true"
        style={{ display: "block", transform: "rotate(-90deg)" }}
      >
        {/* 트랙 — 어디까지 찰 수 있는지. 평가 중이면 점선으로 그려
            "아직 확정 아님"을 색이 아닌 형태로도 알린다. */}
        <circle
          cx="55" cy="55" r={R}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={strokeW}
          strokeDasharray={provisional ? "5 6" : undefined}
        />
        {/* 게이지 — 호 길이가 점수다 */}
        <circle
          cx="55" cy="55" r={R}
          fill="none"
          stroke={`url(#tierring-${key})`}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${C * filled} ${C}`}
          opacity={provisional ? 0.6 : 1}
        />
      </svg>

      <span
        className="absolute font-semibold tabular-nums text-[var(--color-text)]"
        style={{ fontSize: size * 0.33 }}
      >
        {Math.round(score)}
      </span>
    </span>
  );
}
/* Footer: components/ranking/ScoreRing.tsx */
