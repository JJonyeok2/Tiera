/* Header: 랭킹 행/상세에 붙는 작은 배지들 */
import { TIER_LABEL, tierVar } from "@/components/tier/tierTokens";
import { GAP_LABEL, type Gap } from "@/lib/scoring/score";
import type { TierName } from "@/db/schema";

const toKey = (t: TierName) => t.toLowerCase() as "prism" | "gold" | "silver" | "bronze";

export function TierPill({ tier }: { tier: TierName }) {
  const k = toKey(tier);
  return (
    <span
      className="rounded-full border px-2.5 py-[3px] text-[9px] font-semibold tracking-[0.18em]"
      style={{ borderColor: tierVar(k), color: tierVar(k) }}
    >
      {TIER_LABEL[k]}
    </span>
  );
}

export function StatusBadge({ status }: { status: "CERTIFIED" | "PROVISIONAL" }) {
  const certified = status === "CERTIFIED";
  return (
    <span
      title={
        certified
          ? "평가 수가 충분해 점수가 안정적입니다"
          : "평가 수가 아직 적어 점수가 크게 움직일 수 있습니다"
      }
      className={`rounded px-1.5 py-[2px] text-[10px] font-medium ${
        certified
          ? "bg-emerald-500/12 text-emerald-400"
          : "bg-amber-500/12 text-amber-400"
      }`}
    >
      {certified ? "공인" : "평가 중"}
    </span>
  );
}

export function RankChange({ change }: { change: number | null }) {
  // 스냅샷이 없으면 아무것도 그리지 않는다. 어제 데이터가 없는 상태에서
  // 전 행에 "NEW"를 붙이면 정보가 아니라 잡음이 된다.
  if (change === null || change === 0) return null;
  const up = change > 0;
  return (
    <span
      className={`text-[10px] font-medium tabular-nums ${up ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}
      aria-label={up ? `${change}계단 상승` : `${-change}계단 하락`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(change)}
    </span>
  );
}

export function GapBadge({ gap, verbose = false }: { gap: Gap | null; verbose?: boolean }) {
  if (!gap || gap.verdict === "ALIGNED") return null;
  const { label, desc } = GAP_LABEL[gap.verdict];
  const feel = gap.verdict === "FEEL_BETTER";
  return (
    <span
      title={`${desc} (벤치마크 ${gap.benchmarkRank}위 / 커뮤니티 ${gap.communityRank}위)`}
      className={`rounded px-1.5 py-[2px] text-[10px] font-medium ${
        feel ? "bg-sky-500/12 text-sky-300" : "bg-fuchsia-500/12 text-fuchsia-300"
      }`}
    >
      {label}
      {verbose && (
        <span className="ml-1 font-normal opacity-70">
          벤치 {gap.benchmarkRank}위 · 커뮤 {gap.communityRank}위
        </span>
      )}
    </span>
  );
}
/* Footer: components/ranking/Badges.tsx */
