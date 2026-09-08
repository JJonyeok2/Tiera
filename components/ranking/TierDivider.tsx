/* ---------------------------------------------------------------------------
 * Header: 티어 구분선
 *
 * 랭킹은 점수 내림차순이고 티어는 점수에서 파생되므로, 같은 티어는 반드시
 * 연속으로 붙는다. 그래서 티어가 바뀌는 지점에 한 줄만 끼워 넣으면
 * 그룹이 자연스럽게 나뉜다 — 행마다 티어 배지를 반복할 필요가 없어진다.
 *
 * 별은 여기 딱 한 번만 뜬다. 행마다 별을 그리면 20행에 별 20개가 깔려
 * 정작 티어 경계가 안 보인다.
 * ------------------------------------------------------------------------- */
import TierStar from "@/components/tier/TierStar";
import { TIER_LABEL, TIER_RANGE_LABEL, tierVar } from "@/components/tier/tierTokens";
import type { TierName } from "@/db/schema";

const toKey = (t: TierName) => t.toLowerCase() as "prism" | "gold" | "silver" | "bronze";

export default function TierDivider({ tier, count }: { tier: TierName; count: number }) {
  const k = toKey(tier);
  return (
    <div className="flex items-center gap-3 pt-7 pb-2 first:pt-1">
      <TierStar tier={k} size={30} glow labelled />

      <span
        className="text-[11px] font-semibold tracking-[0.22em]"
        style={{ color: tierVar(k) }}
      >
        {TIER_LABEL[k]}
      </span>

      <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-text-mute)]">
        {TIER_RANGE_LABEL[k]}
      </span>

      {/* 남은 폭을 채우는 선. 별에서 오른쪽으로 뻗어 나가는 모양이 된다. */}
      <span
        aria-hidden="true"
        className="h-px flex-1"
        style={{
          background: `linear-gradient(90deg, ${tierVar(k)}, transparent 94%)`,
          opacity: 0.65,
        }}
      />

      <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-text-mute)]">
        {count}개
      </span>
    </div>
  );
}
/* Footer: components/ranking/TierDivider.tsx */
