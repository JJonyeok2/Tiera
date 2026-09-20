/* Header: 테마 E2E — 다크/라이트/시스템 3상태와 저장·복원

   테마 선택은 아이콘 하나에 접혀 있다. 옵션을 누르려면 먼저 펼쳐야 한다. */
import { expect, type Page, test } from "@playwright/test";

/** 테마 메뉴를 펼치고 옵션을 고른다. */
async function pickTheme(page: Page, label: string) {
  await page.click('button[aria-label="화면 테마"]');
  await page.click(`button[role=radio][title="${label}"]`);
}

test("라이트를 고르면 data-theme=light가 박히고 새로고침해도 유지된다", async ({ page }) => {
  await page.goto("/");
  await pickTheme(page, "라이트");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("다크로 바꾸면 즉시 반영된다", async ({ page }) => {
  await page.goto("/");
  await pickTheme(page, "다크");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("시스템을 고르면 data-theme 속성 자체가 사라진다", async ({ page }) => {
  // JS로 OS 설정을 흉내내지 않고 CSS의 prefers-color-scheme에 넘기기 위해서다.
  await page.goto("/");
  await pickTheme(page, "다크");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await pickTheme(page, "시스템");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.*/);
});

/**
 * 배경 밝기를 재는 헬퍼.
 *
 * 예전에는 hex 값을 그대로 비교했다(#12161d 등). 그러면 팔레트를 한 번 손볼
 * 때마다 테스트가 깨지는데, 정작 **깨진 게 기능인지 취향인지 구분이 안 된다.**
 * 실제로 대비를 올리는 조정을 했더니 두 개가 빨갛게 떴다 — 기능은 멀쩡했다.
 * 이 테스트가 지키려던 건 "다크는 어둡고 라이트는 밝은가"이므로 그걸 직접 잰다.
 */
async function bodyLuminance(page: Page): Promise<number> {
  return page.evaluate(() => {
    const m = getComputedStyle(document.body).backgroundColor.match(/\d+/g)!;
    const [r, g, b] = m.map(Number);
    // 사람 눈의 민감도를 반영한 근사 밝기(0~255).
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  });
}

test("시스템 모드에서 OS가 다크면 어두운 배경이 적용된다", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto("/");
  expect(await bodyLuminance(page)).toBeLessThan(60);
  await ctx.close();
});

test("시스템 모드에서 OS가 라이트면 밝은 배경이 적용된다", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto("/");
  expect(await bodyLuminance(page)).toBeGreaterThan(195);
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
