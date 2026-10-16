/* ---------------------------------------------------------------------------
 * Header: 개발자 섹션(/dev) 데이터 규칙 — SPEC 23.24.
 *
 * 데이터가 코드에 있으므로 손으로 고치다 생기는 실수를 테스트로 막는다:
 * 중복 slug(같은 앵커가 두 개), http 링크, 빠진 지원 칸, 예시에 섞인 진짜 키,
 * 다른 페이지가 링크하는 가이드 앵커가 사라지는 것.
 * ------------------------------------------------------------------------- */
import { describe, expect, it } from "vitest";
import { DEV_CHECKED_AT, HARNESSES, STANDARDS } from "@/lib/dev/harnesses";
import { SKILLS } from "@/lib/dev/skills";
import { MCP_REGISTRY, MCP_SERVERS } from "@/lib/dev/mcp";
import { GUIDE_SECTIONS, STARTER_CHECKLIST } from "@/lib/dev/guide";
import { HARNESS_FEATURES } from "@/lib/dev/types";

const SUPPORTS = new Set(["yes", "partial", "no", "unknown"]);
/** 실제 토큰처럼 생긴 문자열. 예시는 ${VAR} 자리표시자만 써야 한다. */
const SECRET_LIKE = [/ghp_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/, /\bsk-[A-Za-z0-9]{20,}/, /\bsk_live_[A-Za-z0-9]+/, /AKIA[0-9A-Z]{16}/];

function unique(xs: string[]) {
  return new Set(xs).size === xs.length;
}

const allSnippets = [
  ...HARNESSES.map((h) => h.install),
  ...SKILLS.flatMap((s) => s.install.map((c) => c.code)),
  ...MCP_SERVERS.flatMap((m) => m.install.map((c) => c.code)),
  ...GUIDE_SECTIONS.flatMap((g) => g.snippets.map((c) => c.code)),
];

describe("개발자 섹션 데이터", () => {
  it("확인 날짜는 YYYY-MM-DD", () => {
    expect(DEV_CHECKED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("slug는 목록마다 겹치지 않고 앵커로 쓸 수 있는 모양이다", () => {
    for (const list of [HARNESSES, SKILLS, MCP_SERVERS]) {
      const slugs = list.map((x) => x.slug);
      expect(unique(slugs)).toBe(true);
      for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("바깥 링크는 전부 https", () => {
    const urls = [
      ...HARNESSES.map((h) => h.docs),
      ...SKILLS.map((s) => s.url),
      ...MCP_SERVERS.map((m) => m.docs),
      ...STANDARDS.map((s) => s.url),
      MCP_REGISTRY.url,
    ];
    for (const u of urls) expect(new URL(u).protocol).toBe("https:");
  });

  it("하네스는 모든 기능 칸을 정해진 값으로 채운다", () => {
    for (const h of HARNESSES) {
      expect(Object.keys(h.support).sort()).toEqual([...HARNESS_FEATURES].sort());
      for (const f of HARNESS_FEATURES) expect(SUPPORTS.has(h.support[f])).toBe(true);
      expect(h.install.trim()).not.toBe("");
      expect(h.caution.trim()).not.toBe("");
    }
  });

  it("스킬·MCP는 설치 명령과 주의사항을 반드시 가진다", () => {
    for (const s of SKILLS) {
      expect(s.install.length).toBeGreaterThan(0);
      expect(unique(s.install.map((c) => c.label))).toBe(true);
      expect(s.caution.trim()).not.toBe("");
    }
    for (const m of MCP_SERVERS) {
      expect(m.install.length).toBeGreaterThan(0);
      expect(unique(m.install.map((c) => c.label))).toBe(true);
      expect(m.security.trim()).not.toBe("");
    }
  });

  it("예시 코드에 진짜 키처럼 생긴 값이 없다", () => {
    for (const code of allSnippets) {
      for (const re of SECRET_LIKE) expect(code).not.toMatch(re);
    }
  });

  it("다른 페이지가 링크하는 가이드 앵커가 있다", () => {
    const ids = GUIDE_SECTIONS.map((g) => g.id);
    expect(unique(ids)).toBe(true);
    for (const id of ["context", "skills", "mcp", "hooks", "subagents", "permissions"]) {
      expect(ids).toContain(id);
    }
    expect(STARTER_CHECKLIST.length).toBeGreaterThanOrEqual(10);
  });

  it("가이드의 SKILL.md 예시는 스킬 규격(name·description)을 지킨다", () => {
    const skill = GUIDE_SECTIONS.find((g) => g.id === "skills")!.snippets[0].code;
    const name = skill.match(/^name: (.+)$/m)?.[1] ?? "";
    const desc = skill.match(/^description: (.+)$/m)?.[1] ?? "";
    expect(name).toMatch(/^[a-z0-9-]{1,64}$/);
    expect(desc.length).toBeGreaterThan(0);
    expect(desc.length).toBeLessThanOrEqual(1024);
  });
});
/* Footer: tests/dev-data.test.ts */
