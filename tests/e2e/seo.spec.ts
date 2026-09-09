/* Header: 검색 노출용 메타데이터 E2E — robots / sitemap / canonical / 구조화 데이터 */
import { expect, test } from "@playwright/test";

test("robots.txt가 크롤링을 허용하고 sitemap을 가리킨다", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("Allow: /");
  expect(body).toContain("Disallow: /api/");
  expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
});

test("sitemap에 모델 상세가 들어간다", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  // 정적 페이지 3개만 들어 있으면 DB 조회가 조용히 실패한 것이다
  expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThan(3);
  expect(xml).toContain("/models/");
});

test("검색 결과 페이지는 색인에서 빼고, 목록은 canonical을 루트로 고정한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);

  // 필터 조합마다 URL이 갈라져도 정본은 하나여야 한다
  await page.goto("/?type=BENCHMARK&scope=CODING");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).not.toContain("scope=");

  await page.goto("/?q=claude");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("모델 상세는 구조화 데이터를 내보내고, 리뷰가 없으면 별점을 넣지 않는다", async ({ page }) => {
  await page.goto("/");
  await page.locator("main ul > li a").first().click();
  await expect(page).toHaveURL(/\/models\//);

  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(raw ?? "{}");
  expect(data["@type"]).toBe("SoftwareApplication");
  expect(data.name).toBeTruthy();
  expect(data.url).toContain("/models/");

  // 별점을 선언했다면 반드시 실제 리뷰 수가 1 이상이어야 한다.
  // 리뷰 0건인데 별점을 내보내면 구조화 데이터 스팸이다.
  if (data.aggregateRating) {
    expect(data.aggregateRating.ratingCount).toBeGreaterThan(0);
  }
});

test("OG 이미지가 생성된다", async ({ request }) => {
  const res = await request.get("/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});
/* Footer: tests/e2e/seo.spec.ts */
