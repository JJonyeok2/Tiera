/* ---------------------------------------------------------------------------
 * Header: 개발자 섹션(/dev) 데이터 타입. SPEC 23.24.
 *
 * 개발자 섹션 내용은 DB가 아니라 코드에 둔다. 하네스·스킬·MCP는 몇십 개뿐이고,
 * 바뀔 때마다 사람이 문서를 다시 확인해야 하는 정보라 리뷰 가능한 diff로 남는 게 낫다.
 * 확인한 날짜(DEV_CHECKED_AT)를 화면에 같이 적는다 — 이 분야는 한 달이면 바뀐다.
 * ------------------------------------------------------------------------- */

/** 지원 여부. "partial"은 일부 환경에서만(예: IDE 확장에서는 안 됨), "unknown"은 문서로 확인 못 함. */
export type Support = "yes" | "partial" | "no" | "unknown";

export const HARNESS_FEATURES = [
  "agentsMd",
  "skills",
  "mcp",
  "hooks",
  "subagents",
  "plan",
  "headless",
] as const;
export type HarnessFeature = (typeof HARNESS_FEATURES)[number];

export const HARNESS_FEATURE_LABEL: Record<HarnessFeature, string> = {
  agentsMd: "AGENTS.md",
  skills: "스킬",
  mcp: "MCP",
  hooks: "훅",
  subagents: "서브에이전트",
  plan: "플랜 모드",
  headless: "CI·헤드리스",
};

export interface Harness {
  slug: string;
  name: string;
  maker: string;
  /** CLI / IDE / IDE 확장 / 클라우드 */
  kinds: string[];
  /** 라이선스. 독점이면 null */
  openSource: string | null;
  /** 모델 선택: 한 회사 모델 위주인지, 아무 모델이나 붙는지 */
  models: string;
  /** 가장 싸게 시작하는 법(무료 여부) */
  cheapest: string;
  free: boolean;
  install: string;
  /** 자기만의 컨텍스트 파일(CLAUDE.md 등) */
  contextFile: string;
  support: Record<HarnessFeature, Support>;
  bestAt: string;
  caution: string;
  docs: string;
}

export interface CommandSnippet {
  /** 어디서 쓰는 명령인지: "Claude Code", "npx skills", "Codex" … */
  label: string;
  code: string;
}

export interface Skill {
  slug: string;
  name: string;
  publisher: string;
  official: boolean;
  what: string;
  install: CommandSnippet[];
  worksIn: string;
  /** "180k★"처럼 보이는 그대로. 확인 못 했으면 null */
  popularity: string | null;
  caution: string;
  url: string;
}

export interface McpServer {
  slug: string;
  name: string;
  publisher: string;
  official: boolean;
  what: string;
  transport: "원격 HTTP" | "로컬 stdio" | "원격 HTTP · 로컬 stdio";
  auth: string;
  install: CommandSnippet[];
  security: string;
  docs: string;
}
/* Footer: lib/dev/types.ts */
