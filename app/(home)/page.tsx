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
import TaskChooser from "@/components/tool/TaskChooser";
import ToolList from "@/components/tool/ToolList";
import { getPurposeTotals, getTools } from "@/lib/queries";
import { parseQuery, parseToolOrigin, parseToolPurpose } from "@/lib/params";
import { PURPOSE_HINT, PURPOSE_LABEL } from "@/lib/labels";
import { PURPOSES } from "@/lib/params";
import type { ToolListRow } from "@/lib/queries";
import JsonLd from "@/components/seo/JsonLd";
import Reveal from "@/components/site/Reveal";
import ScrollCue from "@/components/site/ScrollCue";
import { websiteJsonLd } from "@/lib/structured-data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, shareMeta } from "@/lib/site";

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
    ...shareMeta({
      url: "/",
      title: `${SITE_NAME} — ${SITE_TITLE}`,
      description: SITE_DESCRIPTION,
    }),
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
  // 토글이 갈래를 유지하므로, 숫자도 지금 보고 있는 갈래 안에서 센다.
  const krCount = (purpose ? tools : all).filter(
    (t) => t.origin === "KR",
  ).length;

  /**
   * 기본 화면은 격자가 아니라 **용도별 섹션**이다.
   *
   * 수십 장을 똑같은 박스로 쭉 깔면 어디서 끊어 읽어야 할지가 없다. 제목을 달아
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

  // 첫 화면(아무것도 고르지 않은 상태)과 고른 뒤의 화면은 할 일이 다르다.
  // 첫 화면은 "무엇을 하려는지" 고르게 하고, 고른 뒤에는 비교 목록이 주인공이다.
  const landing = !filtered;
  const heading = q
    ? null
    : purpose
      ? PURPOSE_LABEL[purpose]
      : origin === "KR"
        ? "한국에서 만든 도구"
        : null;

  return (
    <>
      <JsonLd data={websiteJsonLd()} />

      {landing ? (
        // 내용은 위에 붙인다. 세로 가운데 정렬은 키 큰 화면에서 위쪽이 텅 비어
        // "패딩을 너무 줬다"는 인상이었다. 남는 높이는 아래로 보내 목록만 밀어낸다.
        // 첫 화면은 질문과 고르기 칸만으로 화면 높이를 채운다. 목록은 그 아래에서
        // 스크롤하면 떠오른다(components/site/Reveal.tsx). 헤더 높이를 빼야 첫 화면
        // 바닥에 목록 머리가 걸치지 않는다 — 모바일은 검색창이 한 줄 더 있어서 더 크다.
        <section className="min-h-[calc(100svh-7.5rem)] pb-16 pt-6 sm:min-h-[calc(100svh-4.25rem)] sm:pt-10">
          {/* 위로 밀려 나갈 때 살짝 물러난다(.scroll-recede, app/globals.css). */}
          <div className="scroll-recede">
            {/* 사이트가 던지는 질문 그대로를 제목으로 쓴다. 아래 칸들이 그 대답이다.
                예전 제목("어떤 AI를 써야 할지 모르겠을 때")은 상황 설명이라 다음에
                뭘 하라는 건지가 없었다 — 그 말은 설명 줄로 내려 보냈다. */}
            <h1 className="text-[26px] font-bold leading-[1.25] tracking-[-0.02em] text-[var(--color-text)] sm:text-[36px]">
              무엇을 하려고 하세요?
            </h1>
            <p className="mt-2 max-w-[36rem] text-[15px] leading-relaxed text-[var(--color-text-dim)] sm:mt-3 sm:text-[16px]">
              어떤 AI를 써야 할지 모르겠을 때, 하려는 일부터 고르면 돼요. 돈이
              드는지, 한국어가 되는지 같이 보여드려요.
            </p>
            <TaskChooser tools={all} totals={totals} />
          </div>
          {/* 아래에 목록이 더 있다는 걸 알려 주는 떠 있는 버튼. 목록이 보이면 사라진다. */}
          <ScrollCue count={all.length} />
        </section>
      ) : (
        <section className="scroll-mt-20 pt-8">
          {q ? (
            <p className="text-[16px] text-[var(--color-text-dim)]">
              {/* 개수는 아래 목록과 같은 값이어야 한다. 탭까지 걸린 상태에서 전체 개수를
                  적으면, 적힌 숫자와 보이는 행 수가 달라진다. */}
              <strong className="font-semibold text-[var(--color-text)]">
                ‘{q}’
              </strong>{" "}
              검색 결과 <span className="tabular-nums">{tools.length}</span>개
            </p>
          ) : (
            <>
              <Link
                href="/"
                className="text-[13px] text-[var(--color-text-mute)] hover:underline"
              >
                ← 하려는 일 다시 고르기
              </Link>
              <h1 className="mt-2 text-[28px] font-bold leading-[1.25] tracking-[-0.02em] text-[var(--color-text)] sm:text-[32px]">
                {heading}
              </h1>
              {purpose && (
                <p className="mt-1.5 text-[15px] text-[var(--color-text-dim)]">
                  {PURPOSE_HINT[purpose]}
                </p>
              )}
            </>
          )}
          {/* 고른 뒤에도 옆 갈래로 바로 옮겨 갈 수 있게 작은 탭을 남긴다. */}
          <Suspense>
            <PurposeTabs totals={totals} allCount={all.length} />
          </Suspense>
        </section>
      )}

      {/* 한국 필터는 탭과 다른 줄, 다른 모양으로 둔다. 같은 알약이면 '용도 하나'로 읽혔다.
          첫 화면에서는 고르는 칸 중 하나(TaskChooser 마지막 칸)가 같은 일을 하므로 빼고,
          그 자리에 목록 제목만 둔다. */}
      <div
        id={landing ? "all-tools" : undefined}
        // 첫 화면에서는 목록 제목도 섹션들과 같이 커지며 들어온다(app/globals.css).
        className={`mt-6 flex scroll-mt-20 flex-wrap items-center gap-x-3 gap-y-2 ${landing ? "scroll-grow" : ""}`}
      >
        {landing ? (
          <h2 className="text-[20px] font-bold tracking-tight text-[var(--color-text)]">
            전체 도구
          </h2>
        ) : (
          <Link
            href={
              origin === "KR"
                ? purpose
                  ? `/?for=${purpose}`
                  : "/"
                : `/?origin=KR${purpose ? `&for=${purpose}` : ""}`
            }
            aria-pressed={origin === "KR"}
            className={`ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] transition ${
              origin === "KR"
                ? "bg-[var(--color-tier-prism)]/12 text-[var(--color-tier-prism)]"
                : "text-[var(--color-text-mute)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-dim)]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                origin === "KR"
                  ? "bg-[var(--color-tier-prism)]"
                  : "bg-[var(--color-text-mute)]/50"
              }`}
            />
            한국에서 만든 것만
            <span className="tabular-nums opacity-70">{krCount}</span>
          </Link>
        )}
      </div>

      {tools.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-16 text-center">
          <p className="text-[15px] text-[var(--color-text-dim)]">
            {filtered
              ? "찾으시는 조건에 맞는 도구가 없어요."
              : "아직 등록된 도구가 없어요."}
          </p>
          {filtered && (
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-[13px] text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
            >
              처음으로
            </Link>
          )}
        </div>
      ) : sections.length > 0 ? (
        <div>
          {/* 섹션마다 따로 떠오르게 한다. 목록 전체를 한 덩어리로 띄우면 50행이 한 번에
              나타나서 효과가 없다. */}
          {sections.map((sec) => (
            <Reveal key={sec.purpose}>
              <Section purpose={sec.purpose} items={sec.items} />
            </Reveal>
          ))}
        </div>
      ) : (
        // 갈래를 고른 화면은 섹션으로 나누지 않는다. 이미 한 갈래라 제목이 겹친다.
        <div className="mt-3">
          <ToolList tools={tools} />
        </div>
      )}

      {/* 개발자용 입구. 목록 끝의 마무리라 조용해야 한다. */}
      <div className="mt-14 border-t border-[var(--color-line-soft)] pt-6">
        <Link
          href="/models"
          className="text-[13px] text-[var(--color-text-mute)] underline-offset-4 transition hover:text-[var(--color-text-dim)] hover:underline"
        >
          모델 단위로 보기 — 벤치마크·커뮤니티 순위 →
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
}: {
  purpose: (typeof PURPOSES)[number];
  items: ToolListRow[];
}) {
  return (
    <section id={`sec-${purpose}`} className="scroll-mt-20 pt-8">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h3 className="text-[17px] font-bold tracking-tight text-[var(--color-text)]">
          {PURPOSE_LABEL[purpose]}
        </h3>
        <span className="text-[13px] text-[var(--color-text-mute)]">
          {PURPOSE_HINT[purpose]}
        </span>
      </div>
      <ToolList tools={items} />
    </section>
  );
}
/* Footer: app/(home)/page.tsx */
