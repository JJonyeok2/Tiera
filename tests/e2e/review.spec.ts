/* Header: 리뷰 E2E — 인증·소유권·중복·검증. 보안 경로를 실제로 두드려 본다. */
import { expect, test } from "@playwright/test";

const MODEL = "k-exaone-2-0";

test("비로그인 상태에서는 평가 버튼 대신 로그인 유도가 보인다", async ({ page }) => {
  await page.goto(`/models/${MODEL}`);
  await expect(page.locator("main")).toContainText("로그인하고 평가하기");
});

test("비로그인 POST는 401", async ({ request }) => {
  const res = await request.post(`/api/models/${MODEL}/reviews`, {
    data: { ratings: [{ category: "CODING", score: 5 }] },
  });
  expect(res.status()).toBe(401);
});

test("로그인 → 평가 작성 → 목록 반영 → 중복 차단 → 수정 → 삭제", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto(`/login?callbackUrl=/models/${MODEL}`);
  await page.fill("input[name=email]", email);
  await page.click('button:has-text("이메일로 계속하기")');
  await page.waitForURL((u) => u.pathname === `/models/${MODEL}`);

  await page.click('button:has-text("이 모델 평가하기")');
  // 헤더의 테마 토글도 radiogroup이므로 라벨로 정확히 집는다.
  await page.locator('[role=radiogroup][aria-label="코딩 평점"] label').nth(3).click(); // 4점
  await page.locator('[role=radiogroup][aria-label="추론 평점"] label').nth(4).click(); // 5점
  await page.fill("textarea", "E2E 테스트 리뷰");
  await page.click('button:has-text("평가 등록")');

  // 목록에 즉시 반영되어야 한다
  await expect(page.locator('li:has-text("내 평가")').first()).toContainText("E2E 테스트 리뷰");

  // 같은 모델에 두 번 쓸 수 없다
  const dup = await page.evaluate(async (m) => {
    const r = await fetch(`/api/models/${m}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratings: [{ category: "CODING", score: 5 }] }),
    });
    return r.status;
  }, MODEL);
  expect(dup).toBe(409);

  // 잘못된 점수는 400
  const bad = await page.evaluate(async (m) => {
    const r = await fetch(`/api/models/${m}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratings: [{ category: "CODING", score: 9 }] }),
    });
    return r.status;
  }, MODEL);
  expect(bad).toBe(400);

  // 남의 리뷰는 수정할 수 없다
  const forbidden = await page.evaluate(async () => {
    const list = await (await fetch("/api/models/claude-fable-5-1/reviews?limit=1")).json();
    const r = await fetch(`/api/reviews/${list.data[0].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratings: [{ category: "CODING", score: 1 }] }),
    });
    return r.status;
  });
  expect(forbidden).toBe(403);

  // 수정
  await page.reload();
  await page.click('button:has-text("내 평가 수정")');
  await page.fill("textarea", "수정된 리뷰");
  await page.click('button:has-text("수정하기")');
  await expect(page.locator('li:has-text("내 평가")').first()).toContainText("수정된 리뷰");

  // 삭제
  await page.click('button:has-text("내 평가 수정")');
  await page.click('button:has-text("평가 삭제")');
  await expect(page.locator('button:has-text("이 모델 평가하기")')).toBeVisible();
});

test("익명 체크 시 목록에 이름이 안 뜨고 API 응답에도 실리지 않는다", async ({ page }) => {
  const nick = `anon-tester-${Date.now()}`;
  const email = `${nick}@example.com`;

  await page.goto(`/login?callbackUrl=/models/${MODEL}`);
  await page.fill("input[name=email]", email);
  await page.click('button:has-text("이메일로 계속하기")');
  await page.waitForURL((u) => u.pathname === `/models/${MODEL}`);

  await page.click('button:has-text("이 모델 평가하기")');
  await page.locator('[role=radiogroup][aria-label="코딩 평점"] label').nth(3).click();
  await page.fill("textarea", "익명 리뷰 본문");
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("평가 등록")');

  const mine = page.locator('li:has-text("내 평가")').first();
  await expect(mine).toContainText("익명 리뷰 본문");
  // 화면에 이름이 아니라 "익명"이 떠야 한다
  await expect(mine).toContainText("익명");
  await expect(mine).not.toContainText(nick);

  // 핵심: 이름이 응답 JSON 자체에 없어야 한다.
  // UI에서만 가렸다면 여기서 잡힌다 — 개발자도구만 열면 보이는 상태이므로.
  const raw = await page.evaluate(async (m) => {
    const r = await fetch(`/api/models/${m}/reviews?limit=30`);
    return JSON.stringify(await r.json());
  }, MODEL);
  expect(raw).not.toContain(nick);

  // 익명이어도 본인은 수정·삭제할 수 있다
  await page.click('button:has-text("내 평가 수정")');
  await page.click('button:has-text("평가 삭제")');
  await expect(page.locator('button:has-text("이 모델 평가하기")')).toBeVisible();
});

test("크론 스냅샷은 시크릿 없이는 401", async ({ request }) => {
  const res = await request.post("/api/cron/snapshot");
  expect(res.status()).toBe(401);
});
/* Footer: tests/e2e/review.spec.ts */
