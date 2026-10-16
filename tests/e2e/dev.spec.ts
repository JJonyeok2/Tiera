/* Header: 개발자 섹션(/dev) E2E — SPEC 23.24.

   지킬 것: 다섯 페이지가 뜨고 탭으로 오가며, 지금 페이지가 탭에 표시되고,
   하네스 표가 모든 하네스를 담고, 코드 블록마다 복사 버튼이 있고,
   바깥 링크가 새 창 + noopener로 열린다. 헤더에서 한 번에 들어올 수 있어야 한다. */
import { expect, test } from "@playwright/test";
import { HARNESSES } from "@/lib/dev/harnesses";
import { SKILLS } from "@/lib/dev/skills";
import { MCP_SERVERS } from "@/lib/dev/mcp";

const main = (page: import("@playwright/test").Page) => page.locator("main");

test("헤더의 '개발자'로 개요에 들어오고, 카드 네 장이 있다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "개발자" }).click();
  await expect(page).toHaveURL(/\/dev$/);
  await expect(main(page).getByTestId("dev-cards").locator("li")).toHaveCount(4);
  await expect(main(page).getByTestId("dev-checked")).toContainText("확인");
});

test("탭으로 다섯 페이지를 오가고, 현재 탭이 표시된다", async ({ page }) => {
  await page.goto("/dev");
  const nav = page.getByRole("navigation", { name: "개발자 섹션" });
  for (const [label, path] of [
    ["하네스", "/dev/harness"],
    ["스킬", "/dev/skills"],
    ["MCP", "/dev/mcp"],
    ["설정 가이드", "/dev/guide"],
    ["개요", "/dev"],
  ] as const) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(main(page).locator("h1")).toBeVisible();
  }
});

test("하네스 표는 모든 하네스를 한 줄씩 담는다", async ({ page }) => {
  await page.goto("/dev/harness");
  await expect(page.getByTestId("harness-table").locator("tbody tr")).toHaveCount(HARNESSES.length);
  await expect(page.getByTestId("harness-card")).toHaveCount(HARNESSES.length);
});

test("스킬·MCP 카드 수가 데이터와 같고 코드 블록마다 복사 버튼이 있다", async ({ page }) => {
  await page.goto("/dev/skills");
  await expect(page.getByTestId("skill-card")).toHaveCount(SKILLS.length);
  const blocks = page.getByTestId("code-block");
  const n = await blocks.count();
  expect(n).toBeGreaterThanOrEqual(SKILLS.length);
  await expect(blocks.getByRole("button")).toHaveCount(n);

  await page.goto("/dev/mcp");
  await expect(page.getByTestId("mcp-card")).toHaveCount(MCP_SERVERS.length);
  await expect(page.getByTestId("mcp-safety")).toBeVisible();
});

test("복사 버튼을 누르면 클립보드에 코드가 들어간다", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "클립보드 권한은 chromium에서만 준다");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dev/harness");
  const first = page.getByTestId("code-block").first();
  await first.getByRole("button").click();
  await expect(first.getByRole("button")).toHaveText("복사됨");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(HARNESSES[0].install);
});

test("가이드는 여섯 섹션과 체크리스트, 앵커를 가진다", async ({ page }) => {
  await page.goto("/dev/guide#mcp");
  await expect(page.getByTestId("guide-section")).toHaveCount(6);
  await expect(page.getByTestId("guide-checklist").locator("input[type=checkbox]")).toHaveCount(11);
  await expect(page.locator("#mcp")).toBeInViewport();
});

test("바깥 링크는 새 창 + noopener noreferrer", async ({ page }) => {
  await page.goto("/dev/mcp");
  const ext = main(page).locator('a[target="_blank"]');
  expect(await ext.count()).toBeGreaterThan(0);
  for (const rel of await ext.evaluateAll((els) => els.map((e) => e.getAttribute("rel") ?? ""))) {
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  }
});

test("모바일에서 가로로 넘치지 않는다(표는 자기 상자 안에서만 스크롤)", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of ["/dev", "/dev/harness", "/dev/skills", "/dev/mcp", "/dev/guide"]) {
    await page.goto(path);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, path).toBeLessThanOrEqual(1);
  }
});
/* Footer: tests/e2e/dev.spec.ts */
