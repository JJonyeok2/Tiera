/* ---------------------------------------------------------------------------
 * Header: 티어표 — 티어마다 한 줄, 그 줄에 모델을 칩으로 늘어놓는다.
 *
 * 순위 목록은 "몇 등"을 읽는 화면이라 위아래로 길다. 티어표는 "어느 급"을 한눈에
 * 보는 화면이라 가로로 눕힌다. 흔히 보는 S·A·B 티어표 모양 그대로다.
 *
 * - 줄 순서는 PRISM → GOLD → SILVER → BRONZE. 비어 있는 티어도 줄은 남긴다 —
 *   "이번 카테고리엔 프리즘이 없다"도 정보다.
 * - 줄 안의 칩은 점수 높은 순. 들어오는 rows가 이미 점수 내림차순이다.
 * - 모델이 수백 개라 아래 티어가 끝없이 길어진다. 줄마다 앞의 VISIBLE개만 펼치고
 *   나머지는 <details>로 접는다(JS 없이 열린다).
 * - 티어 색은 별·라벨·왼쪽 띠에만 쓴다. 칩은 무채색이라 글자가 묻히지 않는다.
 * ------------------------------------------------------------------------- */
import Link from "next/link";
import TierStar from "@/components/tier/TierStar";
import {
  TIERS,
  TIER_DESC,
  TIER_LABEL,
  TIER_CUT,
  tierVar,
  type Tier,
} from "@/components/tier/tierTokens";
import type { RankingRow } from "@/lib/queries";

/**
 * 점수 구간을 문장으로. TIER_RANGE_LABEL("90 +", "65 미만")은 숫자 칸 옆에 붙이는
 * 짧은 표기라, 뒤에 "점"을 붙이면 "90 +점"처럼 어색해진다. 컷은 같은 값을 쓴다.
 */
const RANGE_TEXT: Record<Tier, string> = {
  prism: `${TIER_CUT.prism}점 이상`,
  gold: `${TIER_CUT.gold}~${TIER_CUT.prism}점`,
  silver: `${TIER_CUT.silver}~${TIER_CUT.gold}점`,
  bronze: `${TIER_CUT.silver}점 미만`,
};

/** 줄마다 처음부터 펼쳐 둘 칩 수. 넓은 화면에서 서너 줄이 된다. */
const VISIBLE = 18;

export default function TierBoard({ rows }: { rows: RankingRow[] }) {
  const byTier = new Map<Tier, RankingRow[]>(TIERS.map((t) => [t, []]));
  for (const r of rows) byTier.get(r.tier.toLowerCase() as Tier)?.push(r);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
      {TIERS.map((t, i) => (
        <TierRow key={t} tier={t} items={byTier.get(t)!} first={i === 0} />
      ))}
    </div>
  );
}

function TierRow({
  tier,
  items,
  first,
}: {
  tier: Tier;
  items: RankingRow[];
  first: boolean;
}) {
  const shown = items.slice(0, VISIBLE);
  const rest = items.slice(VISIBLE);

  return (
    <section
      aria-label={`${TIER_LABEL[tier]} 티어`}
      data-tier={tier}
      className={`relative grid gap-x-5 gap-y-3 px-4 py-5 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:px-5 ${
        first ? "" : "border-t border-[var(--color-line-soft)]"
      }`}
    >
      {/* 왼쪽 가장자리 색 띠. 줄이 어느 티어인지 스크롤하면서도 놓치지 않게 한다. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: tierVar(tier), opacity: 0.8 }}
      />

      <header className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
        <TierStar tier={tier} size={36} glow labelled />
        <div>
          <p
            className="text-[13px] font-bold tracking-[0.18em]"
            style={{ color: tierVar(tier) }}
          >
            {TIER_LABEL[tier]}
          </p>
          <p className="mt-0.5 text-[12px] tabular-nums text-[var(--color-text-mute)]">
            {RANGE_TEXT[tier]} · {items.length}개
          </p>
        </div>
        <p className="sr-only">{TIER_DESC[tier]}</p>
      </header>

      {items.length === 0 ? (
        <p className="self-center text-[13px] text-[var(--color-text-mute)]">
          이 조건에서는 이 티어에 든 모델이 없어요.
        </p>
      ) : (
        <div>
          <ul className="flex flex-wrap gap-2">
            {shown.map((m) => (
              <Chip key={m.slug} m={m} />
            ))}
          </ul>
          {rest.length > 0 && (
            <details className="group mt-2">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-[var(--color-text-mute)] hover:text-[var(--color-text-dim)] [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">
                  {rest.length}개 더 보기
                </span>
                <span className="hidden group-open:inline">접기</span>
                <span
                  aria-hidden="true"
                  className="transition group-open:rotate-180"
                >
                  ▾
                </span>
              </summary>
              <ul className="mt-2 flex flex-wrap gap-2">
                {rest.map((m) => (
                  <Chip key={m.slug} m={m} />
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function Chip({ m }: { m: RankingRow }) {
  return (
    <li>
      <Link
        href={`/models/${m.slug}`}
        className="flex items-baseline gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 transition-colors hover:border-[var(--color-text-mute)]"
      >
        <span className="text-[14px] font-semibold text-[var(--color-text)]">
          {m.name}
        </span>
        <span className="text-[12px] text-[var(--color-text-mute)]">
          {m.developerName}
        </span>
        <span className="text-[12px] font-medium tabular-nums text-[var(--color-text-dim)]">
          {m.score.toFixed(1)}
        </span>
      </Link>
    </li>
  );
}
/* Footer: components/tier/TierBoard.tsx */
