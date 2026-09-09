/* Header: 홈 — 랭킹.
   서버 컴포넌트로 첫 페이지를 렌더하고, 이후 페이지만 클라이언트가 API로 가져온다. */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import FilterBar from "@/components/ranking/FilterBar";
import RankingList from "@/components/ranking/RankingList";
import { CompareProvider } from "@/components/ranking/CompareContext";
import CompareTray from "@/components/ranking/CompareTray";
import { getRanking, hasCommunityScores } from "@/lib/queries";
import { CATEGORY_LABEL, SCORE_TYPE_LABEL } from "@/lib/labels";
import { parseCountry, parseQuery, parseScope, parseScoreType } from "@/lib/params";
import JsonLd from "@/components/seo/JsonLd";
import { websiteJsonLd } from "@/lib/structured-data";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;

  // 필터 조합마다 URL이 갈라지는데 내용은 같은 목록이다.
  // canonical을 루트로 고정하지 않으면 크롤러가 중복 문서로 보고 평가를 나눠 가진다.
  // 검색 결과(?q=)는 무한히 생성되는 얕은 페이지라 아예 색인에서 뺀다.
  const q = parseQuery(sp.q);
  return {
    alternates: { canonical: "/" },
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const scope = parseScope(sp.scope);

  // 평가가 하나도 없으면 커뮤니티 탭이 빈 화면이 된다.
  // 그 상태에서 첫 화면이 텅 비어 있는 것보다, 실데이터가 있는 벤치마크를 먼저 보여주는 게 낫다.
  // 사용자가 명시적으로 type을 고른 경우에는 존중한다.
  if (sp.type === undefined && !(await hasCommunityScores())) {
    // 검색어·국가 필터를 유지한 채로 벤치마크 탭으로 넘긴다.
    // (초기에 scope만 넘겼다가 q와 country가 조용히 사라지는 버그가 있었다)
    const next = new URLSearchParams({ type: "BENCHMARK" });
    if (scope !== "OVERALL") next.set("scope", scope);
    const c = parseCountry(sp.country);
    if (c) next.set("country", c);
    const query = parseQuery(sp.q);
    if (query) next.set("q", query);
    redirect(`/?${next.toString()}`);
  }

  const scoreType = parseScoreType(sp.type);
  const country = parseCountry(sp.country);
  const q = parseQuery(sp.q);
  // 검색·필터가 걸려 있으면 결과 0건은 "평가가 없다"가 아니라 "이 조건에 없다"이다.
  const filtered = Boolean(q || country);

  const { rows, total } = await getRanking({
    scoreType,
    scope,
    country,
    q,
    limit: 20,
    offset: 0,
  });

  return (
    <CompareProvider>
      <JsonLd data={websiteJsonLd()} />
      <Suspense>
        <FilterBar />
      </Suspense>

      <p className="pb-2 text-[11px] text-[var(--color-text-mute)]">
        {SCORE_TYPE_LABEL[scoreType]} · {CATEGORY_LABEL[scope]} 기준 ·{" "}
        {total.toLocaleString("ko-KR")}개 모델
      </p>

      <Suspense>
        {scoreType === "COMMUNITY" && total === 0 && !filtered ? (
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-16 text-center">
            <p className="text-sm text-[var(--color-text-dim)]">아직 커뮤니티 평가가 없습니다.</p>
            <p className="mt-2 text-xs text-[var(--color-text-mute)]">
              첫 평가를 남겨주세요. 모델 하나에 한 사람이 한 번 평가할 수 있습니다.
            </p>
            <Link
              href="/?type=BENCHMARK"
              className="mt-4 inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
            >
              벤치마크 순위 보기
            </Link>
          </div>
        ) : (
          <RankingList initialRows={rows} total={total} />
        )}
      </Suspense>

      <CompareTray />
    </CompareProvider>
  );
}
/* Footer: app/page.tsx */
