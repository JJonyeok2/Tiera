/* Header: 사용량 대시보드 단위 테스트 — OpenRouter 파싱·집계, 점유율 창, 코드 데이터 무결성. SPEC 26 */
import { describe, expect, it } from "vitest";
import { aggregateByAuthor, authorOf, parseRankings, type AuthorDay } from "@/lib/data-sources/openrouter";
import { BRANDS, brandKeyForAuthor } from "@/lib/usage/brands";
import { APP_USERS, WEB_SHARE, latestFullWebMonth } from "@/lib/usage/monthly";
import { apiShareWindow } from "@/lib/usage/share";
import { toolUsageLine } from "@/lib/usage/summary";

describe("parseRankings", () => {
  it("문자열 토큰을 숫자로, as_of를 그대로", () => {
    const r = parseRankings({
      data: [{ date: "2026-11-20", model_permaslug: "openai/gpt-6-luna", total_tokens: "123456789012" }],
      meta: { as_of: "2026-11-21T00:10:00Z", version: "v1" },
    });
    expect(r.rows[0].tokens).toBe(123456789012);
    expect(r.asOf).toBe("2026-11-21T00:10:00Z");
  });

  it("모양이 다르면 던진다 — 반쯤 맞는 데이터를 저장하지 않는다", () => {
    expect(() => parseRankings({})).toThrow();
    expect(() => parseRankings({ data: [{ date: "2026-11-20", model_permaslug: "a/b", total_tokens: "x" }] })).toThrow();
    expect(() => parseRankings({ data: [{ date: "20261120", model_permaslug: "a/b", total_tokens: "1" }] })).toThrow();
    expect(() => parseRankings({ data: [{ date: "2026-11-20", total_tokens: "1" }] })).toThrow();
  });
});

describe("aggregateByAuthor", () => {
  it("permaslug 앞부분으로 개발사를 뽑는다", () => {
    expect(authorOf("anthropic/claude-fable-5.2")).toBe("anthropic");
    expect(authorOf("other")).toBe("other");
  });

  it("같은 날 같은 개발사 모델을 합친다", () => {
    const days = aggregateByAuthor([
      { date: "2026-11-20", modelPermaslug: "openai/a", tokens: 10 },
      { date: "2026-11-20", modelPermaslug: "openai/b", tokens: 5 },
      { date: "2026-11-20", modelPermaslug: "google/c", tokens: 7 },
      { date: "2026-11-21", modelPermaslug: "openai/a", tokens: 1 },
      { date: "2026-11-20", modelPermaslug: "other", tokens: 3 },
    ]);
    expect(days.find((d) => d.date === "2026-11-20" && d.author === "openai")?.tokens).toBe(15);
    expect(days.find((d) => d.author === "other")?.tokens).toBe(3);
    expect(days).toHaveLength(4);
  });
});

function week(start: string, n: number, per: Record<string, number>): AuthorDay[] {
  const out: AuthorDay[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const date = d.toISOString().slice(0, 10);
    for (const [author, tokens] of Object.entries(per)) out.push({ date, author, tokens });
  }
  return out;
}

describe("apiShareWindow", () => {
  it("최근 7일 점유율 — 분모에 other를 포함하고, 순위에서는 뺀다", () => {
    const w = apiShareWindow(week("2026-11-14", 7, { deepseek: 50, openai: 30, other: 20 }));
    expect(w?.start).toBe("2026-11-14");
    expect(w?.end).toBe("2026-11-20");
    expect(w?.shares.map((s) => s.brand)).toEqual(["deepseek", "chatgpt"]);
    expect(w?.shares[0].share).toBeCloseTo(50, 6);
    expect(w?.otherShare).toBeCloseTo(20, 6);
  });

  it("7일이 다 차지 않으면 내지 않는다", () => {
    expect(apiShareWindow(week("2026-11-14", 6, { openai: 1 }))).toBeUndefined();
    expect(apiShareWindow([])).toBeUndefined();
  });

  it("직전 7일이 있으면 점유율 변화(%p)를 낸다", () => {
    const days = [
      ...week("2026-11-07", 7, { openai: 40, google: 60 }),
      ...week("2026-11-14", 7, { openai: 50, google: 50 }),
    ];
    const w = apiShareWindow(days)!;
    expect(w.shares.find((s) => s.brand === "chatgpt")?.deltaPt).toBeCloseTo(10, 6);
    expect(w.shares.find((s) => s.brand === "gemini")?.deltaPt).toBeCloseTo(-10, 6);
  });

  it("직전 7일이 비어 있으면 변화를 만들지 않는다", () => {
    const w = apiShareWindow(week("2026-11-14", 7, { openai: 1 }))!;
    expect(w.shares[0].deltaPt).toBeUndefined();
  });

  it("표에 없는 개발사는 기타로 묻지 않고 이름 그대로 둔다", () => {
    expect(brandKeyForAuthor("tencent")).toBe("hunyuan");
    expect(brandKeyForAuthor("brand-new-lab")).toBe("brand-new-lab");
  });
});

describe("코드 데이터", () => {
  it("웹 점유율은 오래된 달부터, 값은 0~100", () => {
    const months = WEB_SHARE.map((m) => m.month);
    expect([...months].sort()).toEqual(months);
    for (const m of WEB_SHARE) {
      for (const v of Object.values(m.share)) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(100);
      }
      expect(m.source.url).toMatch(/^https:\/\//);
    }
  });

  it("7개 사이트가 다 있는 달은 합이 100을 넘지 않는다(나머지는 목록 밖 사이트 몫)", () => {
    for (const m of WEB_SHARE.filter((x) => Object.keys(x.share).length === 7)) {
      const sum = Object.values(m.share).reduce<number>((a, b) => a + (b ?? 0), 0);
      expect(sum, m.month).toBeGreaterThan(95);
      expect(sum, m.month).toBeLessThanOrEqual(100.1);
    }
  });

  it("1등 비교는 7개 사이트가 다 있는 최근 달로만", () => {
    expect(Object.keys(latestFullWebMonth().share)).toHaveLength(7);
  });

  it("점유율의 브랜드 key는 브랜드 표에 있다", () => {
    const keys = new Set(BRANDS.map((b) => b.key));
    for (const m of WEB_SHARE) for (const k of Object.keys(m.share)) expect(keys.has(k), k).toBe(true);
    for (const a of APP_USERS) expect(keys.has(a.brand), a.brand).toBe(true);
  });

  it("국내 앱 수치는 도구 정렬 데이터에서 가져와 많은 순이다", () => {
    expect(APP_USERS[0].brand).toBe("chatgpt");
    for (let i = 1; i < APP_USERS.length; i++) {
      expect(APP_USERS[i - 1].manUsers).toBeGreaterThanOrEqual(APP_USERS[i].manUsers);
    }
  });

  it("도구 상세 한 줄은 브랜드가 있는 도구에만", () => {
    expect(toolUsageLine("claude")).toContain("국내 앱 사용자");
    expect(toolUsageLine("canva")).toBeUndefined();
  });
});
/* Footer: tests/usage.test.ts */
