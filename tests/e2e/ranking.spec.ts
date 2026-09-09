/* Header: 랭킹 화면 E2E — 필터·검색·URL 동기화·비교 진입 */
import { expect, test } from "@playwright/test";

test("랭킹이 순위대로 렌더된다", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("main ul > li");
  await expect(rows.first()).toContainText("GPT-6 Astra");
  expect(await rows.count()).toBeGreaterThan(5);
});

test("국가 필터를 걸어도 전체 순위 번호를 유지한다", async ({ page }) => {
  await page.goto("/");
  await page.click('button:has-text("한국")');
  await expect(page).toHaveURL(/country=KR/);
  const rows = page.locator("main ul > li");
  await expect(rows.first()).toContainText("한국");
  // 필터 후 1,2,3으로 다시 매기지 않고 전체 순위를 그대로 보여줘야 한다
  const firstRank = await rows.first().locator("span").first().innerText();
  expect(Number(firstRank)).toBeGreaterThan(1);
});

test("카테고리 탭이 URL과 목록에 반영된다", async ({ page }) => {
  await page.goto("/");
  await page.click('button[role=tab]:has-text("코딩")');
  await expect(page).toHaveURL(/scope=CODING/);
  await expect(page.locator("main")).toContainText("코딩 기준");
});

test("점수 타입을 벤치마크로 바꾸면 순위가 달라진다", async ({ page }) => {
  await page.goto("/");
  const communityTop = await page.locator("main ul > li").first().innerText();
  await page.click('button[role=tab]:has-text("벤치마크")');
  await expect(page).toHaveURL(/type=BENCHMARK/);
  await expect(page.locator("main")).toContainText("벤치마크 · 종합 기준");
  const benchTop = await page.locator("main ul > li").first().innerText();
  expect(benchTop).not.toBe(communityTop);
});

test("검색은 디바운스 후 URL에 반영되고, 없는 모델은 빈 상태를 보여준다", async ({ page }) => {
  await page.goto("/");
  await page.fill("#model-search", "deep");
  await expect(page).toHaveURL(/q=deep/, { timeout: 5000 });
  await expect(page.locator("main ul > li").first()).toContainText("DeepSeek");

  await page.fill("#model-search", "존재하지않는모델");
  await expect(page.locator("main")).toContainText("일치하는 모델이 없어요", { timeout: 5000 });
});

test("벤치마크 탭은 표본을 '리뷰'가 아니라 '벤치마크 N종'으로 표기한다", async ({ page }) => {
  // 두 탭의 sample_count는 의미가 다르다(리뷰어 수 vs 벤치마크 종류 수).
  // 둘 다 "리뷰 N개"로 찍었더니 리뷰가 0건인데도 "리뷰 5개"가 떠서 없는 평가가 있는 것처럼 보였다.
  await page.goto("/?type=BENCHMARK");
  const first = page.locator("main ul > li").first();
  await expect(first).toContainText(/벤치마크 \d+종/);
  await expect(first).not.toContainText("리뷰");
  // 공인/평가 중 배지도 리뷰 수에서 나오는 값이라 벤치마크 탭에는 없어야 한다
  await expect(first).not.toContainText("공인");

  await page.goto("/?type=COMMUNITY");
  await expect(page.locator("main ul > li").first()).toContainText(/리뷰 [\d,]+개/);
});

test("2개를 고르면 비교 트레이가 뜨고 비교 페이지로 넘어간다", async ({ page }) => {
  await page.goto("/");
  const boxes = page.locator('main input[type="checkbox"]');
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await page.click('a:has-text("2개 비교하기")');
  await expect(page).toHaveURL(/\/compare\?models=/);
  await expect(page.locator("h1")).toHaveText("모델 비교");
  await expect(page.locator("main")).toContainText("스펙 비교");
});
/* Footer: tests/e2e/ranking.spec.ts */
