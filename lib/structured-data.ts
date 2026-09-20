/* ---------------------------------------------------------------------------
 * Header: JSON-LD 페이로드 생성 — 화면에 있는 값만 담는다.
 * ------------------------------------------------------------------------- */
import type { ModelDetail, ToolDetail } from "./queries";
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

/**
 * 도구 상세 구조화 데이터.
 *
 * 모델 쪽과 같은 규칙: **후기가 0개면 aggregateRating을 내보내지 않는다.**
 * 없는 평점을 구조화 데이터로 흘리면 구글에 스팸으로 잡히고, 도메인 단위로
 * 불이익을 받는다. 시드 직후에는 37개 전부 후기가 0개라 이 분기가 기본값이다.
 *
 * offers도 pricingKind가 FREE일 때만 0원으로 선언한다. FREEMIUM·TRIAL을 0원으로
 * 적으면 "무료"라고 검색 결과에 뜨는데, 런웨이처럼 사실상 유료인 것까지 무료로
 * 광고하게 된다 — 우리가 카드에서 애써 구분한 것을 스스로 뒤집는 꼴이다.
 */
export function toolJsonLd(t: ToolDetail): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t.name,
    applicationCategory: "AI 도구",
    operatingSystem: "Web",
    url: absoluteUrl(`/tools/${t.slug}`),
    inLanguage: "ko-KR",
    description: t.summary,
    author: { "@type": "Organization", name: t.maker },
    sameAs: t.siteUrl,
  };

  if (t.pricingKind === "FREE") {
    data.offers = { "@type": "Offer", price: 0, priceCurrency: "KRW" };
  }

  if (t.score !== null && t.reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(t.score.toFixed(1)),
      bestRating: 100,
      worstRating: 0,
      ratingCount: t.reviewCount,
    };
  }

  return data;
}
/* Footer: lib/structured-data.ts */
