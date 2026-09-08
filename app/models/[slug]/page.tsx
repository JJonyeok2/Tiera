/* Header: 모델 상세.
   순서: 히어로 → 듀얼 스코어 + 괴리 → 카테고리 breakdown → 스펙 → 벤치마크 원본 → 리뷰. */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import DualScore from "@/components/model/DualScore";
import CategoryBars from "@/components/model/CategoryBars";
import { StatusBadge } from "@/components/ranking/Badges";
import { getModelDetail } from "@/lib/queries";
import { COUNTRY_LABEL, CATEGORY_LABEL } from "@/lib/labels";
import { formatContext, formatPrice, MODALITY_LABEL } from "@/lib/format";
import ReviewSection from "@/components/review/ReviewSection";
import { auth } from "@/auth";
import { getMyReview, listReviews } from "@/lib/reviews";

// 세션(로그인 여부)에 따라 리뷰 영역이 달라지므로 정적 캐시를 쓰지 않는다.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const m = await getModelDetail((await params).slug);
  if (!m) return { title: "찾을 수 없는 모델 — Tiera" };
  return {
    title: `${m.name} — Tiera`,
    description: m.description ?? `${m.name}의 커뮤니티 평가와 벤치마크 점수.`,
  };
}

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = await getModelDetail(slug);
  if (!model) notFound();

  const session = await auth();
  const viewerId = session?.user?.id;
  const [{ items, total }, myReview] = await Promise.all([
    listReviews(slug, { sort: "recent", limit: 10, viewerId }),
    viewerId ? getMyReview(viewerId, slug) : Promise.resolve(null),
  ]);

  return (
    <article className="space-y-8 py-7">
      <header className="space-y-2">
        <Link href="/" className="text-xs text-[var(--color-text-mute)] hover:underline">
          ← 랭킹으로
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{model.name}</h1>
          <StatusBadge status={model.status} />
          {model.isOpenWeight && (
            <span className="rounded bg-[var(--color-surface-2)] px-1.5 py-[2px] text-[10px] text-[var(--color-text-dim)]">
              오픈 웨이트
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-dim)]">
          {model.developerSiteUrl ? (
            <a
              href={model.developerSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {model.developerName}
            </a>
          ) : (
            model.developerName
          )}{" "}
          · {COUNTRY_LABEL[model.country]}
          {model.releasedAt && ` · ${model.releasedAt} 출시`}
        </p>
        {model.description && (
          <p className="text-sm text-[var(--color-text-dim)]">{model.description}</p>
        )}
      </header>

      <DualScore
        community={model.community.OVERALL}
        benchmark={model.benchmark.OVERALL}
        communityRank={model.communityRank}
        benchmarkRank={model.benchmarkRank}
        gap={model.gap}
        provisional={model.status === "PROVISIONAL"}
      />

      <Section title="카테고리별 점수">
        <CategoryBars community={model.community} benchmark={model.benchmark} />
      </Section>

      <Section title="스펙">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <Spec label="컨텍스트" value={formatContext(model.contextWindow)} />
          <Spec label="입력 가격" value={`${formatPrice(model.inputPricePerM)} / 1M`} />
          <Spec label="출력 가격" value={`${formatPrice(model.outputPricePerM)} / 1M`} />
          <Spec
            label="모달리티"
            value={model.modalities.map((m) => MODALITY_LABEL[m] ?? m).join(", ")}
          />
        </dl>
      </Section>

      <Section title="벤치마크 원본">
        {model.benchmarks.length === 0 ? (
          <p className="text-xs text-[var(--color-text-mute)]">등록된 벤치마크 결과가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left text-[11px] text-[var(--color-text-mute)]">
                  <th className="py-2 font-medium">벤치마크</th>
                  <th className="py-2 font-medium">카테고리</th>
                  <th className="py-2 text-right font-medium">원점수</th>
                  <th className="py-2 text-right font-medium">정규화</th>
                  <th className="py-2 text-right font-medium">측정일</th>
                  <th className="py-2 text-right font-medium">출처</th>
                </tr>
              </thead>
              <tbody>
                {model.benchmarks.map((b) => (
                  <tr key={b.name} className="border-b border-[var(--color-line-soft)]">
                    <td className="py-2">{b.name}</td>
                    <td className="py-2 text-[var(--color-text-dim)]">
                      {b.categoryLabelKey ? CATEGORY_LABEL[b.categoryLabelKey] : "종합"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {b.value}
                      <span className="ml-0.5 text-[var(--color-text-mute)]">{b.unit}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-[var(--color-text-dim)]">
                      {b.normalized === null ? "–" : b.normalized.toFixed(1)}
                    </td>
                    <td className="py-2 text-right text-[var(--color-text-mute)] tabular-nums">
                      {b.measuredAt}
                    </td>
                    <td className="py-2 text-right">
                      <a
                        href={b.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-text-mute)] underline hover:text-[var(--color-text-dim)]"
                      >
                        {b.sourceName}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <ReviewSection
        slug={model.slug}
        initialItems={items}
        total={total}
        signedIn={Boolean(viewerId)}
        myReview={myReview}
      />
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-[var(--color-text-dim)]">{title}</h2>
      {children}
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[var(--color-text-mute)]">{label}</dt>
      <dd className="mt-0.5 tabular-nums">{value}</dd>
    </div>
  );
}
/* Footer: app/models/[slug]/page.tsx */
