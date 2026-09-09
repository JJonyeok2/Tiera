/* Header: 표시 라벨 단위 테스트 — 익명 처리의 2차 방어선 */
import { describe, expect, it } from "vitest";
import { displayAuthorName } from "@/lib/labels";

describe("displayAuthorName", () => {
  it("익명이 아니면 이름을 그대로 쓴다", () => {
    expect(displayAuthorName({ isAnonymous: false, authorName: "전종혁" })).toBe("전종혁");
  });

  it("익명이면 이름을 쓰지 않는다", () => {
    expect(displayAuthorName({ isAnonymous: true, authorName: null })).toBe("익명");
  });

  it("익명인데 서버가 이름을 내려줘도 무시한다", () => {
    // 쿼리 쪽 익명 처리가 회귀했을 때를 가정한 케이스다.
    // 한 겹만 두면 그날 이름이 그대로 화면에 찍힌다.
    expect(displayAuthorName({ isAnonymous: true, authorName: "전종혁" })).toBe("익명");
  });

  it("이름이 비어 있으면 익명으로 표시한다", () => {
    expect(displayAuthorName({ isAnonymous: false, authorName: "   " })).toBe("익명");
    expect(displayAuthorName({ isAnonymous: false, authorName: null })).toBe("익명");
  });
});
/* Footer: tests/labels.test.ts */
