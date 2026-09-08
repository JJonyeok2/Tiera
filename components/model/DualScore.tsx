/* Header: 듀얼 스코어 카드 — Tiera의 핵심 화면 요소.
   벤치마크(스펙)와 커뮤니티(체감)를 같은 크기로 나란히 놓고, 그 사이에 괴리 배지를 둔다.
   한쪽을 더 크게 그리면 "이쪽이 정답"이라는 인상을 주므로 반드시 대칭으로 둔다. */
import TierStar from "@/components/tier/TierStar";
import { GapBadge } from "@/components/ranking/Badges";
import { TIER_LABEL } from "@/components/tier/tierTokens";
import { GAP_LABEL, type Gap } from "@/lib/scoring/score";
import type { ScoreCell } from "@/lib/queries";

const toKey = (t: ScoreCell["tier"]) => t.toLowerCase() as "prism" | "gold" | "silver" | "bronze";

function Panel({
  title, cell, rank, sub, provisional,
}: {
  title: string; cell: ScoreCell | undefined; rank: number | null;
  sub: string; provisional?: boolean;
}) {
  return (
    <div className="flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-center">
      <p className="text-[11px] tracking-wider text-[var(--color-text-mute)]">{title}</p>
      {cell ? (
        <>
          <div className="mt-3 flex justify-center">
            <TierStar tier={toKey(cell.tier)} size={64} glow />
          </div>
          <p className="mt-3 text-4xl font-bold tabular-nums">{cell.score.toFixed(1)}</p>
          <p className="mt-1 text-[11px] tracking-[0.18em] text-[var(--color-text-dim)]">
            {TIER_LABEL[toKey(cell.tier)]}
            {rank !== null && <span className="ml-2 tracking-normal">전체 {rank}위</span>}
          </p>
          <p className="mt-2 text-[11px] text-[var(--color-text-mute)]">
            {sub}
            {provisional && " · 평가 중"}
          </p>
        </>
      ) : (
        <p className="py-14 text-xs text-[var(--color-text-mute)]">데이터 없음</p>
      )}
    </div>
  );
}

export default function DualScore({
  community, benchmark, communityRank, benchmarkRank, gap, provisional,
}: {
  community?: ScoreCell; benchmark?: ScoreCell;
  communityRank: number | null; benchmarkRank: number | null;
  gap: Gap | null; provisional: boolean;
}) {
  return (
    <section aria-label="점수 요약">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Panel
          title="커뮤니티 점수" cell={community} rank={communityRank}
          sub={`리뷰 ${(community?.sampleCount ?? 0).toLocaleString("ko-KR")}개`}
          provisional={provisional}
        />
        <Panel
          title="벤치마크 점수" cell={benchmark} rank={benchmarkRank}
          sub={`반영 벤치마크 ${benchmark?.sampleCount ?? 0}개`}
        />
      </div>

      {gap && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-center">
          {gap.verdict === "ALIGNED" ? (
            <span className="rounded bg-[var(--color-surface-2)] px-2 py-[3px] text-[10px] text-[var(--color-text-dim)]">
              일치
            </span>
          ) : (
            <GapBadge gap={gap} />
          )}
          <span className="text-xs text-[var(--color-text-dim)]">{GAP_LABEL[gap.verdict].desc}</span>
          <span className="text-[11px] text-[var(--color-text-mute)]">
            벤치마크 {gap.benchmarkRank}위 · 커뮤니티 {gap.communityRank}위
          </span>
        </div>
      )}
    </section>
  );
}
/* Footer: components/model/DualScore.tsx */
