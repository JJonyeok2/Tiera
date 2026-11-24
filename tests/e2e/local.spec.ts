/* Header: /local E2E — 그래픽카드 등급 목록·등급 페이지·모델 상세 역방향. SPEC 25 */
import { expect, test } from "@playwright/test";

test("등급 목록에서 카드 이름으로 등급 페이지를 찾는다", async ({ page }) => {
  await page.goto("/local");
  await expect(page.getByTestId("vram-class-card")).toHaveCount(11);
  await page.getByTestId("gpu-finder").fill("3060 ti");
  const hit = page.getByTestId("gpu-finder-results").getByRole("link", { name: /RTX 3060 Ti/ });
  await expect(hit).toHaveAttribute("href", "/local/8gb?gpu=rtx-3060-ti");
  await hit.click();
  await expect(page).toHaveURL(/\/local\/8gb\?gpu=rtx-3060-ti/);
  await expect(page.locator("[data-highlighted]")).toHaveText("RTX 3060 Ti");
});

test("용량 숫자만 넣어도 등급으로 보낸다", async ({ page }) => {
  await page.goto("/local");
  await page.getByTestId("gpu-finder").fill("10");
  // 10GB는 경계라 아래 등급(8GB)으로 간다
  await expect(page.getByTestId("gpu-finder-results").getByRole("link").first()).toHaveAttribute("href", "/local/8gb");
});

test("8GB 대화: 8B급은 들어가고, 실행 명령이 붙는다", async ({ page }) => {
  await page.goto("/local/8gb");
  const fit = page.getByTestId("group-fit");
  await expect(fit.getByRole("heading", { name: "Qwen3 8B" })).toBeVisible();
  await expect(fit.getByText("ollama run qwen3:8b")).toBeVisible();
  // RAM을 모르면 "느리지만 돌아가요"는 내지 않는다
  await expect(page.getByTestId("group-offload")).toHaveCount(0);
  await expect(page.getByTestId("next-class")).toContainText("12GB급");
});

test("에이전트 탭: 컨텍스트가 짧은 모델은 어려워요로 간다", async ({ page }) => {
  await page.goto("/local/32gb?use=agent");
  await expect(page.getByTestId("use-tabs").getByRole("link", { name: "에이전트" })).toHaveAttribute("aria-current", "page");
  const no = page.getByTestId("group-no");
  await no.locator("summary").click();
  const card = no.locator('[data-verdict="short"]').filter({ hasText: "Qwen3 8B" });
  await expect(card).toContainText("최대 40K");
});

test("RAM을 넣으면 느리지만 돌아가는 모델이 열린다", async ({ page }) => {
  await page.goto("/local/8gb");
  await page.getByLabel("시스템 RAM(선택)").fill("32");
  await page.getByRole("button", { name: "반영" }).click();
  await expect(page).toHaveURL(/ram=32/);
  const off = page.getByTestId("group-offload");
  await off.locator("summary").click();
  await expect(off.getByRole("heading", { name: "Qwen3 14B" })).toBeVisible();
});

test("등급 페이지 canonical은 쿼리를 떼어낸 주소다", async ({ page }) => {
  await page.goto("/local/8gb?use=docs&gpu=rtx-4060&ram=16");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/local\/8gb$/);
});

test("없는 등급은 404", async ({ request }) => {
  const res = await request.get("/local/7gb");
  expect(res.status()).toBe(404);
});

test("sitemap에 등급 페이지가 올라간다", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/local/8gb");
  expect(xml).toContain("/local/mac-16gb");
  expect(xml).not.toContain("gpu=");
});
/* Footer: tests/e2e/local.spec.ts */
