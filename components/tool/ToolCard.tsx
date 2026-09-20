/* ---------------------------------------------------------------------------
 * Header: 도구 카드 — 목록의 한 칸.
 *
 * 모델 쪽 RankingRow와 의도적으로 다르게 만들었다. 저기는 순위와 점수가 주인공인데,
 * 여기는 **후기가 0개인 상태로 먼저 세상에 나간다.** 점수를 주인공으로 두면
 * 39개 카드가 전부 빈칸으로 시작한다.
 *
 * 그래서 카드가 답하는 질문은 "몇 위냐"가 아니라 이 셋이다:
 *   뭘 해주나 · 돈이 드나 · 한국어가 되나
 * 점수는 붙으면 표시하고, 없으면 자리를 비우는 게 아니라 아예 안 그린다.
 * 회색 "–"가 39개 늘어선 화면은 미완성으로 읽힌다.
 * ------------------------------------------------------------------------- */

import Link from "next/link";
import TierStar from "@/components/tier/TierStar";
import type { ToolListRow } from "@/lib/queries";
import { KOREAN_LEVEL_LABEL, PRICING_LABEL, PURPOSE_LABEL } from "@/lib/labels";
import { TOOL_MIN_REVIEWS_FOR_TIER } from "@/lib/scoring/constants";

export default function ToolCard({ tool }: { tool: ToolListRow }) {
  // 유료·체험만은 무료로 오해하기 쉬운 지점이라 배지 색을 다르게 준다.
  const payAttention = tool.pricingKind === "PAID" || tool.pricingKind === "TRIAL";
  // 한국어를 모르는 것과 안 되는 것은 다르다. 둘 다 눈에 띄어야 하지만
  // "확인 중"을 경고색으로 칠하면 도구 탓처럼 보인다 — 우리가 못 채운 칸이다.
  const koreanWeak = tool.koreanLevel === "NONE" || tool.koreanLevel === "PARTIAL";
  // 후기 한두 개로 별과 점수를 띄우면 "이 도구는 실버 등급"으로 읽힌다.
  // 실제로는 "한 사람이 그렇게 말했다"다. 후기 수는 아래에 그대로 보여준다.
  const showTier =
    tool.tier !== null && tool.score !== null && tool.reviewCount >= TOOL_MIN_REVIEWS_FOR_TIER;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex w-full flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-text-mute)]"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">{tool.name}</h3>
            {tool.origin === "KR" && (
              <span className="rounded border border-[var(--color-tier-prism)] px-1.5 py-px text-[10px] text-[var(--color-tier-prism)]">
                국산
              </span>
            )}
            {tool.studentFree && (
              <span className="rounded bg-[var(--color-surface-2)] px-1.5 py-px text-[10px] text-[var(--color-text-dim)]">
                대학생 혜택
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-mute)]">
            {tool.maker} · {PURPOSE_LABEL[tool.purpose]}
          </p>
        </div>

        {/* 점수는 표본이 설 때만 그린다. 없는 칸을 "–"로 채우지도 않는다. */}
        {showTier && (
          <div className="flex shrink-0 items-center gap-1.5">
            <TierStar tier={tool.tier!.toLowerCase() as "prism" | "gold" | "silver" | "bronze"} size={18} />
            <span className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
              {tool.score!.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <p className="mt-2.5 line-clamp-3 flex-1 text-xs leading-relaxed text-[var(--color-text-dim)]">
        {tool.summary}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] ${
            payAttention
              ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
              : "text-[var(--color-text-mute)]"
          }`}
        >
          {PRICING_LABEL[tool.pricingKind]}
        </span>
        <span
          className={`text-[10px] ${
            koreanWeak ? "text-[var(--color-text-dim)]" : "text-[var(--color-text-mute)]"
          }`}
        >
          {KOREAN_LEVEL_LABEL[tool.koreanLevel]}
        </span>
        <span className="ml-auto text-[10px] tabular-nums text-[var(--color-text-mute)]">
          {tool.reviewCount > 0 ? `후기 ${tool.reviewCount}` : "후기 없음"}
        </span>
      </div>

      {/* 무료로 오해하기 쉬운 것은 카드에서 미리 말한다.
          상세로 들어가야 알 수 있게 두면, 가입하고 나서 아는 사람이 생긴다. */}
      {tool.caution && payAttention && (
        <p className="mt-2 border-t border-[var(--color-line-soft)] pt-2 text-[10px] leading-snug text-[var(--color-text-mute)]">
          {tool.caution}
        </p>
      )}
    </Link>
  );
}
/* Footer: components/tool/ToolCard.tsx */
