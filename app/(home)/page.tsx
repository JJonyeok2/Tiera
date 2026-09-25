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
import { PURPOSES } from "@/lib/params";
import type { ToolListRow } from "@/lib/queries";
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

  /**
   * 기본 화면은 격자가 아니라 **용도별 섹션**이다.
   *
   * 37장을 똑같은 박스로 쭉 깔면 어디서 끊어 읽어야 할지가 없다. 제목을 달아
   * 끊으면 스크롤만 내려도 "이런 것도 있구나"가 되고, 그게 이 사이트가 하려는
   * 일 자체다 — 뭘 써야 할지 모르는 사람이 둘러보는 것.
   *
   * 섹션은 **대표 용도로만** 묶는다. alsoFor까지 넣으면 ChatGPT가 네 번 나온다.
   * 겸하는 용도는 탭을 눌렀을 때 드러나면 된다(그쪽 쿼리는 alsoFor를 본다).
   */
  const sections =
    filtered || purpose
      ? []
      : PURPOSES.map((p) => ({
          purpose: p,
          items: tools.filter((t) => t.purpose === p),
        })).filter((s) => s.items.length > 0);

  return (
    <>
      <JsonLd data={websiteJsonLd()} />

      {/* 히어로. 스크롤한 상태에서 탭을 눌러도 제목이 sticky 헤더에 먹히지 않도록
          scroll-mt를 준다 — 실제로 잘린 채로 보이는 걸 스크린샷에서 확인했다. */}
      <section className="scroll-mt-20 pb-1 pt-9">
        <h1 className="text-[26px] font-bold leading-[1.3] tracking-tight text-[var(--color-text)] sm:text-[30px]">
          어떤 AI를 써야 할지
          <br className="sm:hidden" />
          <span className="brand-gradient-text"> 모르겠을 때</span>
        </h1>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-[var(--color-text-dim)]">
          쓸 일부터 골라보세요. 돈이 드는지, 한국어가 되는지 미리 적어 뒀어요.
        </p>
      </section>

      <Suspense>
        <PurposeTabs totals={totals} allCount={all.length} />
      </Suspense>

      {/* 탭과 다른 줄, 다른 모양으로 둔다.
          같은 알약 모양이면 '용도 탭 하나'로 읽혀서, 한국 필터가 탭 목록에
          섞여 들어간 것처럼 보였다. 여기는 가로선 위의 도구 모음이다. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--color-line-soft)] pt-3">
        <p className="text-[11px] text-[var(--color-text-mute)]">
          {purpose ? PURPOSE_HINT[purpose] : "쓸 일을 고르거나 검색해 보세요"}
        </p>

        <Link
          href={origin === "KR" ? "/" : "/?origin=KR"}
          aria-pressed={origin === "KR"}
          className={`ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition ${
            origin === "KR"
              ? "bg-[var(--color-tier-prism)]/12 text-[var(--color-tier-prism)]"
              : "text-[var(--color-text-mute)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-dim)]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              origin === "KR" ? "bg-[var(--color-tier-prism)]" : "bg-[var(--color-text-mute)]/50"
            }`}
          />
          한국에서 만든 것만
          <span className="tabular-nums opacity-70">{krCount}</span>
        </Link>
      </div>

      {tools.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-16 text-center">
          <p className="text-sm text-[var(--color-text-dim)]">
            {filtered ? "찾으시는 조건에 맞는 도구가 없어요." : "아직 등록된 도구가 없어요."}
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
      ) : sections.length > 0 ? (
        <div className="mt-2">
          {sections.map((sec, si) => (
            <Section key={sec.purpose} purpose={sec.purpose} items={sec.items} order={si} />
          ))}
        </div>
      ) : (
        // 탭·검색·필터가 걸린 화면은 섹션으로 나누지 않는다.
        // 이미 한 갈래로 좁힌 결과라 제목을 또 달면 같은 말을 두 번 하는 셈이다.
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {tools.map((t, i) => (
            <li key={t.slug} className="flex">
              <ToolCard tool={t} index={i} />
            </li>
          ))}
        </ul>
      )}

      {/* 개발자용 입구. 일반인은 안 눌러도 되지만, 궁금한 사람은 여기로 내려간다.
          목록 끝에 붙는 마무리이므로 카드보다 조용해야 한다. */}
      <div className="mt-12 border-t border-[var(--color-line-soft)] pt-6">
        <Link
          href="/models"
          className="group inline-flex items-center gap-1.5 text-xs text-[var(--color-text-mute)] transition hover:text-[var(--color-text-dim)]"
        >
          모델 단위로 보기 — 벤치마크·커뮤니티 순위
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </div>
    </>
  );
}

/**
 * 용도 한 묶음.
 *
 * 제목을 크게 두고 숫자를 옆에 붙인다. 섹션이 열 개라 제목이 크지 않으면
 * 스크롤할 때 그냥 지나가고, 결국 격자와 다를 게 없어진다.
 */
function Section({
  purpose,
  items,
  order,
}: {
  purpose: (typeof PURPOSES)[number];
  items: ToolListRow[];
  order: number;
}) {
  return (
    <section className="scroll-mt-20 pt-9 first:pt-5">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h2 className="text-[19px] font-bold tracking-tight text-[var(--color-text)]">
          {PURPOSE_LABEL[purpose]}
        </h2>
        <span className="text-xs tabular-nums text-[var(--color-text-mute)]">{items.length}</span>
        <p className="w-full text-xs text-[var(--color-text-mute)] sm:w-auto">
          {PURPOSE_HINT[purpose]}
        </p>
      </div>

      <ul className="mt-3.5 grid gap-3 sm:grid-cols-2">
        {items.map((t, i) => (
          <li key={t.slug} className="flex">
            {/* 지연은 섹션 안에서만 준다. 열 번째 섹션까지 누적하면
                아래쪽 카드가 한참 뒤에 나타나서 로딩이 끊긴 것처럼 보인다. */}
            <ToolCard tool={t} index={order === 0 ? i : 0} />
          </li>
        ))}
      </ul>
    </section>
  );
}
/* Footer: app/(home)/page.tsx */
