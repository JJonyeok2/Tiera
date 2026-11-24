/* Header: /usage E2E — 잣대별 1등, 3강 비교, 추이, 출처, 크론 인증. SPEC 26 */
import { expect, test } from "@playwright/test";

test("세 잣대가 각각 기준 시점과 함께 나온다", async ({ page }) => {
  await page.goto("/usage");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("지금 누가 제일 많이 쓰이나");
  await expect(page.getByTestId("tile-app")).toContainText("ChatGPT");
  await expect(page.getByTestId("tile-web")).toContainText("ChatGPT");
  await expect(page.getByTestId("tile-web")).toContainText("2026.10");
  // C는 DB에 따라 숫자이거나, 못 불러왔다는 안내다. 빈 칸이나 0은 안 된다.
  await expect(page.getByTestId("tile-api")).toHaveText(/7일|불러오지 못했어요/);
});

test("잣대를 합친 종합 순위는 어디에도 없다", async ({ page }) => {
  await page.goto("/usage");
  await expect(page.getByText(/종합 \d+위|종합 1등/)).toHaveCount(0);
});

test("추이 그래프는 표로도 볼 수 있다", async ({ page }) => {
  await page.goto("/usage");
  const fig = page.getByTestId("web-trend");
  await fig.getByText("표로 보기").click();
  await expect(fig.locator("table")).toContainText("2026.10");
  await expect(fig.locator("table")).toContainText("11.5%");
});

test("출처: Similarweb 인용 보도와 OpenRouter 한계 문구", async ({ page }) => {
  await page.goto("/usage");
  const src = page.locator("#sources");
  await expect(src).toContainText("Similarweb");
  await expect(src).toContainText("OpenRouter를 거친 요청");
  await expect(src.locator('a[href^="https://fourweekmba.com/"]').first()).toBeVisible();
});

test("도구 상세에서 사용량으로 이어진다", async ({ page }) => {
  await page.goto("/tools/claude");
  await expect(page.getByTestId("tool-usage")).toContainText("국내 앱 사용자");
  await page.getByRole("link", { name: /잣대별로 비교하기/ }).click();
  await expect(page).toHaveURL(/\/usage$/);
});

test("사용량 크론: 시크릿이 틀리면 401", async ({ request }) => {
  const res = await request.get("/api/cron/usage", { headers: { authorization: "Bearer wrong" } });
  expect([401, 503]).toContain(res.status());
});
/* Footer: tests/e2e/usage.spec.ts */
