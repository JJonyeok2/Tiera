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
export const SITE_DESCRIPTION =
  "벤치마크 점수와 커뮤니티 체감 평가를 나란히 보는 AI 모델 티어표. 미국·중국·한국 개발사 모델을 한 곳에서 비교합니다.";

/** 절대 URL로 만든다. sitemap·canonical·OG에서 공통으로 쓴다. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
/* Footer: lib/site.ts */
