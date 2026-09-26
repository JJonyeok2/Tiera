/* ---------------------------------------------------------------------------
 * Header: unique 위반 판별 — Drizzle이 pg 에러를 감싸는 모양이 바뀌어도
 * 동시 등록이 500으로 새지 않게 붙잡아 둔다.
 * ------------------------------------------------------------------------- */
import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "@/lib/db-errors";

describe("isUniqueViolation", () => {
  it("pg 에러를 그대로 받아도 알아본다", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("Drizzle이 cause로 한 겹 감싼 것도 알아본다", () => {
    const e = Object.assign(new Error("Failed query"), { cause: { code: "23505" } });
    expect(isUniqueViolation(e)).toBe(true);
  });

  it("두 겹까지 감싸도 알아본다", () => {
    expect(isUniqueViolation({ cause: { cause: { code: "23505" } } })).toBe(true);
  });

  it("다른 DB 에러는 unique 위반으로 보지 않는다", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false); // FK 위반
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("23505")).toBe(false);
  });
});
/* Footer: tests/db-errors.test.ts */
