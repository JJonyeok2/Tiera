/* ---------------------------------------------------------------------------
 * Header: 도구 카드 — 목록의 한 칸.
 *
 * 모델 쪽 RankingRow와 의도적으로 다르다. 저기는 순위와 점수가 주인공인데,
 * 여기는 **후기가 0개인 상태로 먼저 세상에 나간다.** 점수를 주인공으로 두면
 * 모든 카드가 빈칸으로 시작한다.
 *
 * 카드가 답하는 질문은 "몇 위냐"가 아니라 이 셋이다:
 *   뭘 해주나 · 돈이 드나 · 한국어가 되나
 *
 * 색을 쓰는 규칙 하나:
 *   **용도별로 색을 뿌리지 않는다.** 40여 장에 10색이면 색종이가 되고, 그 색이
 *   아무 정보도 나르지 않는다. 색은 사용자가 실제로 판단에 쓰는 두 가지에만
 *   쓴다 — 돈이 드는가(유료·체험만), 한국어가 되는가. 나머지는 전부 무채색이다.
 *
 * 로고는 logoUrl이 있을 때만 띄우고, 없으면 이름 첫 글자 타일로 떨어진다.
 * **로고를 직접 그리지 않는다** — 남의 상표를 흉내 내 SVG로 만드는 건 재현이다.
 * logoUrl은 각 서비스가 공개해 둔 파비콘·앱 아이콘을 받아 크롭한 뒤 self-host한
 * 것이다(public/logos, 과정은 scripts/process-logos.py 머리말). 못 구한 도구는
 * 첫 글자가 그 자리를 지킨다.
 * ------------------------------------------------------------------------- */

import Image from "next/image";
import Link from "next/link";
import TierStar from "@/components/tier/TierStar";
import type { ToolListRow } from "@/lib/queries";
import { KOREAN_LEVEL_LABEL, PRICING_LABEL, PURPOSE_LABEL } from "@/lib/labels";
import { TOOL_MIN_REVIEWS_FOR_TIER } from "@/lib/scoring/constants";

/** 이름 첫 글자. 영문은 대문자로, 한글은 그대로. */
function initial(name: string): string {
  const c = name.trim()[0] ?? "?";
  return /[a-z]/.test(c) ? c.toUpperCase() : c;
}

