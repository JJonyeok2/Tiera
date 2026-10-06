/* ---------------------------------------------------------------------------
 * Header: 도구 목록 — 비교해서 고르는 표.
 *
 * 예전엔 똑같은 둥근 카드를 두 줄로 깔았다. 보기엔 정돈돼 보여도, 이 사이트에서
 * 사람이 하는 일은 "둘러보기"보다 **견주기**다 — 이건 무료인가, 저건 한국어가
 * 되나. 카드마다 그 답이 다른 자리에 있으니 눈이 카드 사이를 오가야 했다.
 *
 * 그래서 한 판 위의 행으로 바꿨다. 넓은 화면에서는 가격·한국어가 **같은 세로줄**에
 * 서서, 위아래로 훑기만 해도 비교가 된다. 좁은 화면에서는 행이 접혀서 이름 →
 * 설명 → 가격·한국어 순으로 쌓인다.
 *
 * 색을 쓰는 규칙은 카드 시절과 같다: 돈이 드는지(유료·체험만 경고색, 완전 무료는
 * 초록)와 한국어(완벽만 강조)에만 쓴다. 나머지는 무채색이다.
 * ------------------------------------------------------------------------- */
import Link from "next/link";
import TierStar from "@/components/tier/TierStar";
import ToolLogo from "@/components/tool/ToolLogo";
import type { ToolListRow } from "@/lib/queries";
import { KOREAN_LEVEL_LABEL, PRICING_LABEL } from "@/lib/labels";
import { TOOL_MIN_REVIEWS_FOR_TIER } from "@/lib/scoring/constants";

/** 넓은 화면의 열 배치. 머리줄과 행이 같은 값을 써야 세로줄이 맞는다. */
const COLS = "lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_7rem_7.5rem]";

export default function ToolList({ tools }: { tools: ToolListRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
      {/* 열 이름은 넓은 화면에서만. 접힌 행에서는 위치가 아니라 모양(배지)으로 구분된다. */}
      <div
        aria-hidden="true"
        className={`hidden border-b border-[var(--color-line-soft)] px-5 py-2.5 text-[12px] text-[var(--color-text-mute)] lg:grid lg:gap-6 ${COLS}`}
      >
        <span>도구</span>
        <span>하는 일</span>
        <span>가격</span>
        <span>한국어</span>
      </div>
      <ul className="divide-y divide-[var(--color-line-soft)]">
        {tools.map((t) => (
          <li key={t.slug}>
            <ToolRow tool={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToolRow({ tool }: { tool: ToolListRow }) {
  // 유료·체험만은 무료로 오해하기 쉬운 지점이다. 여기에만 경고색을 쓴다.
  const payAttention =
    tool.pricingKind === "PAID" || tool.pricingKind === "TRIAL";
  const koreanBest = tool.koreanLevel === "NATIVE";
  const koreanWeak =
    tool.koreanLevel === "NONE" || tool.koreanLevel === "PARTIAL";
  // 후기 한두 개로 별과 점수를 띄우면 "이 도구는 실버 등급"으로 읽힌다.
  const showTier =
    tool.tier !== null &&
    tool.score !== null &&
    tool.reviewCount >= TOOL_MIN_REVIEWS_FOR_TIER;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      // 대표 용도. 화면에는 안 보이지만 "본업 도구가 겸업 도구보다 먼저" 정렬을
      // 테스트가 확인하는 근거다(tests/e2e/tools.spec.ts).
      data-purpose={tool.purpose}
      className={`group grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3.5 gap-y-2.5 px-5 py-4 transition-colors hover:bg-[var(--color-surface-2)]/45 lg:items-start lg:gap-6 lg:py-4.5 ${COLS}`}
    >
      {/* 1열: 로고·이름·제작사 */}
      <div className="contents lg:flex lg:min-w-0 lg:items-start lg:gap-3.5">
        <ToolLogo name={tool.name} logoUrl={tool.logoUrl} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <h3 className="text-[17px] font-bold leading-snug tracking-tight text-[var(--color-text)] group-hover:underline group-hover:decoration-[var(--color-line)] group-hover:underline-offset-4">
              {tool.name}
            </h3>
            {tool.origin === "KR" && <Badge>한국</Badge>}
            {tool.studentFree && <Badge>대학생 혜택</Badge>}
            {showTier && (
              <span className="flex items-center gap-1">
                <TierStar
                  tier={
                    tool.tier!.toLowerCase() as
                      "prism" | "gold" | "silver" | "bronze"
                  }
                  size={14}
                />
                <span className="text-[13px] font-semibold tabular-nums text-[var(--color-text)]">
                  {tool.score!.toFixed(1)}
                </span>
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-[var(--color-text-mute)]">
            {tool.maker}
          </p>
        </div>
      </div>

      {/* 2열: 하는 일. 좁은 화면에서는 로고 아래 칸을 비우지 않고 전체 폭을 쓴다. */}
      <div className="col-span-2 min-w-0 lg:col-span-1">
        <p className="line-clamp-2 text-[15px] leading-[1.6] text-[var(--color-text-dim)]">
          {tool.summary}
        </p>
        {/* 무료로 오해하기 쉬운 것은 목록에서 미리 말한다. 상세에서만 보이면
            가입하고 나서 아는 사람이 생긴다. */}
        {tool.caution && payAttention && (
          <p className="mt-1.5 text-[13px] leading-normal text-[var(--color-tier-bronze)]">
            {tool.caution}
          </p>
        )}
      </div>

      {/* 3·4열: 가격·한국어. 좁은 화면에서는 한 줄에 나란히. */}
      <div className="col-span-2 flex flex-wrap items-center gap-1.5 lg:contents">
        <span className="lg:pt-0.5">
          <span
            className={`inline-block rounded-md px-2 py-0.5 text-[13px] font-medium ${
              payAttention
                ? "bg-[var(--color-tier-bronze)]/14 text-[var(--color-tier-bronze)]"
                : tool.pricingKind === "FREE"
                  ? "bg-[var(--color-up)]/12 text-[var(--color-up)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-dim)]"
            }`}
          >
            {PRICING_LABEL[tool.pricingKind]}
          </span>
        </span>
        <span className="lg:pt-0.5">
          <span
            className={`inline-block rounded-md px-2 py-0.5 text-[13px] ${
              koreanBest
                ? "bg-[var(--color-tier-prism)]/10 font-medium text-[var(--color-tier-prism)]"
                : koreanWeak
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text-mute)]"
                  : "text-[var(--color-text-dim)] lg:px-0"
            }`}
          >
            {KOREAN_LEVEL_LABEL[tool.koreanLevel]}
          </span>
        </span>
        {/* 후기 수는 있을 때만. 행마다 "후기 없음"이 반복되면 비어 보인다. */}
        {tool.reviewCount > 0 && (
          <span className="ml-auto text-[12px] tabular-nums text-[var(--color-text-mute)] lg:hidden">
            후기 {tool.reviewCount}
          </span>
        )}
      </div>
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-[var(--color-surface-2)] px-1.5 py-px text-[12px] font-medium text-[var(--color-text-dim)]">
      {children}
    </span>
  );
}
/* Footer: components/tool/ToolList.tsx */
