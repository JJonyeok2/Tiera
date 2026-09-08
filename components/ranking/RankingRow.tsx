/* Header: 랭킹 한 줄. 서버 컴포넌트다 — 비교 선택만 클라이언트로 뺀다. */
import Link from "next/link";
import ScoreRing from "./ScoreRing";
import { GapBadge, RankChange, StatusBadge } from "./Badges";
import { COUNTRY_LABEL } from "@/lib/labels";
import type { RankingRow as Row } from "@/lib/queries";
import CompareToggle from "./CompareToggle";

export default function RankingRow({ row }: { row: Row }) {
  return (
    <li className="border-b border-[var(--color-line-soft)]">
      <div className="flex items-center gap-3 py-3.5 sm:gap-4">
        <span className="w-6 shrink-0 text-right text-sm tabular-nums text-[var(--color-text-mute)]">
          {row.rank}
        </span>

        <ScoreRing
          score={row.score}
          tier={row.tier}
          provisional={row.status === "PROVISIONAL"}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Link
              href={`/models/${row.slug}`}
              className="truncate text-[15px] font-semibold hover:underline"
            >
              {row.name}
            </Link>
            <span className="truncate text-xs text-[var(--color-text-mute)]">
              {row.developerName} · {COUNTRY_LABEL[row.country]}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={row.status} />
            <span className="text-[11px] text-[var(--color-text-mute)] tabular-nums">
              리뷰 {row.reviewCount.toLocaleString("ko-KR")}개
            </span>
            <RankChange change={row.rankChange} />
            <GapBadge gap={row.gap} />
          </div>
        </div>

        <CompareToggle slug={row.slug} name={row.name} />
      </div>
    </li>
  );
}
/* Footer: components/ranking/RankingRow.tsx */
