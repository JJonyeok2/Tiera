/* ---------------------------------------------------------------------------
 * Header: /tools/[slug] — 도구 상세. SPEC 23.5.
 *
 * 첫 화면은 고르는 데 필요한 것만: 뭘 해주나요(한 줄 소개) → 용도 칩 → 가격·한국어·
 * 쓸 곳 요약 판 → 주의사항 → 써보러 가기. 그 아래가 질문 순서대로의 자세한 설명이다:
 *   어떻게 시작하나요 → 돈이 드나요 → 한국어가 되나요 → 어디서 쓰나요 → 이게 쓰는 모델
 *
 * "이 도구가 쓰는 모델" 섹션이 일반인 층과 개발자 층을 잇는 유일한 지점이다.
 * 일반인은 안 눌러도 되고, 궁금한 사람은 거기서 벤치마크까지 내려간다.
 *
 * 후기가 붙으면 축별 점수가 같이 뜬다. 후기가 0개면 점수 영역을 **아예 그리지 않는다** —
 * 회색 "–"로 채운 칸은 사이트가 고장난 것처럼 보인다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import TierStar from "@/components/tier/TierStar";
import ToolLogo from "@/components/tool/ToolLogo";
import ToolReviewSection from "@/components/tool/ToolReviewSection";
import JsonLd from "@/components/seo/JsonLd";
import { toolJsonLd } from "@/lib/structured-data";
import { getAllToolSlugs, getToolDetail } from "@/lib/queries";
import { getMyToolReview, listToolReviews } from "@/lib/tool-reviews";
import { TOOL_AXES, TOOL_MIN_REVIEWS_FOR_TIER } from "@/lib/scoring/constants";
import {
  KOREAN_LEVEL_LABEL,
  PLATFORM_LABEL,
  PRICING_LABEL,
  PURPOSE_LABEL,
  TOOL_AXIS_LABEL,
  TOOL_AXIS_QUESTION,
} from "@/lib/labels";
import { shareMeta } from "@/lib/site";

// 후기는 로그인 사용자마다 "내 후기"가 다르므로 페이지 단위 캐시를 쓰지 않는다.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getAllToolSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolDetail(slug);
  if (!tool) return { title: "찾을 수 없는 도구" };

  // 사람들이 실제로 검색하는 말로 제목을 짓는다. "어떤 도구인가"는 아무도 안 친다.
  const title = `${tool.name} 사용법·가격·한국어 지원`;
  const url = `/tools/${tool.slug}`;
  const description = tool.summary;

  // 공유했을 때 사이트 소개가 아니라 이 도구의 이름과 한 줄 설명이 나가야 한다.
  return {
    title,
    description,
    keywords: [tool.name, ...tool.aliases],
    alternates: { canonical: url },
    ...shareMeta({
      url,
      title: `${tool.name} — Tiera`,
      description,
      type: "article",
    }),
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolDetail(slug);
  if (!tool) notFound();

  const session = await auth();
  const viewerId = session?.user?.id;

  // 후기 목록과 "내 후기"를 함께 가져온다. 순차로 돌리면 왕복이 두 번이다.
  // slug→id 조회는 이미 끝났으므로 id를 넘겨 한 번 더 묻지 않는다.
  const [reviews, myReview] = await Promise.all([
    listToolReviews(slug, { viewerId, toolId: tool.id }),
    viewerId ? getMyToolReview(viewerId, slug, tool.id) : Promise.resolve(null),
  ]);

  const payAttention =
    tool.pricingKind === "PAID" || tool.pricingKind === "TRIAL";
  const rated = TOOL_AXES.filter((a) => tool.axisScores[a] !== undefined);
  // 목록(components/tool/ToolList.tsx)과 같은 기준. 표본이 서기 전에는 단정하는 표시를 미룬다.
  const showTier =
    tool.tier !== null &&
    tool.score !== null &&
    tool.reviewCount >= TOOL_MIN_REVIEWS_FOR_TIER;

  return (
    <article className="max-w-[52rem] py-7">
      <JsonLd data={toolJsonLd(tool)} />
      <Link
        href="/"
        className="text-[13px] text-[var(--color-text-mute)] hover:underline"
      >
        ← 도구 목록
      </Link>

      <header className="mt-4 flex items-start gap-4">
        {/* 목록과 같은 로고 타일을 크게 쓴다(components/tool/ToolLogo.tsx). 로고가 없는
            도구도 이니셜 타일이 같은 자리를 채워서, 제목 시작 위치가 도구마다 흔들리지 않는다. */}
        <ToolLogo name={tool.name} logoUrl={tool.logoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-[var(--color-text)] sm:text-[30px]">
              {tool.name}
            </h1>
            {tool.origin === "KR" && <Badge>한국</Badge>}
            {tool.studentFree && <Badge>대학생 혜택</Badge>}
            {showTier && (
              <span className="flex items-center gap-1.5">
                <TierStar
                  tier={
                    tool.tier!.toLowerCase() as
                      "prism" | "gold" | "silver" | "bronze"
                  }
                  size={20}
                />
                <span className="text-sm font-semibold tabular-nums">
                  {tool.score!.toFixed(1)}
                </span>
              </span>
            )}
          </div>
          <p className="mt-1 text-[14px] text-[var(--color-text-mute)]">
            {tool.maker}
          </p>
        </div>
      </header>

      {/* "뭘 해주나요"는 섹션으로 두지 않고 제목 바로 아래 크게 쓴다. 이 도구가 내 일에
          맞는지가 가장 먼저 궁금한데, 예전엔 요약 판·버튼 아래까지 내려가야 나왔다. */}
      <h2 className="sr-only">뭘 해주나요</h2>
      <p className="mt-5 text-[17px] leading-[1.65] text-[var(--color-text)]">
        {tool.summary}
      </p>

      {/* 용도는 예전엔 "A · B · C" 회색 글줄이었다. 누르면 그 갈래의 다른 도구로 가는
          칩으로 바꿨다 — 이 도구가 안 맞을 때 옆 후보로 넘어가는 길이다. */}
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="이런 일에 써요">
        {[tool.purpose, ...tool.alsoFor].map((p) => (
          <li key={p}>
            <Link
              href={`/?for=${p}`}
              className="inline-block rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[13px] text-[var(--color-text-dim)] transition hover:border-[var(--color-text-mute)] hover:text-[var(--color-text)]"
            >
              {PURPOSE_LABEL[p]}
            </Link>
          </li>
        ))}
      </ul>

      {/* 고를 때 가장 먼저 보는 세 가지를 한 판에. 자세한 설명은 아래 섹션에 있다. */}
      <dl className="mt-6 grid grid-cols-1 divide-y divide-[var(--color-line-soft)] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Fact label="가격">
          <span
            className={
              payAttention ? "text-[var(--color-tier-bronze)]" : undefined
            }
          >
            {PRICING_LABEL[tool.pricingKind]}
          </span>
        </Fact>
        <Fact label="한국어">{KOREAN_LEVEL_LABEL[tool.koreanLevel]}</Fact>
        <Fact label="쓸 수 있는 곳">
          {tool.platforms.map((p) => PLATFORM_LABEL[p]).join(" · ")}
        </Fact>
      </dl>

      {/* 주의사항은 버튼보다 위에 둔다. 밑에 두면 결제하고 나서 읽는다. */}
      {tool.caution && (
        <p
          data-testid="tool-caution"
          className={`mt-4 rounded-xl border px-4 py-3 text-[14px] leading-relaxed ${
            payAttention
              ? "border-[var(--color-tier-bronze)]/40 bg-[var(--color-tier-bronze)]/8 text-[var(--color-text)]"
              : "border-[var(--color-line-soft)] bg-[var(--color-surface)] text-[var(--color-text-dim)]"
          }`}
        >
          {tool.caution}
        </p>
      )}

      {/* 이 사이트의 목적은 "보고 실제로 써보게" 하는 것이다. 첫 화면 안에 둔다. */}
      <a
        href={tool.siteUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-text)] px-5 py-3 text-[15px] font-semibold text-[var(--color-bg)] transition hover:opacity-90"
      >
        {tool.name} 써보러 가기
        <span aria-hidden="true">↗</span>
      </a>

      {/* 축별 점수는 후기가 있을 때만 그린다. */}
      {rated.length > 0 && (
        <Section title={`써 본 사람들 ${tool.reviewCount}명`}>
          <dl
            data-testid="axis-scores"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {rated.map((a) => {
              const s = tool.axisScores[a]!;
              return (
                <div
                  key={a}
                  className="rounded-lg border border-[var(--color-line)] px-3 py-2.5"
                >
                  <dt className="text-[12px] text-[var(--color-text-mute)]">
                    {TOOL_AXIS_LABEL[a]}
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums text-[var(--color-text)]">
                    {s.score.toFixed(1)}
                  </dd>
                  <dd className="text-[12px] text-[var(--color-text-mute)]">
                    {TOOL_AXIS_QUESTION[a]}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-2 text-[13px] text-[var(--color-text-mute)]">
            {tool.reviewCount < TOOL_MIN_REVIEWS_FOR_TIER
              ? `후기 ${TOOL_MIN_REVIEWS_FOR_TIER}개부터 티어를 매겨요. 지금 숫자는 ${tool.reviewCount}명이 매긴 값 그대로예요.`
              : "후기가 적을수록 점수를 전체 평균 쪽으로 당겨요. 몇 명 의견이 순위를 뒤집지 않게 하려는 보정이에요."}
          </p>
        </Section>
      )}

      {tool.howToStart && (
        <Section title="어떻게 시작하나요">
          <p>{tool.howToStart}</p>
        </Section>
      )}

      <Section title="돈이 드나요">
        <p>
          <strong className="font-semibold text-[var(--color-text)]">
            {PRICING_LABEL[tool.pricingKind]}
          </strong>
          {tool.priceNote && ` — ${tool.priceNote}`}
        </p>
      </Section>

      <Section title="한국어가 되나요">
        <p>
          <strong className="font-semibold text-[var(--color-text)]">
            {KOREAN_LEVEL_LABEL[tool.koreanLevel]}
          </strong>
          {tool.koreanNote && ` — ${tool.koreanNote}`}
        </p>
      </Section>

      <Section title="어디서 쓰나요">
        <p>{tool.platforms.map((p) => PLATFORM_LABEL[p]).join(" · ")}</p>
        <a
          href={tool.siteUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2.5 inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-[13px] text-[var(--color-text-dim)] transition hover:border-[var(--color-text-mute)]"
        >
          공식 사이트 열기 ↗
        </a>
      </Section>

      {/* 두 층을 잇는 지점. 모델이 없는 도구가 대부분이라 있을 때만 그린다. */}
      {tool.models.length > 0 && (
        <Section title="이 도구가 쓰는 모델">
          <p className="text-[var(--color-text-mute)]">
            안에서 돌아가는 AI 모델이에요. 몰라도 쓰는 데 지장은 없어요.
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {tool.models.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/models/${m.slug}`}
                  className="flex items-center gap-2 text-[14px] text-[var(--color-text-dim)] hover:underline"
                >
                  {m.tier && (
                    <TierStar
                      tier={
                        m.tier.toLowerCase() as
                          "prism" | "gold" | "silver" | "bronze"
                      }
                      size={14}
                    />
                  )}
                  <span>{m.name}</span>
                  {m.score !== null && (
                    <span className="tabular-nums text-[var(--color-text-mute)]">
                      {m.score.toFixed(1)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <ToolReviewSection
        slug={tool.slug}
        toolName={tool.name}
        initialItems={reviews.items}
        total={reviews.total}
        signedIn={Boolean(viewerId)}
        myReview={myReview}
      />
    </article>
  );
}

/**
 * 설명 한 덩어리. 넓은 화면에서는 제목을 왼쪽 칸에 세우고 본문을 오른쪽에 둔다 —
 * 제목들이 한 세로줄에 서서, 훑을 때 목차처럼 읽힌다. 좁은 화면에서는 위아래로 쌓인다.
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7 border-t border-[var(--color-line-soft)] pt-5 md:grid md:grid-cols-[9.5rem_minmax(0,1fr)] md:gap-6">
      <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
        {title}
      </h2>
      <div className="mt-1.5 text-[15px] leading-[1.75] text-[var(--color-text-dim)] md:mt-0">
        {children}
      </div>
    </section>
  );
}

/** 요약 판의 한 칸. 이름은 작게, 값은 크게 — 값이 먼저 눈에 걸려야 한다. */
function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3 sm:block sm:py-3.5">
      <dt className="text-[13px] text-[var(--color-text-mute)]">{label}</dt>
      <dd className="text-right text-[15px] font-semibold text-[var(--color-text)] sm:mt-1 sm:text-left">
        {children}
      </dd>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[12px] font-medium text-[var(--color-text-dim)]">
      {children}
    </span>
  );
}
/* Footer: app/tools/[slug]/page.tsx */
