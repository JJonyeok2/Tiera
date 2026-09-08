/* Header: 테마 E2E — 다크/라이트/시스템 3상태와 저장·복원 */
import { expect, test } from "@playwright/test";

test("라이트를 고르면 data-theme=light가 박히고 새로고침해도 유지된다", async ({ page }) => {
  await page.goto("/");
  await page.click('button[role=radio][title="라이트"]');
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("다크로 바꾸면 즉시 반영된다", async ({ page }) => {
  await page.goto("/");
  await page.click('button[role=radio][title="다크"]');
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("시스템을 고르면 data-theme 속성 자체가 사라진다", async ({ page }) => {
  // JS로 OS 설정을 흉내내지 않고 CSS의 prefers-color-scheme에 넘기기 위해서다.
  await page.goto("/");
  await page.click('button[role=radio][title="다크"]');
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.click('button[role=radio][title="시스템"]');
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.*/);
});

test("시스템 모드에서 OS가 다크면 어두운 배경이 적용된다", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto("/");
  const bg = await page.evaluate(() =>
    getComputedStyle(document.body).backgroundColor
  );
  // #12161d
  expect(bg).toBe("rgb(18, 22, 29)");
  await ctx.close();
});

test("시스템 모드에서 OS가 라이트면 밝은 배경이 적용된다", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto("/");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // #f6f7f9
  expect(bg).toBe("rgb(246, 247, 249)");
  await ctx.close();
});

test("하이드레이션 불일치 경고가 없다", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && m.text().includes("hydrat")) errors.push(m.text());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
/* Footer: tests/e2e/theme.spec.ts */
