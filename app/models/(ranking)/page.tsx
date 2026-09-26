/* ---------------------------------------------------------------------------
 * Header: /models — 모델 랭킹. SPEC 23.5의 "개발자 입구".
 *
 * 원래 홈(/)이던 화면을 그대로 옮겼다. 홈은 도구 목록이 됐다.
 * 여기는 벤치마크·커뮤니티 이중 순위, 괴리 배지 같은 전문 용어를 그대로 쓴다.
 * 찾아 내려온 사람만 보는 페이지라 쉽게 풀어쓸 이유가 없다.
 *
 * (ranking) 라우트 그룹 안에 있는 이유는 loading.tsx 때문이다. 옆 파일 주석 참고.
 * ------------------------------------------------------------------------- */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/ranking/FilterBar";
import RankingList from "@/components/ranking/RankingList";
import ScoreTypeSwitch from "@/components/ranking/ScoreTypeSwitch";
import { CompareProvider } from "@/components/ranking/CompareContext";
import CompareTray from "@/components/ranking/CompareTray";
import { getRanking, getScoreTypeTotals } from "@/lib/queries";
import { parseCountry, parseQuery, parseScope, parseScoreType } from "@/lib/params";
import { shareMeta } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;

  // 필터 조합마다 URL이 갈라지는데 내용은 같은 목록이다.
  // canonical을 고정하지 않으면 크롤러가 중복 문서로 보고 평가를 나눠 가진다.
  // 검색 결과(?q=)는 무한히 생성되는 얕은 페이지라 아예 색인에서 뺀다.
  const q = parseQuery(sp.q);
  return {
    title: "모델 순위",
    description: "벤치마크 성적과 커뮤니티 평가를 나란히 놓고 보는 AI 모델 순위.",
    alternates: { canonical: "/models" },
    ...shareMeta({
      url: "/models",
      title: "AI 모델 순위 — Tiera",
      description: "벤치마크 점수와 커뮤니티 체감 평가를 나란히 놓고 본 AI 모델 순위예요.",
    }),
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const scope = parseScope(sp.scope);

  const scoreType = parseScoreType(sp.type);
  const country = parseCountry(sp.country);
  const q = parseQuery(sp.q);
  // 검색·필터가 걸려 있으면 결과 0건은 "평가가 없다"가 아니라 "이 조건에 없다"이다.
  const filtered = Boolean(q || country);

  // 목록과 전환 스위치의 숫자는 서로 의존하지 않는다. 순차로 돌리면 왕복이 두 번이다.
  const [{ rows, total }, totals] = await Promise.all([
    getRanking({ scoreType, scope, country, q, limit: 20, offset: 0 }),
    getScoreTypeTotals({ scope, country, q }),
  ]);

  return (
    <CompareProvider>
      <div className="pt-7">
        <Link href="/" className="text-xs text-[var(--color-text-mute)] hover:underline">
          ← 도구로 돌아가기
        </Link>
        <h1 className="mt-2 text-lg font-bold tracking-tight text-[var(--color-text)]">모델 순위</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-dim)]">
          API 모델 단위 순위다. 제품을 찾는 거라면 <Link href="/" className="underline">도구 목록</Link>이 맞다.
        </p>
      </div>

      <Suspense>
        <ScoreTypeSwitch totals={totals} />
      </Suspense>

      <Suspense>
        <FilterBar />
      </Suspense>

      <Suspense>
        {scoreType === "COMMUNITY" && total === 0 && !filtered ? (
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-16 text-center">
            <p className="text-sm text-[var(--color-text-dim)]">아직 커뮤니티 평가가 없어요.</p>
            <p className="mt-2 text-xs text-[var(--color-text-mute)]">
              첫 평가를 남겨주세요. 모델 하나에 한 사람이 한 번 평가할 수 있어요.
            </p>
            <Link
              href="/models?type=BENCHMARK"
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
/* Footer: app/models/(ranking)/page.tsx */
