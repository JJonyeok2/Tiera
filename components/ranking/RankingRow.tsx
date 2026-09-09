/* Header: 랭킹 한 줄. 서버 컴포넌트다 — 비교 선택만 클라이언트로 뺀다.

   표본 수(reviewCount)는 점수 종류에 따라 의미가 다르다.
   커뮤니티는 "리뷰를 쓴 사람 수", 벤치마크는 "집계에 쓴 벤치마크 종류 수"다.
   둘 다 "리뷰 N개"로 찍었더니 벤치마크 탭에서 리뷰가 0건인데도
   "리뷰 5개"가 떠서, 없는 평가가 있는 것처럼 보였다. */
import Link from "next/link";
import ScoreRing from "./ScoreRing";
import { GapBadge, RankChange, StatusBadge } from "./Badges";
import { COUNTRY_LABEL } from "@/lib/labels";
import type { RankingRow as Row } from "@/lib/queries";
import type { ScoreType } from "@/db/schema";
import CompareToggle from "./CompareToggle";

export default function RankingRow({
  row,
  scoreType,
}: {
  row: Row;
  scoreType: ScoreType;
}) {
  const isCommunity = scoreType === "COMMUNITY";
  return (
    <li className="border-b border-[var(--color-line-soft)]">
      <div className="flex items-center gap-3 py-3.5 sm:gap-4">
        <span className="w-6 shrink-0 text-right text-sm tabular-nums text-[var(--color-text-mute)]">
          {row.rank}
        </span>

        <ScoreRing
          score={row.score}
          tier={row.tier}
          provisional={isCommunity && row.status === "PROVISIONAL"}
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
            {/* 공인/평가 중은 리뷰 수에서 나오는 신뢰도 표시라 커뮤니티 탭에서만 의미가 있다 */}
            {isCommunity && <StatusBadge status={row.status} />}
            <span className="text-[11px] text-[var(--color-text-mute)] tabular-nums">
              {isCommunity
                ? `리뷰 ${row.reviewCount.toLocaleString("ko-KR")}개`
                : `벤치마크 ${row.reviewCount.toLocaleString("ko-KR")}종`}
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