export default function ToolCard({ tool, index = 0 }: { tool: ToolListRow; index?: number }) {
  // 유료·체험만은 무료로 오해하기 쉬운 지점이다. 여기에만 경고색을 쓴다.
  const payAttention = tool.pricingKind === "PAID" || tool.pricingKind === "TRIAL";
  // 한국어를 모르는 것과 안 되는 것은 다르다. 둘 다 눈에 띄어야 하지만
  // "확인 중"을 경고색으로 칠하면 도구 탓처럼 보인다 — 우리가 못 채운 칸이다.
  const koreanWeak = tool.koreanLevel === "NONE" || tool.koreanLevel === "PARTIAL";
  const koreanBest = tool.koreanLevel === "NATIVE";
  // 후기 한두 개로 별과 점수를 띄우면 "이 도구는 실버 등급"으로 읽힌다.
  // 실제로는 "한 사람이 그렇게 말했다"다.
  const showTier =
    tool.tier !== null && tool.score !== null && tool.reviewCount >= TOOL_MIN_REVIEWS_FOR_TIER;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      // 순서대로 아주 짧게 올라온다. 수십 장이 한 번에 툭 나타나면 깜빡인 것처럼 보인다.
      // 8장까지만 지연을 준다 — 그 뒤까지 기다리게 하면 답답해진다.
      style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
      className="tiera-rise group relative flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-tier-prism)] hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.45)]"
    >
      {/* 호버 시 위쪽에만 브랜드 그라데이션 실선. 카드 전체를 물들이지 않고
          "이걸 보고 있다"만 표시한다. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px scale-x-0 bg-[linear-gradient(90deg,#7b68ff,#ffb868)] transition-transform duration-300 group-hover:scale-x-100"
      />

      <div className="flex items-start gap-3">
        {tool.logoUrl ? (
          // 로고 타일은 테마와 상관없이 흰 바탕이다. 검은 글리프 아이콘(ChatGPT·
          // Midjourney 등)이 다크 모드의 어두운 타일 위에서 사라졌기 때문이다.
          // 파일 쪽에서 이미 크롭·여백을 맞춰 뒀으므로(scripts/process-logos.py)
          // 여기서는 타일을 꽉 채우기만 한다.
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-black/10">
            <Image
              src={tool.logoUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
              unoptimized
            />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold ${
              tool.origin === "KR"
                ? "bg-[var(--color-tier-prism)]/15 text-[var(--color-tier-prism)] ring-1 ring-inset ring-[var(--color-tier-prism)]/40"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-dim)] ring-1 ring-inset ring-[var(--color-line)]"
            }`}
          >
            {initial(tool.name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <h3 className="text-base font-bold leading-tight tracking-tight text-[var(--color-text)]">
              {tool.name}
            </h3>
            {tool.origin === "KR" && (
              <span className="rounded-md bg-[var(--color-tier-prism)]/12 px-1.5 py-px text-[10px] font-medium text-[var(--color-tier-prism)]">
                한국
              </span>
            )}
            {tool.studentFree && (
              <span className="rounded-md bg-[var(--color-surface-2)] px-1.5 py-px text-[10px] text-[var(--color-text-dim)]">
                대학생 혜택
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-[11px] text-[var(--color-text-mute)]">
            {tool.maker} · {PURPOSE_LABEL[tool.purpose]}
          </p>
        </div>

        {/* 점수는 표본이 설 때만 그린다. 없는 칸을 "–"로 채우지도 않는다. */}
        {showTier && (
          <div className="flex shrink-0 items-center gap-1">
            <TierStar
              tier={tool.tier!.toLowerCase() as "prism" | "gold" | "silver" | "bronze"}
              size={16}
            />
            <span className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
              {tool.score!.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <p className="mt-3 line-clamp-3 flex-1 text-[13px] leading-relaxed text-[var(--color-text-dim)]">
        {tool.summary}
      </p>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-[var(--color-line-soft)] pt-3">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
            payAttention
              ? "bg-[var(--color-tier-bronze)]/14 text-[var(--color-tier-bronze)]"
              : tool.pricingKind === "FREE"
                ? "bg-[var(--color-up)]/12 text-[var(--color-up)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-dim)]"
          }`}
        >
          {PRICING_LABEL[tool.pricingKind]}
        </span>

        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] ${
            koreanBest
              ? "bg-[var(--color-tier-prism)]/10 text-[var(--color-tier-prism)]"
              : koreanWeak
                ? "bg-[var(--color-surface-2)] text-[var(--color-text-mute)]"
                : "text-[var(--color-text-mute)]"
          }`}
        >
          {KOREAN_LEVEL_LABEL[tool.koreanLevel]}
        </span>

        {/* 후기 수는 있을 때만. 카드마다 "후기 없음"이 반복되면
            사이트가 비어 있다는 인상만 남는다. */}
        {tool.reviewCount > 0 && (
          <span className="ml-auto text-[10px] tabular-nums text-[var(--color-text-mute)]">
            후기 {tool.reviewCount}
          </span>
        )}

        {/* 카드가 어디로 가는지 알려준다. 지금은 카드 전체가 링크인데
            그걸 알려주는 표시가 하나도 없어서, 상세가 있는 줄 모르고 지나친다.
            후기 수가 있으면 그 옆에, 없으면 오른쪽 끝에 붙는다. */}
        <span
          aria-hidden="true"
          className={`flex items-center gap-0.5 text-[10px] text-[var(--color-text-mute)] transition-colors group-hover:text-[var(--color-tier-prism)] ${
            tool.reviewCount > 0 ? "" : "ml-auto"
          }`}
        >
          자세히
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">›</span>
        </span>
      </div>

      {/* 무료로 오해하기 쉬운 것은 카드에서 미리 말한다.
          상세로 들어가야 알 수 있게 두면, 가입하고 나서 아는 사람이 생긴다. */}
      {tool.caution && payAttention && (
        <p className="mt-2.5 rounded-lg bg-[var(--color-surface-2)]/70 px-2.5 py-2 text-[10px] leading-snug text-[var(--color-text-mute)]">
          {tool.caution}
        </p>
      )}
    </Link>
  );
}
/* Footer: components/tool/ToolCard.tsx */
