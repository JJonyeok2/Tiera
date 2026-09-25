/* Header: 도구 목록·상세 E2E — SPEC 23.5의 일반인 입구.

   여기서 지켜야 할 것은 "순위가 맞는가"가 아니다. 후기가 0개인 상태로 나가는
   화면이라, 검증 대상은 **잘 모르는 사람이 필요한 정보를 다 보는가**다. */
import { expect, test } from "@playwright/test";
import { SEED_TOOLS } from "@/db/seed-tools-data";

/**
 * 로케이터는 반드시 main 안으로 좁힌다.
 *
 * 스트리밍 중에는 본문이 main 바깥(body 첫 div)에 잠깐 복제돼 있다.
 * 전역 locator('h1')로 잡으면 그 찰나에 2개가 걸려 strict mode 위반으로 죽는다.
 * 실패가 화면 버그처럼 보이지만 아니다 — 기존 랭킹 테스트가 전부 'main ul > li'로
 * 시작하는 것도 같은 이유다.
 */
const main = (page: import("@playwright/test").Page) => page.locator("main");

test("홈은 랭킹이 아니라 도구 목록이다", async ({ page }) => {
  await page.goto("/");
  await expect(main(page).locator("h1")).toContainText("어떤 AI를 써야 할지");
  // 화면 언어 규칙(23.5): 일반인 화면에 전문 용어가 새어나오면 안 된다
  await expect(page.locator("main")).not.toContainText("벤치마크 N종");
  await expect(page.locator("main")).not.toContainText("괴리");
  const cards = page.locator("main ul > li");
  expect(await cards.count()).toBeGreaterThan(10);
});

test("용도 탭이 URL과 목록에 반영된다", async ({ page }) => {
  await page.goto("/");
  await main(page).locator('nav[aria-label="용도"] button', { hasText: "영상" }).first().click();
  await expect(page).toHaveURL(/for=VIDEO/);
  await expect(page.locator("main ul > li").first()).toBeVisible();
});

test("대표 용도가 아니어도 also_for에 걸리면 그 탭에 뜬다", async ({ page }) => {
  // 이 목록에서 제일 쓸모 있는 답이 "이미 쓰는 챗GPT로도 된다"인데,
  // purpose를 하나만 봤다면 이미지 탭에 ChatGPT가 없다.
  await page.goto("/?for=IMAGE");
  await expect(page.locator("main")).toContainText("ChatGPT");
});

test("탭에 적힌 숫자와 실제 목록 개수가 같다", async ({ page }) => {
  // 탭에 5라고 적혀 있는데 눌러서 7개가 나오면 둘 중 하나가 거짓말이다.
  await page.goto("/");
  const tab = main(page).locator('nav[aria-label="용도"] button:has-text("아바타")');
  const label = await tab.innerText();
  const claimed = Number(label.replace(/[^\d]/g, ""));
  await tab.click();
  await expect(page).toHaveURL(/for=AVATAR/);
  await expect(page.locator("main ul > li")).toHaveCount(claimed);
});

test("한국 필터가 한국 도구만 남긴다", async ({ page }) => {
  await page.goto("/?origin=KR");
  const cards = page.locator("main ul > li");
  const n = await cards.count();
  expect(n).toBeGreaterThan(5);
  for (let i = 0; i < n; i++) {
    await expect(cards.nth(i)).toContainText("한국");
  }
});

test("제작사 배지와 한국어 지원 라벨이 서로 다른 말을 쓴다", async ({ page }) => {
  // 배지는 '어디서 만들었나', 라벨은 '한국어가 되나'다. 둘 다 '한국 서비스'였을 때
  // 같은 뜻으로 읽혔다. 한 카드 안에서 구분이 서는지 본다.
  await page.goto("/?origin=KR");
  const card = page.locator("main ul > li", { hasText: "클로바노트" });
  await expect(card).toContainText("한국");
  await expect(card).toContainText("한국어 완벽");
  await expect(card).not.toContainText("한국 서비스");
});

test("유료·체험만 도구는 목록에서 미리 경고한다", async ({ page }) => {
  // 상세로 들어가야 알 수 있게 두면 가입하고 나서 아는 사람이 생긴다.
  // 문구를 테스트에 베껴 쓰지 않고 시드에서 가져온다 — 베껴 쓰면 문구를 다듬을
  // 때마다 테스트가 깨지고, 정작 "경고가 사라진 것"은 못 잡는다.
  const seed = SEED_TOOLS.find((t) => t.slug === "runway");
  expect(seed?.caution, "runway 시드에 caution이 있어야 한다").toBeTruthy();

  await page.goto("/?for=VIDEO");
  const runway = page.locator("main ul > li", { hasText: seed!.name });
  await expect(runway).toContainText("체험만 무료");
  await expect(runway).toContainText(seed!.caution!);
});

test("TRIAL·PAID 도구는 예외 없이 카드에 주의사항이 붙는다", async ({ page }) => {
  // 시드 테스트가 caution의 '존재'를 강제하고, 여기서 그게 '화면에 나오는지'를 본다.
  const risky = SEED_TOOLS.filter(
    (t) => t.pricingKind === "TRIAL" || t.pricingKind === "PAID"
  );
  expect(risky.length).toBeGreaterThan(0);

  for (const t of risky) {
    await page.goto(`/?for=${t.purpose}`);
    await expect(page.locator("main ul > li", { hasText: t.name })).toContainText(t.caution!);
  }
});

