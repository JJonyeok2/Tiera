/* ---------------------------------------------------------------------------
 * Header: 로그인 콜백 주소 검사 — 오픈 리다이렉트 회귀 방지.
 * 여기 적힌 우회는 전부 실제로 브라우저를 밖으로 내보내는 것들이다.
 * ------------------------------------------------------------------------- */
import { describe, expect, it } from "vitest";
import { safeCallback } from "@/lib/safe-redirect";

describe("safeCallback", () => {
  it.each([
    ["/tools/claude", "/tools/claude"],
    ["/models?q=deep", "/models?q=deep"],
    ["/tools/claude#reviews", "/tools/claude#reviews"],
    ["/", "/"],
  ])("내부 경로는 그대로 통과한다: %s", (raw, want) => {
    expect(safeCallback(raw)).toBe(want);
  });

  it.each([
    "//evil.com",
    "/\\evil.com", // 브라우저가 //evil.com으로 읽는다 — 이번에 막은 것
    "/\\/evil.com",
    "/\tevil.com",
    "/%09/evil.com".replace("%09", "\t"),
    "/\n/evil.com",
    "https://evil.com",
    "evil.com",
    "javascript:alert(1)",
    "",
  ])("밖으로 나가는 주소는 /로 바꾼다: %j", (raw) => {
    expect(safeCallback(raw)).toBe("/");
  });

  it("문자열이 아니면 /로 바꾼다", () => {
    expect(safeCallback(undefined)).toBe("/");
    expect(safeCallback(["/tools/claude"])).toBe("/");
  });

  it("비정상적으로 긴 값은 받지 않는다", () => {
    expect(safeCallback("/" + "a".repeat(600))).toBe("/");
  });
});
/* Footer: tests/safe-redirect.test.ts */
