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
  // 없는 값을 0으로 채우지 않는다는 원칙이 문서에 남아 있는지. 말투가 아니라 단어로 본다.
  await expect(page.locator("main")).toContainText("비워 둬요");
});

test("점수 설명 페이지가 도구 점수도 설명한다", async ({ page }) => {
  // 도구 카드의 "자세히"를 따라온 사람이 자기가 본 점수의 설명을 찾을 수 있어야 한다.
  // 숫자는 상수에서 읽어 온 값이어야 한다 — 문서와 구현이 따로 놀면 안 된다.
  const { TOOL_CONFIDENCE_M, TOOL_MIN_REVIEWS_FOR_TIER } = await import("@/lib/scoring/constants");
  await page.goto("/about");
  const main = page.locator("main");
  await expect(main).toContainText("도구 점수");
  await expect(main).toContainText(`S = (v·R + ${TOOL_CONFIDENCE_M}·C) / (v + ${TOOL_CONFIDENCE_M})`);
  await expect(main).toContainText(`${TOOL_MIN_REVIEWS_FOR_TIER}개`);
  for (const axis of ["쉬움", "결과물", "가격", "한국어"]) await expect(main).toContainText(axis);
  await expect(main.locator('a:has-text("도구 목록")')).toHaveAttribute("href", "/");
});
/* Footer: tests/e2e/model.spec.ts */
