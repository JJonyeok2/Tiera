/* ---------------------------------------------------------------------------
 * Header: 사이트 절대 URL 해석 — SEO 메타데이터의 기준점.
 *
 * canonical, sitemap, OG 이미지는 전부 절대 URL이어야 한다.
 * 상대 경로로 두면 크롤러가 어떤 도메인을 정본으로 볼지 알 수 없다.
 *
 * 우선순위:
 *   1. NEXT_PUBLIC_SITE_URL — 커스텀 도메인을 붙였을 때 여기에 박는다.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel이 프로덕션 도메인을 넣어준다.
 *      (VERCEL_URL은 배포마다 바뀌는 임시 주소라 canonical로 쓰면 안 된다)
 *   3. 로컬 개발용 fallback.
 * ------------------------------------------------------------------------- */

function normalize(raw: string): string {
  const withScheme = raw.startsWith("http") ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return normalize(explicit);

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return normalize(prod);

  return "http://localhost:3000";
}

export const SITE_NAME = "Tiera";
/**
 * 사이트 한 줄 소개. 검색 결과 스니펫과 공유 미리보기에 그대로 나간다.
 *
 * 모델 순위표 시절 문구("벤치마크 점수와 커뮤니티 체감 평가를 나란히 보는
 * AI 모델 티어표")가 방향을 바꾼 뒤에도 한참 남아 있었다. 홈에 들어오면
 * 도구 목록인데 검색 결과에서는 모델 순위표라고 소개하고 있었던 셈이다.
 */
export const SITE_TAGLINE = "어떤 AI를 써야 할지 모를 때";
/**
 * 검색 결과 제목. 태그라인과 따로 둔다 — 태그라인은 화면에서 공감을 끄는 말이고,
 * 이건 검색창에 사람들이 실제로 치는 말("AI 도구 추천", "무료", "한국어")이어야 한다.
 * 2026-10: 사이트가 순위표가 아니라 "나에게 맞는 도구를 고르게 돕는 안내서"라는 걸
 * 제목에서부터 말하도록 바꿨다.
 */
export const SITE_TITLE = "나에게 맞는 AI 도구 찾기 | 무료·한국어·시작법 정리";
export const SITE_DESCRIPTION =
  "발표자료, 번역, 영상, 포트폴리오까지 — 하려는 일로 AI 도구를 골라보세요. 무료인지, 한국어가 되는지, 어떻게 시작하는지 정리해 뒀어요.";

/** 절대 URL로 만든다. sitemap·canonical·OG에서 공통으로 쓴다. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
/**
 * 페이지별 공유 메타데이터(openGraph + twitter).
 *
 * Next는 페이지가 openGraph를 적으면 레이아웃의 openGraph를 **통째로 갈아끼운다.**
 * 합쳐주지 않는다. 그래서 url·title만 적은 페이지는 og:image·siteName·locale이
 * 전부 빠진 채로 나갔다 — 카톡에 도구 링크를 보내면 이미지 없는 빈 카드가 떴다.
 * 모든 페이지가 이 함수를 거치게 해서 빠지는 칸이 없게 한다.
 */
export function shareMeta(opts: {
  url: string;
  title: string;
  description: string;
  type?: "website" | "article";
}) {
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` };
  return {
    openGraph: {
      type: opts.type ?? "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      url: opts.url,
      title: opts.title,
      description: opts.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: opts.title,
      description: opts.description,
      images: [image.url],
    },
  };
}
/* Footer: lib/site.ts */