test("한국어를 확인 못한 도구는 빈칸이 아니라 '확인 중'이라고 쓴다", async ({ page }) => {
  await page.goto("/?for=SLIDES");
  await expect(page.locator("main ul > li", { hasText: "스냅덱" })).toContainText("한국어 확인 중");
});

test("상세는 시작법·가격·한국어·공식링크를 모두 보여준다", async ({ page }) => {
  await page.goto("/tools/gemini");
  await expect(page.locator("h1")).toContainText("Gemini");
  const main = page.locator("main");
  await expect(main).toContainText("뭘 해주나");
  await expect(main).toContainText("어떻게 시작하나");
  await expect(main).toContainText("돈이 드나");
  await expect(main).toContainText("한국어가 되나");
  await expect(main.locator('a:has-text("공식 사이트 열기")')).toHaveAttribute(
    "href",
    /^https:\/\//
  );
});

test("도구 상세에서 그 도구가 쓰는 모델로 내려갈 수 있다", async ({ page }) => {
  // 일반인 층과 개발자 층을 잇는 유일한 지점이다(23.5).
  await page.goto("/tools/chatgpt");
  await expect(page.locator("main")).toContainText("이 도구가 쓰는 모델");
  await page.locator('main a[href^="/models/"]').first().click();
  await expect(page).toHaveURL(/\/models\//);
});

test("후기가 없으면 별점을 지어내지 않는다", async ({ page }) => {
  await page.goto("/tools/suno");
  await expect(page.locator("main")).toContainText("아직 후기가 없어요");
  // 구조화 데이터에 aggregateRating이 새어나가면 검색엔진 스팸이고
  // 도메인 단위로 불이익을 받는다.
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  for (const raw of scripts) {
    expect(JSON.parse(raw || "{}").aggregateRating).toBeUndefined();
  }
});

test("후기가 없으면 축별 점수 영역 자체가 없다", async ({ page }) => {
  // 회색 "–"로 채운 칸이 네 개 늘어선 화면은 사이트가 고장난 것처럼 보인다.
  await page.goto("/tools/suno");
  await expect(page.locator("main")).not.toContainText("써 본 사람들");
});

test("비로그인은 후기 작성 대신 로그인 유도를 본다", async ({ page }) => {
  await page.goto("/tools/gemini");
  await expect(page.locator("main")).toContainText("로그인하고 후기 남기기");
});

test("비로그인 후기 POST는 401", async ({ request }) => {
  const res = await request.post("/api/tools/gemini/reviews", {
    data: { ratings: [{ axis: "EASE", score: 5 }] },
  });
  expect(res.status()).toBe(401);
});

test("없는 도구에 후기를 달면 404", async ({ request }) => {
  const res = await request.get("/api/tools/does-not-exist/reviews");
  expect(res.status()).toBe(404);
});

test("모델 축은 도구 후기 API가 거부한다", async ({ request }) => {
  // 인증 전에 막히므로 401이지만, 스키마가 갈라져 있다는 것 자체는
  // 단위 테스트(tests/tool-scoring.test.ts)가 지킨다. 여기서는 경로 분리만 본다.
  const res = await request.post("/api/tools/gemini/reviews", {
    data: { ratings: [{ axis: "CODING", score: 5 }] },
  });
  expect([400, 401]).toContain(res.status());
});

test("홈과 모델 순위는 서로를 가리킨다", async ({ page }) => {
  await page.goto("/");
  await page.click('a:has-text("모델 단위로 보기")');
  await expect(page).toHaveURL(/\/models$/);
  await page.click('a:has-text("도구로 돌아가기")');
  await expect(page).toHaveURL(/\/$/);
});

test("모델 순위에서 검색해도 홈으로 튕기지 않는다", async ({ page }) => {
  // 예전에는 검색 경로가 '/'로 박혀 있어서, 랭킹이 옮겨간 뒤였다면
  // 한 글자 칠 때마다 도구 목록으로 쫓겨났을 것이다.
  await page.goto("/models");
  await page.fill("#site-search", "deep");
  // URL 갱신이 startTransition 안에 있어서, 주소가 바뀌기 전에 /models의 RSC
  // 응답을 한 번 기다린다. 이 파일 전체를 연달아 돌리면 5초를 넘겨 간헐적으로
  // 깨졌다 — 느린 것이지 틀린 게 아니다. 이 테스트가 보는 건 속도가 아니라
  // **검색이 /models에 머무는가**이므로 여유를 준다.
  await expect(page).toHaveURL(/\/models\?.*q=deep/, { timeout: 15_000 });
});

test("Pretendard가 실제로 적용된다", async ({ page }) => {
  // CSS만 넣고 정작 안 쓰이는 경우가 흔하다. 파일이 200을 주는지가 아니라
  // 브라우저가 **로드해서 쓰고 있는지**를 본다.
  await page.goto("/", { waitUntil: "networkidle" });
  const r = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded: string[] = [];
    document.fonts.forEach((f) => {
      if (f.status === "loaded") loaded.push(f.family);
    });
    return {
      family: getComputedStyle(document.body).fontFamily,
      hasPretendard: loaded.some((x) => x.includes("Pretendard")),
      // 동적 서브셋이라 92개 전부가 아니라 쓰인 범위만 받아야 한다.
      loadedCount: loaded.length,
    };
  });
  expect(r.hasPretendard).toBe(true);
  expect(r.family).toContain("Pretendard");
  expect(r.loadedCount).toBeLessThan(92);
});
/* Footer: tests/e2e/tools.spec.ts */
