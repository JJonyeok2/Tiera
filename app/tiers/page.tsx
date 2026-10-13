/* ---------------------------------------------------------------------------
 * Header: /tiers — AI 모델 티어표. SPEC 23.20.
 *
 * /models와 같은 점수를 "몇 등"이 아니라 "어느 급"으로 보여준다.
 * 카테고리 탭(종합·코딩·글쓰기·추론·멀티모달)을 그대로 쓰므로, "코딩 티어표"는
 * 이 페이지의 코딩 탭이다 — 페이지를 따로 만들지 않는다.
 *
 * 데이터는 Artificial Analysis 동기화(매일)에서 나온 model_score 그대로다.
 * 새 모델이 동기화되면 다음 요청부터 자기 티어 줄에 나타난다.
 * ------------------------------------------------------------------------- */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/ranking/FilterBar";
import ScoreTypeSwitch from "@/components/ranking/ScoreTypeSwitch";
import ViewSwitch from "@/components/ranking/ViewSwitch";
import TierBoard from "@/components/tier/TierBoard";
import { getRanking, getScoreTypeTotals } from "@/lib/queries";
import { parseCountry, parseScope, parseScoreType } from "@/lib/params";
import { CATEGORY_LABEL, SCORE_TYPE_LABEL } from "@/lib/labels";
import { shareMeta } from "@/lib/site";

export const revalidate = 300;

/** 한 번에 그릴 최대 모델 수. 동기화 대상 모델이 수백 개라 넉넉히 잡는다. */
const MAX_MODELS = 1000;

export async function generateMetadata(): Promise<Metadata> {
  // 탭·필터마다 URL이 갈라져도 같은 표의 다른 단면이다. canonical은 하나로 묶는다.
  return {
    title: "AI 모델 티어표",
    description:
      "벤치마크와 커뮤니티 평가로 나눈 AI 모델 티어표. 종합·코딩·글쓰기·추론·멀티모달별로 볼 수 있어요.",
    alternates: { canonical: "/tiers" },
    ...shareMeta({
      url: "/tiers",
      title: "AI 모델 티어표 — Tiera",
      description:
        "프리즘·골드·실버·브론즈 — 지금 AI 모델이 어느 급인지 한눈에 보는 티어표예요.",
    }),
  };
}

export default async function TiersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const scope = parseScope(sp.scope);
  const scoreType = parseScoreType(sp.type);
  const country = parseCountry(sp.country);

  const [{ rows, total }, totals] = await Promise.all([
    getRanking({ scoreType, scope, country, limit: MAX_MODELS, offset: 0 }),
    getScoreTypeTotals({ scope, country }),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-7">
        <div>
          <Link
            href="/"
            className="text-[13px] text-[var(--color-text-mute)] hover:underline"
          >
            ← 도구로 돌아가기
          </Link>
          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-[var(--color-text)]">
            AI 모델 티어표
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-text-dim)]">
            {/* 지금 어떤 단면을 보고 있는지 문장으로 한 번 더 적는다. 탭만으로는
                "코딩 · 커뮤니티"처럼 두 축이 겹친 상태가 잘 안 읽힌다. */}
            <strong className="font-semibold text-[var(--color-text)]">
              {CATEGORY_LABEL[scope]}
            </strong>{" "}
            · {SCORE_TYPE_LABEL[scoreType]} 기준 · 모델 {total}개
          </p>
        </div>
        <ViewSwitch current="tiers" searchParams={sp} />
      </div>

      <div className="mt-5">
        <Suspense>
          <ScoreTypeSwitch totals={totals} />
        </Suspense>
      </div>

      <Suspense>
        <FilterBar />
      </Suspense>

      {total === 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-16 text-center">
          <p className="text-[15px] text-[var(--color-text-dim)]">
            {scoreType === "COMMUNITY"
              ? "아직 커뮤니티 평가가 쌓이지 않았어요."
              : "이 조건에 점수가 있는 모델이 없어요."}
          </p>
          <Link
            href="/tiers"
            className="mt-4 inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-[13px] text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
          >
            종합 벤치마크 티어표 보기
          </Link>
        </div>
      ) : (
        <TierBoard rows={rows} />
      )}

      <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-text-mute)]">
        티어는 0~100점으로 맞춘 점수에서 정해요. 벤치마크는 Artificial
        Analysis의 공개 측정치를 매일 받아 와서 계산하고, 커뮤니티는 써 본
        사람들의 평가예요. 계산 방식은{" "}
        <Link href="/about" className="underline underline-offset-2">
          여기
        </Link>
        에 적어 뒀어요.
      </p>
    </>
  );
}
/* Footer: app/tiers/page.tsx */
