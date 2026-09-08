/* Header: 모델 비교 (최대 3개).
   선택 상태를 URL에 두어 링크만으로 같은 비교를 재현할 수 있게 한다. */
import Link from "next/link";
import type { Metadata } from "next";
import TierStar from "@/components/tier/TierStar";
import CategoryBars from "@/components/model/CategoryBars";
import { GapBadge, StatusBadge } from "@/components/ranking/Badges";
import { getCompare, MAX_COMPARE_MODELS, type ModelDetail } from "@/lib/queries";
import { COUNTRY_LABEL } from "@/lib/labels";
import { formatContext, MODALITY_LABEL } from "@/lib/format";
import { TIER_LABEL } from "@/components/tier/tierTokens";

export const metadata: Metadata = { title: "모델 비교 — Tiera" };
export const revalidate = 300;

const toKey = (t: string) => t.toLowerCase() as "prism" | "gold" | "silver" | "bronze";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).models;
  const slugs = typeof raw === "string" ? raw.split(",") : [];
  const models = await getCompare(slugs);

  if (models.length < 2) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[var(--color-text-dim)]">
          비교하려면 모델을 2개 이상 선택해야 합니다. (최대 {MAX_COMPARE_MODELS}개)
        </p>
        <Link href="/" className="mt-3 inline-block text-xs text-[var(--color-tier-prism)] hover:underline">
          랭킹에서 고르기
        </Link>
      </div>
    );
  }

  /** 여러 모델 중 최적값을 굵게 표시하기 위한 헬퍼. 가격은 낮은 쪽이 우위다. */
  const best = (values: (number | null)[], lowerIsBetter = false): number | null => {
    const nums = values.filter((v): v is number => v !== null);
    if (nums.length === 0) return null;
    return lowerIsBetter ? Math.min(...nums) : Math.max(...nums);
  };

  const communityBest = best(models.map((m) => m.community.OVERALL?.score ?? null));
  const benchBest = best(models.map((m) => m.benchmark.OVERALL?.score ?? null));
  const ctxBest = best(models.map((m) => m.contextWindow));
  const inBest = best(models.map((m) => (m.inputPricePerM ? Number(m.inputPricePerM) : null)), true);
  const outBest = best(models.map((m) => (m.outputPricePerM ? Number(m.outputPricePerM) : null)), true);

  return (
    <div className="space-y-8 py-7">
      <header>
        <Link href="/" className="text-xs text-[var(--color-text-mute)] hover:underline">
          ← 랭킹으로
        </Link>
        <h1 className="mt-2 text-2xl font-bold">모델 비교</h1>
      </header>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${models.length}, minmax(0,1fr))` }}>
        {models.map((m) => (
          <div key={m.slug} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-center">
            <Link href={`/models/${m.slug}`} className="text-sm font-semibold hover:underline">
              {m.name}
            </Link>
            <p className="mt-0.5 text-[11px] text-[var(--color-text-mute)]">
              {m.developerName} · {COUNTRY_LABEL[m.country]}
            </p>
            {m.community.OVERALL && (
              <>
                <div className="mt-3 flex justify-center">
                  <TierStar tier={toKey(m.community.OVERALL.tier)} size={48} glow />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums">
                  {m.community.OVERALL.score.toFixed(1)}
                </p>
                <p className="text-[10px] tracking-[0.18em] text-[var(--color-text-dim)]">
                  {TIER_LABEL[toKey(m.community.OVERALL.tier)]}
                </p>
              </>
            )}
            <p className="mt-2 text-[11px] text-[var(--color-text-mute)]">
              벤치마크 {m.benchmark.OVERALL ? m.benchmark.OVERALL.score.toFixed(1) : "–"}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              <StatusBadge status={m.status} />
              <GapBadge gap={m.gap} />
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-dim)]">스펙 비교</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-[11px] text-[var(--color-text-mute)]">
                <th className="py-2 font-medium">항목</th>
                {models.map((m) => (
                  <th key={m.slug} className="py-2 text-right font-medium">{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="커뮤니티 점수" models={models} pick={(m) => m.community.OVERALL?.score ?? null} best={communityBest} fmt={(v) => v.toFixed(1)} />
              <Row label="벤치마크 점수" models={models} pick={(m) => m.benchmark.OVERALL?.score ?? null} best={benchBest} fmt={(v) => v.toFixed(1)} />
              <Row label="컨텍스트" models={models} pick={(m) => m.contextWindow} best={ctxBest} fmt={(v) => formatContext(v)} />
              <Row label="입력 가격 / 1M" models={models} pick={(m) => (m.inputPricePerM ? Number(m.inputPricePerM) : null)} best={inBest} fmt={(v) => `$${v}`} />
              <Row label="출력 가격 / 1M" models={models} pick={(m) => (m.outputPricePerM ? Number(m.outputPricePerM) : null)} best={outBest} fmt={(v) => `$${v}`} />
              <tr className="border-b border-[var(--color-line-soft)]">
                <td className="py-2 text-[var(--color-text-dim)]">모달리티</td>
                {models.map((m) => (
                  <td key={m.slug} className="py-2 text-right text-xs">
                    {m.modalities.map((x) => MODALITY_LABEL[x] ?? x).join(", ")}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[var(--color-line-soft)]">
                <td className="py-2 text-[var(--color-text-dim)]">오픈 웨이트</td>
                {models.map((m) => (
                  <td key={m.slug} className="py-2 text-right text-xs">{m.isOpenWeight ? "예" : "아니오"}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-dim)]">카테고리별</h2>
        {models.map((m) => (
          <div key={m.slug} className="space-y-2">
            <p className="text-xs font-medium">{m.name}</p>
            <CategoryBars community={m.community} benchmark={m.benchmark} />
          </div>
        ))}
      </section>
    </div>
  );
}

function Row({
  label, models, pick, best, fmt,
}: {
  label: string;
  models: ModelDetail[];
  pick: (m: ModelDetail) => number | null;
  best: number | null;
  fmt: (v: number) => string;
}) {
  return (
    <tr className="border-b border-[var(--color-line-soft)]">
      <td className="py-2 text-[var(--color-text-dim)]">{label}</td>
      {models.map((m) => {
        const v = pick(m);
        const isBest = v !== null && best !== null && v === best;
        return (
          <td
            key={m.slug}
            className={`py-2 text-right tabular-nums ${isBest ? "font-semibold text-[var(--color-tier-prism)]" : ""}`}
          >
            {v === null ? "–" : fmt(v)}
          </td>
        );
      })}
    </tr>
  );
}
/* Footer: app/compare/page.tsx */
