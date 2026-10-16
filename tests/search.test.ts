/* ---------------------------------------------------------------------------
 * Header: 하려는 일로 찾는 검색 — lib/search.ts. SPEC 23.22.
 *
 * 사람들이 실제로 치는 말이 맞는 용도로 가는지, 그리고 너무 넓게 걸리지 않는지 본다.
 * ------------------------------------------------------------------------- */
import { describe, expect, it } from "vitest";
import { PURPOSE_KEYWORDS, purposesForQuery } from "@/lib/search";
import { toolPurposeEnum } from "@/db/schema";

describe("purposesForQuery", () => {
  it.each([
    ["ppt", "SLIDES"],
    ["PPT", "SLIDES"],
    ["영상편집", "VIDEO"],
    ["영상 편집", "VIDEO"],
    ["회의록", "NOTE"],
    ["번역", "TRANSLATE"],
    ["포트폴리오", "WEBSITE"],
    ["노래", "AUDIO"],
    ["논문", "RESEARCH"],
    ["코딩", "CODE"],
  ])("'%s' → %s", (q, purpose) => {
    expect(purposesForQuery(q)).toContain(purpose);
  });

  it("도구 이름이나 빈 검색어는 용도로 걸지 않는다", () => {
    expect(purposesForQuery("감마")).toEqual([]);
    expect(purposesForQuery("")).toEqual([]);
    expect(purposesForQuery("   ")).toEqual([]);
    expect(purposesForQuery(undefined)).toEqual([]);
  });

  it("한 글자·흔한 말은 모든 용도에 걸리지 않는다", () => {
    // 한 글자는 키워드 안쪽 일치를 보지 않는다 — 안 그러면 "영"이 영상·영어 둘 다에 걸린다.
    expect(purposesForQuery("영")).toEqual([]);
    expect(purposesForQuery("ai").length).toBeLessThan(2);
  });

  it("모든 용도에 키워드가 있다", () => {
    for (const p of toolPurposeEnum.enumValues) {
      expect(PURPOSE_KEYWORDS[p].length, p).toBeGreaterThan(0);
    }
  });
});
/* Footer: tests/search.test.ts */
