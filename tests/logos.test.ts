/* ---------------------------------------------------------------------------
 * Header: 도구 로고 파일과 시드 데이터가 서로 맞는지.
 *
 * logoUrl은 있는데 파일이 없으면 카드에 깨진 이미지 아이콘이 뜬다 — 첫 글자
 * 타일로 떨어지는 게 아니라. 반대로 파일만 있고 연결이 안 되면 받아 놓고 안 쓰는
 * 셈이다. 둘 다 화면을 보기 전에는 모른다.
 * ------------------------------------------------------------------------- */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SEED_TOOLS } from "@/db/seed-tools-data";

const DIR = join(process.cwd(), "public", "logos");

/** PNG 헤더(IHDR)에서 가로·세로를 읽는다. 이미지 라이브러리를 들이지 않으려고. */
function pngSize(buf: Buffer): { w: number; h: number } | null {
  const sig = buf.subarray(0, 8).toString("hex");
  if (sig !== "89504e470d0a1a0a") return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

describe("도구 로고", () => {
  it("logoUrl이 가리키는 파일이 전부 있다", () => {
    for (const t of SEED_TOOLS) {
      if (!t.logoUrl) continue;
      expect(t.logoUrl, t.slug).toBe(`/logos/${t.slug}.png`);
      expect(existsSync(join(process.cwd(), "public", t.logoUrl)), `${t.slug}: ${t.logoUrl} 없음`).toBe(true);
    }
  });

  it("받아 둔 로고 파일은 전부 어떤 도구에 연결돼 있다", () => {
    const linked = new Set(SEED_TOOLS.filter((t) => t.logoUrl).map((t) => `${t.slug}.png`));
    const files = readdirSync(DIR).filter((f) => f.endsWith(".png"));
    for (const f of files) expect(linked.has(f), `${f}가 시드에 연결되지 않았다`).toBe(true);
  });

  it("전부 96×96 PNG다 — 크롭 스크립트를 거친 파일만 들어온다", () => {
    for (const f of readdirSync(DIR).filter((x) => x.endsWith(".png"))) {
      const size = pngSize(readFileSync(join(DIR, f)));
      expect(size, `${f}: PNG가 아니다`).not.toBeNull();
      expect(size, f).toEqual({ w: 96, h: 96 });
    }
  });
});
/* Footer: tests/logos.test.ts */
