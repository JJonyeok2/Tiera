/* Header: 모델 상세 E2E — 듀얼 스코어와 괴리 배지 */
import { expect, test } from "@playwright/test";

test("듀얼 스코어와 벤치마크 원본 표가 보인다", async ({ page }) => {
  await page.goto("/models/grok-4-6");
  await expect(page.locator("h1")).toHaveText("Grok 4.6");
  await expect(page.locator("main")).toContainText("커뮤니티 점수");
  await expect(page.locator("main")).toContainText("벤치마크 점수");
  await expect(page.locator("main")).toContainText("SWE-bench Verified");
});

test("벤치마크 순위가 커뮤니티보다 크게 높으면 스펙 우위 배지가 붙는다", async ({ page }) => {
  await page.goto("/models/grok-4-6");
  await expect(page.locator("main")).toContainText("스펙 우위");
});

test("없는 모델은 404", async ({ page }) => {
  const res = await page.goto("/models/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("점수 산정 방식 페이지가 상수를 실제 구현에서 읽어 보여준다", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator("main")).toContainText("S = (v·R + 30·C) / (v + 30)");
  await expect(page.locator("main")).toContainText("3계단 이상");
  // Artificial Analysis 약관상 출처 표기는 필수다. 사라지면 테스트가 잡아야 한다.
  await expect(page.locator("main")).toContainText("Artificial Analysis");
  await expect(page.locator("main")).toContainText("비워 둡니다");
});
/* Footer: tests/e2e/model.spec.ts */
