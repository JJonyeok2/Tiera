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
 * 불이익을 받는다. 시드 직후에는 전부 후기가 0개라 이 분기가 기본값이다.
 *
 * offers도 pricingKind가 FREE일 때만 0원으로 선언한다. FREEMIUM·TRIAL을 0원으로
 * 적으면 "무료"라고 검색 결과에 뜨는데, 런웨이처럼 사실상 유료인 것까지 무료로
 * 광고하게 된다 — 우리가 카드에서 애써 구분한 것을 스스로 뒤집는 꼴이다.
 */
/** 우리 플랫폼 값을 schema.org operatingSystem 문자열로. 전부 "Web"이라고 적던 걸 고쳤다. */
function operatingSystems(platforms: ToolDetail["platforms"]): string {
  const map: Record<string, string> = {
    WEB: "Web",
    IOS: "iOS",
    ANDROID: "Android",
    // 도구마다 지원 OS가 달라서(리눅스까지 되는 것도, 맥만 되는 것도 있다)
    // 특정 OS 이름을 박지 않는다. 확인 안 된 걸 적지 않는다는 시드 규칙과 같다.
    DESKTOP: "Desktop",
    EXTENSION: "Web browser",
  };
  const out = [...new Set(platforms.map((p) => map[p]).filter(Boolean))];
  return out.length > 0 ? out.join(", ") : "Web";
}

export function toolJsonLd(t: ToolDetail): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t.name,
    // aliases는 alternateName으로 내보내지 않는다. 검색용이라 제작사 이름("앤트로픽")과
    // 오타까지 섞여 있어서, 그대로 넣으면 "Claude의 다른 이름은 앤트로픽"이라고
    // 선언하는 셈이 된다. 페이지 keywords에만 쓴다.
    // schema.org가 정한 값만 인식된다. "AI 도구"는 아무 뜻도 전달하지 못한다.
    applicationCategory: "BusinessApplication",
    operatingSystem: operatingSystems(t.platforms),
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
