/* ---------------------------------------------------------------------------
 * Header: JSON-LD 페이로드 생성 — 화면에 있는 값만 담는다.
 * ------------------------------------------------------------------------- */
import type { ModelDetail } from "./queries";
import { COUNTRY_LABEL } from "./labels";
import { absoluteUrl, SITE_NAME } from "./site";

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function modelJsonLd(m: ModelDetail): Record<string, unknown> {
  const community = m.community.OVERALL;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: m.name,
    applicationCategory: "AI 언어 모델",
    operatingSystem: "Web",
    url: absoluteUrl(`/models/${m.slug}`),
    inLanguage: "ko-KR",
    description:
      m.description ?? `${m.name}(${m.developerName}, ${COUNTRY_LABEL[m.country]})의 평가 정보`,
    author: {
      "@type": "Organization",
      name: m.developerName,
      ...(m.developerSiteUrl ? { url: m.developerSiteUrl } : {}),
    },
  };

  // 실제 리뷰가 있을 때만 별점을 선언한다. 없는 평가를 있다고 하면 안 된다.
  if (community && community.sampleCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(community.score.toFixed(1)),
      bestRating: 100,
      worstRating: 0,
      ratingCount: community.sampleCount,
    };
  }

  return data;
}
/* Footer: lib/structured-data.ts */
