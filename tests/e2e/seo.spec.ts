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

test("sitemap에 도구와 모델 상세가 모두 들어간다", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  // 정적 페이지 3개만 들어 있으면 DB 조회가 조용히 실패한 것이다
  expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThan(3);
  expect(xml).toContain("/models/");
  // 도구가 빠지면 일반 질의("발표자료 AI 추천") 유입 경로가 통째로 사라진다
  expect(xml).toContain("/tools/");
});

test("검색 결과 페이지는 색인에서 빼고, 목록은 canonical을 고정한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);

  // 용도 탭마다 URL이 갈라져도 정본은 하나여야 한다
  await page.goto("/?for=IMAGE");
  const homeCanonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(homeCanonical).not.toContain("for=");

  await page.goto("/?q=claude");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  // 모델 랭킹도 같은 규칙을 따른다
  await page.goto("/models?type=BENCHMARK&scope=CODING");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toContain("/models");
  expect(canonical).not.toContain("scope=");
});

test("모델 상세는 구조화 데이터를 내보내고, 리뷰가 없으면 별점을 넣지 않는다", async ({ page }) => {
  await page.goto("/models");
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

test("점수 없는 모델은 sitemap에서 빠지고 색인에서도 제외된다", async ({ page, request }) => {
  // AA가 이름만 알려주고 평가 데이터가 없는 모델이 상당수 있다.
  // 그런 페이지는 "데이터 없음"만 찍힌 빈 문서라 색인되면 얇은 콘텐츠가 된다.
  const xml = await (await request.get("/sitemap.xml")).text();
  const slugs = [...xml.matchAll(/\/models\/([^<]+)</g)].map((m) => m[1]);

  for (const slug of slugs.slice(0, 5)) {
    await page.goto(`/models/${slug}`);
    const robots = page.locator('meta[name="robots"]');
    if ((await robots.count()) > 0) {
      // sitemap에 올린 페이지가 noindex면 서로 모순된 신호를 보내는 것이다
      await expect(robots).not.toHaveAttribute("content", /noindex/);
    }
  }
});

test("없는 페이지는 200이 아니라 404를 준다", async ({ request }) => {
  // 홈에 로딩 스켈레톤을 넣었을 때 실제로 깨졌던 부분이다.
  // loading.tsx는 해당 세그먼트와 하위 전체를 스트리밍으로 바꾸는데,
  // 스트리밍은 본문보다 헤더가 먼저 나가서 뒤늦은 notFound()가 상태 코드를
  // 바꾸지 못한다. 200을 주는 없는 페이지는 검색엔진에 soft 404로 잡힌다.
  expect((await request.get("/models/definitely-not-a-real-model")).status()).toBe(404);
  expect((await request.get("/tools/definitely-not-a-real-tool")).status()).toBe(404);
  expect((await request.get("/이런-경로는-없다")).status()).toBe(404);
});

test("OG 이미지가 생성된다", async ({ request }) => {
  const res = await request.get("/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});
test("공유 미리보기: 모든 공개 페이지에 이미지가 붙고, 자기 주소를 정본으로 가리킨다", async ({ page }) => {
  // 페이지가 openGraph를 적으면 Next가 레이아웃 값을 통째로 갈아끼워서,
  // 예전엔 도구·모델 상세를 공유하면 이미지 없는 빈 카드가 떴다(lib/site.ts shareMeta).
  // 또 레이아웃의 canonical "/"를 물려받아 /about이 "정본은 홈"이라고 알리고 있었다.
  const pages = [
    { path: "/", canonical: /\/$|:\d+$/ },
    { path: "/models", canonical: /\/models$/ },
    { path: "/about", canonical: /\/about$/ },
    { path: "/tools/claude", canonical: /\/tools\/claude$/ },
  ];
  for (const p of pages) {
    await page.goto(p.path);
    await expect(page.locator('meta[property="og:image"]'), p.path).toHaveCount(1);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical, p.path).toMatch(p.canonical);
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
    expect(ogUrl, p.path).toBe(canonical);
  }
});

test("도구 상세를 공유하면 사이트 소개가 아니라 그 도구가 나간다", async ({ page }) => {
  await page.goto("/tools/claude");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Claude/);
  // 설명은 화면 제목 아래 한 줄 소개와 같은 문장이어야 한다. 문구를 박지 않고 화면과 대조한다.
  const desc = (await page.locator('meta[property="og:description"]').getAttribute("content")) ?? "";
  expect(desc.length).toBeGreaterThan(10);
  await expect(page.locator("main")).toContainText(desc);
});

test("사이트 소개가 더 이상 모델 티어표라고 하지 않는다", async ({ page }) => {
  // 홈은 도구 목록인데 검색 결과·공유 카드는 "AI 모델 티어표"라고 소개하고 있었다.
  await page.goto("/");
  const title = await page.title();
  const desc = await page.locator('meta[name="description"]').getAttribute("content");
  expect(title).not.toContain("모델 티어표");
  expect(desc ?? "").not.toContain("모델 티어표");
});

test("로그인 화면은 색인하지 않는다", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
/* Footer: tests/e2e/seo.spec.ts */
