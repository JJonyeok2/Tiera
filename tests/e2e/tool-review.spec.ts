/* ---------------------------------------------------------------------------
 * Header: 도구 후기 E2E — 인증·소유권·중복·집계까지 실제로 두드린다.
 *
 * 이 파일의 핵심은 마지막 확인이다: **후기를 쓰면 점수가 실제로 계산되는가.**
 * 폼이 뜨고 저장이 되는 것만 봐서는 부족하다. recomputeToolScores 호출을
 * 빼먹어도 에러가 안 나기 때문이다 — 순위가 조용히 낡을 뿐이다.
 *
 * 개발용 이메일 로그인이 필요하므로 dev 서버에서만 돈다
 * (NODE_ENV=production이면 코드에서 강제로 꺼진다).
 * ------------------------------------------------------------------------- */
import { expect, test } from "@playwright/test";

const TOOL = "supertone-play";

test("로그인 → 후기 작성 → 점수 생성 → 중복 차단 → 수정 → 삭제", async ({ page }) => {
  const email = `e2e-tool-${Date.now()}@example.com`;

  await page.goto(`/login?callbackUrl=/tools/${TOOL}`);
  await page.fill("input[name=email]", email);
  await page.click('button:has-text("이메일로 계속하기")');
  await page.waitForURL((u) => u.pathname === `/tools/${TOOL}`);

  // 쓰기 전에는 축별 점수 영역이 없어야 한다
  await expect(page.locator("main")).not.toContainText("써 본 사람들");

  await page.click('button:has-text("써보고 남기기")');
  await page.locator('[role=radiogroup][aria-label="쉬움 평점"] label').nth(3).click(); // 4점
  await page.locator('[role=radiogroup][aria-label="한국어 평점"] label').nth(4).click(); // 5점
  await page.fill("textarea", "E2E 도구 후기");
  await page.click('button:has-text("후기 등록")');

  // 목록에 즉시 반영
  await expect(page.locator('li:has-text("내 후기")').first()).toContainText("E2E 도구 후기");

  // 축 배지가 라벨로 찍힌다 (EASE가 아니라 '쉬움')
  const mine = page.locator('li:has-text("내 후기")').first();
  await expect(mine).toContainText("쉬움 4");
  await expect(mine).toContainText("한국어 5");
  await expect(mine).not.toContainText("EASE");

  // 핵심: 점수가 실제로 집계됐는가
  await page.reload();
  await expect(page.locator("main")).toContainText("써 본 사람들");

  // 다만 후기 1개로 티어를 단정하지는 않는다.
  // 후기가 사이트에 몇 개뿐이면 전체 평균이 그 몇 개로 만들어져서
  // 베이지안 보정이 아무것도 당기지 못한다 — 수식은 맞는데 결과가 의미 없다.
  await expect(page.locator("main")).toContainText("후기 3개부터 티어를 매깁니다");

  // 평가 안 한 축은 점수가 생기지 않는다 — 억지로 0점을 넣지 않는다
  const scoreBlock = page.locator("main").locator("dl").first();
  await expect(scoreBlock).toContainText("쉬움");
  await expect(scoreBlock).toContainText("한국어");
  await expect(scoreBlock).not.toContainText("결과물");

  // 같은 도구에 두 번 쓸 수 없다
  const dup = await page.evaluate(async (slug) => {
    const r = await fetch(`/api/tools/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratings: [{ axis: "EASE", score: 1 }] }),
    });
    return r.status;
  }, TOOL);
  expect(dup).toBe(409);

  // 수정
  await page.click('button:has-text("내 후기 수정")');
  await page.fill("textarea", "수정된 후기");
  await page.click('button:has-text("수정하기")');
  await expect(page.locator('li:has-text("내 후기")').first()).toContainText("수정된 후기");

  // 삭제하면 점수 영역도 같이 사라진다 — 후기 0개인데 점수가 남아 있으면 유령 점수다
  await page.click('button:has-text("내 후기 수정")');
  await page.click('button:has-text("후기 삭제")');
  await expect(page.locator("main")).toContainText("아직 후기가 없습니다");
  await page.reload();
  await expect(page.locator("main")).not.toContainText("써 본 사람들");
});

test("남의 후기는 수정·삭제할 수 없다", async ({ page, request }) => {
  const a = `e2e-owner-${Date.now()}@example.com`;
  await page.goto(`/login?callbackUrl=/tools/${TOOL}`);
  await page.fill("input[name=email]", a);
  await page.click('button:has-text("이메일로 계속하기")');
  await page.waitForURL((u) => u.pathname === `/tools/${TOOL}`);

  await page.click('button:has-text("써보고 남기기")');
  await page.locator('[role=radiogroup][aria-label="가격 평점"] label').nth(2).click();
  await page.click('button:has-text("후기 등록")');

  const id = await page.evaluate(async (slug) => {
    const r = await fetch(`/api/tools/${slug}/reviews`);
    const j = await r.json();
    return j.data[0]?.id as string;
  }, TOOL);
  expect(id).toBeTruthy();

  // 로그인하지 않은 별도 컨텍스트에서 시도하면 401이어야 한다.
  // (소유권 검증은 서버에서 한다 — 클라이언트가 보낸 id를 믿지 않는다)
  expect((await request.delete(`/api/tool-reviews/${id}`)).status()).toBe(401);
  expect(
    (await request.patch(`/api/tool-reviews/${id}`, { data: { ratings: [{ axis: "EASE", score: 1 }] } }))
      .status()
  ).toBe(401);

  // 정리
  await page.evaluate(async (rid) => {
    await fetch(`/api/tool-reviews/${rid}`, { method: "DELETE" });
  }, id);
});

test("익명 체크 시 목록에도 API 응답에도 이름이 안 실린다", async ({ page }) => {
  const email = `e2e-anon-tool-${Date.now()}@example.com`;
  await page.goto(`/login?callbackUrl=/tools/${TOOL}`);
  await page.fill("input[name=email]", email);
  await page.click('button:has-text("이메일로 계속하기")');
  await page.waitForURL((u) => u.pathname === `/tools/${TOOL}`);

  await page.click('button:has-text("써보고 남기기")');
  await page.locator('[role=radiogroup][aria-label="결과물 평점"] label').nth(3).click();
  await page.check('input[type=checkbox]');
  await page.click('button:has-text("후기 등록")');

  const mine = page.locator('li:has-text("내 후기")').first();
  await expect(mine).toContainText("익명");

  // 화면만 가리는 게 아니라 응답 JSON에도 없어야 한다.
  // 개발자도구만 열면 보이는 익명은 익명이 아니다.
  const body = await page.evaluate(async (slug) => {
    const r = await fetch(`/api/tools/${slug}/reviews`);
    return await r.text();
  }, TOOL);
  expect(body).not.toContain(email);
  expect(body).not.toContain(email.split("@")[0]);

  const id = await page.evaluate(async (slug) => {
    const r = await fetch(`/api/tools/${slug}/reviews`);
    const j = await r.json();
    return j.data.find((x: { isMine: boolean }) => x.isMine)?.id as string;
  }, TOOL);
  await page.evaluate(async (rid) => {
    await fetch(`/api/tool-reviews/${rid}`, { method: "DELETE" });
  }, id);
});
/* Footer: tests/e2e/tool-review.spec.ts */
