/* ---------------------------------------------------------------------------
 * Header: /tools/[slug] — 도구 상세. SPEC 23.5.
 *
 * 답해야 하는 질문 순서가 곧 화면 순서다:
 *   뭘 해주나 → 어떻게 시작하나 → 돈이 드나 → 한국어가 되나 → 이게 쓰는 모델
 *
 * "이 도구가 쓰는 모델" 섹션이 일반인 층과 개발자 층을 잇는 유일한 지점이다.
 * 일반인은 안 눌러도 되고, 궁금한 사람은 거기서 벤치마크까지 내려간다.
 *
 * 후기 영역은 아직 없다. tool_review 스키마는 준비됐지만 작성 폼·API·집계가
 * 별도 작업이라, 지금은 "없다"고 쓰는 편이 빈 섹션을 두는 것보다 정직하다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TierStar from "@/components/tier/TierStar";
import { getAllToolSlugs, getToolDetail } from "@/lib/queries";
import {
  KOREAN_LEVEL_LABEL,
  PLATFORM_LABEL,
  PRICING_LABEL,
  PURPOSE_LABEL,
} from "@/lib/labels";

export const revalidate = 300;

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
  if (!tool) return { title: "찾을 수 없음" };

  return {
    title: `${tool.name} — 어떤 도구인가`,
    description: tool.summary,
    alternates: { canonical: `/tools/${tool.slug}` },
    // 후기가 0개인 동안에는 aggregateRating을 내보내지 않는다.
    // 없는 평점을 구조화 데이터로 흘리면 검색엔진에 스팸으로 잡힌다.
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolDetail(slug);
  if (!tool) notFound();

  const payAttention = tool.pricingKind === "PAID" || tool.pricingKind === "TRIAL";

  return (
    <article className="py-7">
      <Link href="/" className="text-xs text-[var(--color-text-mute)] hover:underline">
        ← 도구 목록
      </Link>

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">{tool.name}</h1>
          {tool.origin === "KR" && (
            <span className="rounded border border-[var(--color-tier-prism)] px-1.5 py-0.5 text-[10px] text-[var(--color-tier-prism)]">
              국산
            </span>
          )}
          {tool.studentFree && (
            <span className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-dim)]">
              대학생 혜택
            </span>
          )}
          {tool.tier && tool.score !== null && (
            <span className="flex items-center gap-1.5">
              <TierStar
                tier={tool.tier.toLowerCase() as "prism" | "gold" | "silver" | "bronze"}
                size={20}
              />
              <span className="text-sm font-semibold tabular-nums">{tool.score.toFixed(1)}</span>
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-mute)]">
          {tool.maker} · {PURPOSE_LABEL[tool.purpose]}
          {tool.alsoFor.length > 0 && ` · ${tool.alsoFor.map((p) => PURPOSE_LABEL[p]).join(" · ")}`}
        </p>
      </header>

      {/* 주의사항은 본문보다 위에 둔다. 밑에 두면 결제하고 나서 읽는다. */}
      {tool.caution && (
        <p
          className={`mt-4 rounded-lg border px-4 py-3 text-xs leading-relaxed ${
            payAttention
              ? "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
              : "border-[var(--color-line-soft)] bg-[var(--color-surface)] text-[var(--color-text-dim)]"
          }`}
        >
          {tool.caution}
        </p>
      )}

      <Section title="뭘 해주나">
        <p>{tool.summary}</p>
      </Section>

      {tool.howToStart && (
        <Section title="어떻게 시작하나">
          <p>{tool.howToStart}</p>
        </Section>
      )}

      <Section title="돈이 드나">
        <p>
          <strong className="font-semibold text-[var(--color-text)]">
            {PRICING_LABEL[tool.pricingKind]}
          </strong>
          {tool.priceNote && ` — ${tool.priceNote}`}
        </p>
      </Section>

      <Section title="한국어가 되나">
        <p>
          <strong className="font-semibold text-[var(--color-text)]">
            {KOREAN_LEVEL_LABEL[tool.koreanLevel]}
          </strong>
          {tool.koreanNote && ` — ${tool.koreanNote}`}
        </p>
      </Section>

      <Section title="어디서 쓰나">
        <p>{tool.platforms.map((p) => PLATFORM_LABEL[p]).join(" · ")}</p>
        <a
          href={tool.siteUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2.5 inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-text-dim)] transition hover:border-[var(--color-text-mute)]"
        >
          공식 사이트 열기 ↗
        </a>
      </Section>

      {/* 두 층을 잇는 지점. 모델이 없는 도구가 대부분이라 있을 때만 그린다. */}
      {tool.models.length > 0 && (
        <Section title="이 도구가 쓰는 모델">
          <p className="text-[var(--color-text-mute)]">
            안에서 돌아가는 AI 모델이다. 몰라도 쓰는 데 지장은 없다.
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {tool.models.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/models/${m.slug}`}
                  className="flex items-center gap-2 text-xs text-[var(--color-text-dim)] hover:underline"
                >
                  {m.tier && (
                    <TierStar
                      tier={m.tier.toLowerCase() as "prism" | "gold" | "silver" | "bronze"}
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

      <Section title="후기">
        <p className="text-[var(--color-text-mute)]">
          {tool.reviewCount > 0
            ? `${tool.reviewCount}개`
            : "아직 없습니다. 후기 기능은 준비 중입니다."}
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 border-t border-[var(--color-line-soft)] pt-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-mute)]">
        {title}
      </h2>
      <div className="mt-2 text-xs leading-relaxed text-[var(--color-text-dim)]">{children}</div>
    </section>
  );
}
/* Footer: app/tools/[slug]/page.tsx */
