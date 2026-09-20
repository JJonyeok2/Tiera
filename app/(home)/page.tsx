/* ---------------------------------------------------------------------------
 * Header: 홈 — 도구 목록. SPEC 23.5의 "일반인 입구".
 *
 * 여기 있던 모델 랭킹은 /models로 옮겼다. 순위표가 첫 화면이면 이 사이트는
 * 개발자용으로 읽힌다 — 일반인은 gpt-5.6-sol을 고르러 오지 않는다.
 *
 * 화면 언어 규칙(23.5): 이 페이지에는 벤치마크·베이지안·괴리 배지가 나오지 않는다.
 * 티어와 별은 유지한다. 오히려 비전문가에게 더 직관적이다.
 * ------------------------------------------------------------------------- */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import PurposeTabs from "@/components/tool/PurposeTabs";
import ToolCard from "@/components/tool/ToolCard";
import { getPurposeTotals, getTools } from "@/lib/queries";
import { parseQuery, parseToolOrigin, parseToolPurpose } from "@/lib/params";
import { PURPOSE_HINT, PURPOSE_LABEL } from "@/lib/labels";
import JsonLd from "@/components/seo/JsonLd";
import { websiteJsonLd } from "@/lib/structured-data";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = parseQuery(sp.q);
  const purpose = parseToolPurpose(sp.for);

  return {
    // 용도 탭마다 URL이 갈라지지만 내용은 같은 목록의 부분집합이다.
    // canonical을 루트로 고정하지 않으면 크롤러가 중복 문서로 보고 평가를 나눈다.
    alternates: { canonical: "/" },
    ...(purpose ? { title: `${PURPOSE_LABEL[purpose]} AI 도구` } : {}),
    // 검색 결과는 무한히 생성되는 얕은 페이지라 색인에서 뺀다.
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const purpose = parseToolPurpose(sp.for);
  const origin = parseToolOrigin(sp.origin);
  const q = parseQuery(sp.q);

  const [tools, totals, all] = await Promise.all([
    getTools({ purpose, origin, q }),
    getPurposeTotals({ origin, q }),
    // 탭의 "전체" 숫자. 용도만 빼고 같은 조건으로 세야 탭 합계와 어긋나지 않는다.
    getTools({ origin, q }),
  ]);

  const filtered = Boolean(q || origin || purpose);
  const krCount = all.filter((t) => t.origin === "KR").length;

  return (
    <>
      <JsonLd data={websiteJsonLd()} />

      <section className="pt-7">
        <h1 className="text-lg font-bold tracking-tight text-[var(--color-text)]">
          어떤 AI를 써야 할지 모르겠을 때
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-dim)]">
          쓸 일부터 고르면 된다. 돈이 드는지, 한국어가 되는지 먼저 적어 뒀다.
        </p>
      </section>

      <Suspense>
        <PurposeTabs totals={totals} allCount={all.length} />
      </Suspense>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={origin === "KR" ? "/" : "/?origin=KR"}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            origin === "KR"
              ? "border-[var(--color-tier-prism)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
              : "border-[var(--color-line)] text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
          }`}
        >
          국산만 <span className="tabular-nums text-[10px] text-[var(--color-text-mute)]">{krCount}</span>
        </Link>
        <p className="text-[11px] text-[var(--color-text-mute)]">
          {purpose ? PURPOSE_HINT[purpose] : `도구 ${all.length}개`}
        </p>
      </div>

      {tools.length === 0 ? (
        <div className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-16 text-center">
          <p className="text-sm text-[var(--color-text-dim)]">
            {filtered ? "조건에 맞는 도구가 없습니다." : "아직 등록된 도구가 없습니다."}
          </p>
          {filtered && (
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
            >
              전체 보기
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {tools.map((t) => (
            <li key={t.slug} className="flex">
              <ToolCard tool={t} />
            </li>
          ))}
        </ul>
      )}

      {/* 개발자용 입구. 일반인은 안 눌러도 되지만, 궁금한 사람은 여기로 내려간다. */}
      <div className="mt-10 border-t border-[var(--color-line-soft)] pt-5">
        <Link
          href="/models"
          className="text-xs text-[var(--color-text-mute)] transition hover:text-[var(--color-text-dim)]"
        >
          모델 단위로 보기 — 벤치마크·커뮤니티 순위 →
        </Link>
      </div>
    </>
  );
}
/* Footer: app/(home)/page.tsx */
