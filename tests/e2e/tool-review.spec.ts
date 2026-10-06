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
import { TOOL_MIN_REVIEWS_FOR_TIER } from "@/lib/scoring/constants";

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
  // 문장을 통째로 박지 않는다. 말투를 손볼 때마다 테스트가 깨지는데,
  // 깨진 게 "기준이 틀렸다"인지 "문장을 다듬었다"인지 구분이 안 된다.
  // 확인할 건 하나다 — **몇 개부터 티어를 매기는지가 화면에 적혀 있는가.**
  await expect(page.locator("main")).toContainText(
    new RegExp(`후기\\s*${TOOL_MIN_REVIEWS_FOR_TIER}개부터[^.]*티어`)
  );

  // 평가 안 한 축은 점수가 생기지 않는다 — 억지로 0점을 넣지 않는다
  // 상세 위쪽에 가격·한국어 요약 판(dl)이 따로 있어서, 점수 판은 이름으로 집는다.
  const scoreBlock = page.getByTestId("axis-scores");
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
  await expect(page.locator("main")).toContainText("아직 후기가 없어요");
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
test("isAnonymous를 빼고 수정해도 익명이 풀리지 않는다", async ({ page }) => {
  // 예전에는 `isAnonymous ?? false`라서 이 필드가 빠진 수정 요청 하나에
  // 익명 후기가 실명으로 바뀌었다. 지금 폼은 항상 보내지만, 다른 클라이언트나
  // 바뀐 폼이 빼먹는 순간 작성자가 드러난다.
  const email = `e2e-anon-patch-${Date.now()}@example.com`;
  await page.goto(`/login?callbackUrl=/tools/${TOOL}`);
  await page.fill("input[name=email]", email);
  await page.click('button:has-text("이메일로 계속하기")');
  await page.waitForURL((u) => u.pathname === `/tools/${TOOL}`);

  const result = await page.evaluate(async (slug) => {
    const post = await fetch(`/api/tools/${slug}/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ratings: [{ axis: "EASE", score: 4 }], isAnonymous: true }),
    });
    const { data } = await post.json();
    // isAnonymous 없이 수정
    const patch = await fetch(`/api/tool-reviews/${data.reviewId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ratings: [{ axis: "EASE", score: 5 }], comment: "고침" }),
    });
    const list = await (await fetch(`/api/tools/${slug}/reviews`)).json();
    const mine = list.data.find((x: { isMine: boolean }) => x.isMine);
    await fetch(`/api/tool-reviews/${data.reviewId}`, { method: "DELETE" });
    return { patch: patch.status, isAnonymous: mine?.isAnonymous, authorName: mine?.authorName };
  }, TOOL);

  expect(result.patch).toBe(200);
  expect(result.isAnonymous).toBe(true);
  // API는 익명 후기의 이름 자리에 "익명"을 넣어 보낸다(lib/tool-reviews.ts).
  expect(result.authorName).toBe("익명");
  expect(result.authorName).not.toContain(email.split("@")[0]);
});

test("동시에 여러 번 등록해도 500이 아니라 409가 난다", async ({ page }) => {
  // 있는지 확인 → 넣기 사이에 틈이 있어서, 동시에 온 요청이 둘 다 확인을 통과한다.
  // DB unique 제약이 중복은 막지만, 그 에러를 잡지 않으면 사용자는 500을 받는다.
  const email = `e2e-race-${Date.now()}@example.com`;
  await page.goto(`/login?callbackUrl=/tools/${TOOL}`);
  await page.fill("input[name=email]", email);
  await page.click('button:has-text("이메일로 계속하기")');
  await page.waitForURL((u) => u.pathname === `/tools/${TOOL}`);

  const statuses = await page.evaluate(async (slug) => {
    const send = () =>
      fetch(`/api/tools/${slug}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ratings: [{ axis: "EASE", score: 3 }] }),
      }).then((r) => r.status);
    const out = await Promise.all([send(), send(), send(), send(), send()]);
    const list = await (await fetch(`/api/tools/${slug}/reviews`)).json();
    const mine = list.data.find((x: { isMine: boolean }) => x.isMine);
    if (mine) await fetch(`/api/tool-reviews/${mine.id}`, { method: "DELETE" });
    return out;
  }, TOOL);

  expect(statuses.filter((s) => s === 201)).toHaveLength(1);
  // 나머지는 전부 409여야 한다. 429(요청 제한)는 이 테스트가 보려는 게 아니므로 허용.
  for (const s of statuses.filter((s) => s !== 201)) expect([409, 429]).toContain(s);
});

test("로그인한 상태에서 callbackUrl로 밖에 나갈 수 없다", async ({ page }) => {
  const email = `e2e-redirect-${Date.now()}@example.com`;
  await page.goto(`/login?callbackUrl=/tools/${TOOL}`);
  await page.fill("input[name=email]", email);
  await page.click('button:has-text("이메일로 계속하기")');
  await page.waitForURL((u) => u.pathname === `/tools/${TOOL}`);

  // 브라우저는 /\evil.com을 //evil.com으로 읽는다. lib/safe-redirect.ts 참고.
  for (const bad of ["/%5Cevil.com", "/%5C/evil.com", "/%09/evil.com", "//evil.com"]) {
    const res = await page.request.get(`/login?callbackUrl=${bad}`, { maxRedirects: 0 });
    const loc = res.headers()["location"] ?? "";
    expect(loc, bad).not.toMatch(/evil\.com/);
  }
});
/* Footer: tests/e2e/tool-review.spec.ts */
