/* Header: LMArena 어댑터 단위 테스트 — 이름 정규화와 변형 통합.

   네트워크를 타지 않는다. 이름 규칙이 서로 다른 두 출처를 붙이는 지점이라
   여기서 과하게 깎으면 서로 다른 모델이 같은 키가 되고(오매칭),
   덜 깎으면 같은 모델을 놓친다. 경계를 테스트로 못 박아 둔다. */
import { describe, expect, it } from "vitest";
import { arenaKey, looseKey, transformArena, type ArenaRow } from "@/lib/data-sources/lmarena";

function row(p: Partial<ArenaRow> & { model_name: string }): ArenaRow {
  return {
    organization: "anthropic",
    license: "Proprietary",
    rating: 1500,
    vote_count: 1000,
    rank: 1,
    category: "overall",
    ...p,
  };
}

describe("arenaKey", () => {
  it("추론 강도 접미사를 뗀다", () => {
    expect(arenaKey("claude-opus-5-max")).toBe("claude-opus-5");
    expect(arenaKey("claude-opus-5-high")).toBe("claude-opus-5");
    expect(arenaKey("gpt-5-6-sol-low")).toBe("gpt-5-6-sol");
  });

  it("접미사가 여러 개 붙어도 모두 뗀다", () => {
    expect(arenaKey("gemini-3-1-pro-preview-high")).toBe("gemini-3-1-pro");
  });

  it("날짜 접미사를 뗀다", () => {
    expect(arenaKey("claude-opus-5-20250219")).toBe("claude-opus-5");
    expect(arenaKey("claude-opus-5-2025-02-19")).toBe("claude-opus-5");
  });

  it("점과 공백을 우리 슬러그와 같은 형태로 바꾼다", () => {
    // 우리 슬러그는 AA 이름에서 만들어진다: "Gemini 3.1 Pro" → gemini-3-1-pro
    expect(arenaKey("Gemini 3.1 Pro")).toBe("gemini-3-1-pro");
    expect(arenaKey("gemini-3.1-pro")).toBe("gemini-3-1-pro");
  });

  it("모델 이름의 일부인 단어는 지우지 않는다", () => {
    // 'chat'이 접미사가 아니라 이름 가운데 있으면 남아야 한다
    expect(arenaKey("chatglm-4")).toBe("chatglm-4");
    // 버전 숫자는 날짜가 아니므로 남는다
    expect(arenaKey("glm-5-3")).toBe("glm-5-3");
  });

  it("서로 다른 모델이 같은 키가 되지 않는다", () => {
    expect(arenaKey("gpt-4-1")).not.toBe(arenaKey("gpt-4-5"));
    expect(looseKey("gpt-4-1")).not.toBe(looseKey("gpt-4-5"));
  });
});

describe("transformArena", () => {
  it("요청한 카테고리만 남긴다", () => {
    const out = transformArena(
      [row({ model_name: "a", category: "overall" }), row({ model_name: "b", category: "coding" })],
      "OVERALL",
      "overall"
    );
    expect(out.map((e) => e.rawName)).toEqual(["a"]);
  });

  it("같은 모델의 변형은 투표 수가 가장 많은 쪽을 남긴다", () => {
    // 레이팅이 높은 쪽을 고르면 표본 10표짜리 실험 변형이 대표가 되어버린다.
    const out = transformArena(
      [
        row({ model_name: "claude-opus-5-high", rating: 1520, vote_count: 10 }),
        row({ model_name: "claude-opus-5", rating: 1500, vote_count: 70000 }),
      ],
      "OVERALL",
      "overall"
    );
    expect(out).toHaveLength(1);
    expect(out[0].voteCount).toBe(70000);
    expect(out[0].rating).toBe(1500);
  });

  it("표본이 없는 행은 버린다", () => {
    const out = transformArena([row({ model_name: "x", vote_count: 0 })], "OVERALL", "overall");
    expect(out).toHaveLength(0);
  });

  it("레이팅이 숫자가 아니면 버린다", () => {
    const bad = { ...row({ model_name: "y" }), rating: NaN };
    expect(transformArena([bad], "OVERALL", "overall")).toHaveLength(0);
  });

  it("레이팅 내림차순으로 돌려준다", () => {
    const out = transformArena(
      [
        row({ model_name: "low", rating: 1200 }),
        row({ model_name: "high", rating: 1500 }),
        row({ model_name: "mid", rating: 1350 }),
      ],
      "OVERALL",
      "overall"
    );
    expect(out.map((e) => e.rawName)).toEqual(["high", "mid", "low"]);
  });
});
/* Footer: tests/lmarena.test.ts */
