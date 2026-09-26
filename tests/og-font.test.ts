/* ---------------------------------------------------------------------------
 * Header: OG 이미지 문구와 잘라낸 글꼴이 맞는지.
 *
 * lib/og-copy.ts의 문구를 바꾸고 글꼴을 다시 안 자르면, 새로 들어간 글자만
 * 공유 미리보기에서 네모(□)로 나온다. 화면에서는 멀쩡해 보여서 아무도 모른다.
 * ------------------------------------------------------------------------- */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OG_BOLD_TEXT, OG_MEDIUM_TEXT } from "@/lib/og-copy";

const chars = JSON.parse(
  readFileSync(join(process.cwd(), "assets/og/chars.json"), "utf-8")
) as Record<"Bold" | "Medium", string>;

function missing(text: string, have: string): string[] {
  const set = new Set(have);
  return [...new Set(text)].filter((c) => !set.has(c));
}

describe("OG 글꼴", () => {
  it.each([
    ["Bold", OG_BOLD_TEXT],
    ["Medium", OG_MEDIUM_TEXT],
  ] as const)("%s 글꼴에 문구의 모든 글자가 들어 있다", (weight, text) => {
    const lack = missing(text, chars[weight]);
    expect(
      lack,
      `빠진 글자: ${lack.join("")} — python3 scripts/subset-og-font.py <Pretendard OTF 폴더> 로 다시 자르세요`
    ).toEqual([]);
  });
});
/* Footer: tests/og-font.test.ts */
