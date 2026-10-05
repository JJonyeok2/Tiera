/* ---------------------------------------------------------------------------
 * Header: 라이트/다크 글자 대비가 서로 비슷한지.
 *
 * 2026-10 피드백: "다크가 라이트보다 가독성이 떨어지고 차이가 심하다".
 * 색을 다시 맞추면서 기준을 숫자로 박아 둔다 — 나중에 한쪽 테마만 손보다가
 * 다시 벌어지면 여기서 깨진다. 값은 globals.css에서 직접 읽는다.
 * ------------------------------------------------------------------------- */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf-8");

/** 블록 하나에서 --c-이름: #hex 를 모은다. */
function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--c-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}

const light = tokens(css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)")));
const dark = tokens(css.slice(css.indexOf(':root[data-theme="dark"]')));

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("테마 글자 대비", () => {
  it.each([
    ["text-dim", 7], // 카드 설명처럼 실제로 읽는 문장
    ["text-mute", 4.5], // 작은 보조 글씨 — WCAG AA
  ] as const)("%s는 두 테마 모두 카드 위에서 %s:1 이상", (name, min) => {
    expect(contrast(light[name], light.surface)).toBeGreaterThanOrEqual(min);
    expect(contrast(dark[name], dark.surface)).toBeGreaterThanOrEqual(min);
  });

  it.each(["text-dim", "text-mute"])("%s 대비가 라이트와 다크에서 크게 다르지 않다", (name) => {
    const l = contrast(light[name], light.surface);
    const d = contrast(dark[name], dark.surface);
    expect(Math.abs(l - d), `light ${l.toFixed(2)} / dark ${d.toFixed(2)}`).toBeLessThan(1);
  });

  it("다크 본문은 순백에 가깝지 않다 — 작은 글씨가 번져 보인다", () => {
    // 예전 값 #f0f3f8 on #0d1117 = 17:1. 수치는 높았지만 획이 퍼져 보였다.
    expect(contrast(dark.text, dark.bg)).toBeLessThan(15.5);
  });
});
/* Footer: tests/theme-contrast.test.ts */
