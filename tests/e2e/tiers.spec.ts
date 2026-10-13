/* Header: /tiers 티어표 E2E — SPEC 23.20.

   지킬 것: 네 티어 줄이 순서대로 있고, 각 칩이 자기 줄의 점수 구간에 맞으며,
   카테고리·점수 종류가 목록(/models)과 티어표 사이를 오갈 때 유지된다. */
import { expect, test } from "@playwright/test";
import { TIER_CUT } from "@/components/tier/tierTokens";

const main = (page: import("@playwright/test").Page) => page.locator("main");

test("티어표는 프리즘·골드·실버·브론즈 네 줄을 순서대로 보여준다", async ({
  page,
}) => {
  await page.goto("/tiers");
  await expect(main(page).locator("h1")).toHaveText("AI 모델 티어표");
  const rows = main(page).locator("section[data-tier]");
  await expect(rows).toHaveCount(4);
  expect(
    await rows.evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-tier")),
    ),
  ).toEqual(["prism", "gold", "silver", "bronze"]);
});

test("칩은 자기 줄의 점수 구간 안에 있다", async ({ page }) => {
  // 티어는 점수에서 파생된다. 줄과 점수가 어긋나면 둘 중 하나가 거짓말이다.
  await page.goto("/tiers");
  const range: Record<string, [number, number]> = {
    prism: [TIER_CUT.prism, 101],
    gold: [TIER_CUT.gold, TIER_CUT.prism],
    silver: [TIER_CUT.silver, TIER_CUT.gold],
    bronze: [-1, TIER_CUT.silver],
  };
  let seen = 0;
  for (const [tier, [lo, hi]] of Object.entries(range)) {
    const scores = await main(page)
      .locator(`section[data-tier="${tier}"] li a`)
      .evaluateAll((els) =>
        els.map((e) => Number(e.lastElementChild?.textContent)),
      );
    for (const s of scores) {
      expect(s, `${tier} ${s}`).toBeGreaterThanOrEqual(lo);
      expect(s, `${tier} ${s}`).toBeLessThan(hi);
    }
    seen += scores.length;
  }
  expect(seen).toBeGreaterThan(5);
});

test("칩을 누르면 그 모델 상세로 간다", async ({ page }) => {
  await page.goto("/tiers");
  await main(page).locator("section[data-tier] li a").first().click();
  await expect(page).toHaveURL(/\/models\/[^/?]+$/);
});

test("코딩 탭을 누르면 코딩 티어표가 되고, 목록으로 넘어가도 코딩이 유지된다", async ({
  page,
}) => {
  await page.goto("/tiers");
  await main(page).locator('[role=tab]:has-text("코딩")').click();
  await expect(page).toHaveURL(/scope=CODING/);
  await expect(main(page).locator("h1 + p")).toContainText("코딩");

  await main(page)
    .locator('nav[aria-label="보기 방식"] a', { hasText: "순위 목록" })
    .click();
  await expect(page).toHaveURL(/\/models\?scope=CODING/);
  // 목록에서 다시 티어표로.
  await main(page)
    .locator('nav[aria-label="보기 방식"] a', { hasText: "티어표" })
    .click();
  await expect(page).toHaveURL(/\/tiers\?scope=CODING/);
});

test("헤더에서 어디서든 티어표로 갈 수 있다", async ({ page }) => {
  await page.goto("/");
  await page.locator('header a[href="/tiers"]').click();
  await expect(page).toHaveURL(/\/tiers$/);
  await expect(page.locator('header a[href="/tiers"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
});
test("네 티어 모두 색 띠가 보인다(라이트·다크)", async ({ browser }) => {
  // 실버만 색 변수가 CSS에서 빠져 투명해진 적이 있다(tierTokens.ts tierVar 주석).
  for (const colorScheme of ["light", "dark"] as const) {
    const ctx = await browser.newContext({ colorScheme });
    const page = await ctx.newPage();
    await page.goto("/tiers");
    const colors = await page
      .locator("main section[data-tier] > span[aria-hidden]")
      .evaluateAll((els) =>
        els.map((e) => getComputedStyle(e).backgroundColor),
      );
    expect(colors).toHaveLength(4);
    for (const c of colors) expect(c, colorScheme).not.toBe("rgba(0, 0, 0, 0)");
    await ctx.close();
  }
});
/* Footer: tests/e2e/tiers.spec.ts */
