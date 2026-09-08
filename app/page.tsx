/* Header: 홈 — 랭킹.
   서버 컴포넌트로 첫 페이지를 렌더하고, 이후 페이지만 클라이언트가 API로 가져온다. */
import { Suspense } from "react";
import FilterBar from "@/components/ranking/FilterBar";
import RankingList from "@/components/ranking/RankingList";
import { CompareProvider } from "@/components/ranking/CompareContext";
import CompareTray from "@/components/ranking/CompareTray";
import { getRanking } from "@/lib/queries";
import { CATEGORY_LABEL, SCORE_TYPE_LABEL } from "@/lib/labels";
import { parseCountry, parseQuery, parseScope, parseScoreType } from "@/lib/params";

export const revalidate = 300;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const scoreType = parseScoreType(sp.type);
  const scope = parseScope(sp.scope);

  const { rows, total } = await getRanking({
    scoreType,
    scope,
    country: parseCountry(sp.country),
    q: parseQuery(sp.q),
    limit: 20,
    offset: 0,
  });

  return (
    <CompareProvider>
      <Suspense>
        <FilterBar />
      </Suspense>

      <p className="pb-2 text-[11px] text-[var(--color-text-mute)]">
        {SCORE_TYPE_LABEL[scoreType]} · {CATEGORY_LABEL[scope]} 기준 ·{" "}
        {total.toLocaleString("ko-KR")}개 모델
      </p>

      <Suspense>
        <RankingList initialRows={rows} total={total} />
      </Suspense>

      <CompareTray />
    </CompareProvider>
  );
}
/* Footer: app/page.tsx */
