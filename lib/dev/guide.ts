/* ---------------------------------------------------------------------------
 * Header: 하네스 설정 가이드 내용(/dev/guide). SPEC 23.24.
 *
 * 저장소에 코딩 에이전트를 세팅하는 순서: 규칙 파일 → 스킬 → MCP → 훅 → 서브에이전트 → 권한.
 * 예시는 Claude Code 기준으로 쓰고, 다른 하네스에서 이름·위치가 다른 곳만 따로 적는다.
 * 2026-10-16에 각 공식 문서로 확인했다. 확인 못 한 버전 번호·수치는 넣지 않았다.
 *
 * 예시 파일에 실제 키·토큰은 절대 넣지 않는다 — 전부 ${VAR} 자리표시자다.
 * ------------------------------------------------------------------------- */
import type { CommandSnippet } from "./types";

export interface GuideSection {
  id: string;
  title: string;
  /** 왜 하는지 한두 문장 */
  why: string;
  points: string[];
  snippets: CommandSnippet[];
}

const AGENTS_MD = `# AGENTS.md

## 프로젝트
Next.js 15(App Router) + TypeScript + Tailwind v4 + Drizzle(Postgres).

## 명령어
- 설치: npm ci
- 개발 서버: npm run dev
- 타입 검사: npx tsc --noEmit
- 린트: npm run lint
- 단위 테스트: npm test
- E2E: npx playwright test

## 규칙
- 서버 컴포넌트가 기본. 상태·이벤트가 필요할 때만 "use client".
- DB 접근은 lib/queries.ts에만 둔다. 컴포넌트에서 db를 직접 import하지 않는다.
- 새 기능에는 테스트를 같이 쓴다. 테스트가 깨진 채로 끝내지 않는다.
- 사용자에게 보이는 문구는 한국어 존댓말(~해요).

## 하지 말 것
- .env, .env.* 파일을 읽거나 수정하지 않는다.
- 마이그레이션 파일(db/migrations)을 손으로 고치지 않는다 — drizzle-kit generate로 만든다.
- git push, 배포 명령은 사람에게 묻고 실행한다.`;

const CLAUDE_MD = `@AGENTS.md

# Claude Code 전용 메모
- 큰 작업은 플랜 모드로 계획부터 보여준다.`;

const SKILL_MD = `---
name: pr-check
description: PR을 올리기 전에 타입 검사·린트·테스트를 돌리고 실패를 고친다. 사용자가 "PR 준비", "올리기 전 점검"이라고 할 때 쓴다.
---

# PR 올리기 전 점검

1. \`npx tsc --noEmit\` — 에러가 있으면 고친다.
2. \`npm run lint\` — 경고도 0개로 만든다.
3. \`npm test\` — 실패한 테스트는 원인을 찾아 코드를 고친다(테스트를 지우지 않는다).
4. \`git diff --stat\`으로 바뀐 파일을 요약해 사용자에게 보여준다.

비밀 값(.env, 토큰)이 diff에 들어 있으면 멈추고 알린다.`;

const MCP_JSON = `{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer \${GITHUB_PAT}" }
    },
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": { "Authorization": "Bearer \${CONTEXT7_API_KEY}" }
    }
  }
}`;

const HOOKS_JSON = `{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": ".claude/hooks/protect-env.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path // empty' | xargs -r npx prettier --write >/dev/null 2>&1 || true" }]
      }
    ]
  }
}`;

const PROTECT_ENV = `#!/usr/bin/env bash
# 도구 입력이 JSON으로 stdin에 들어온다. 수정하려는 파일 경로만 꺼낸다.
file=$(jq -r '.tool_input.file_path // empty')

case "$file" in
  *.env|*.env.*|*/secrets/*)
    echo "비밀 파일은 수정할 수 없어요: $file" >&2
    exit 2   # 2로 끝나면 도구 실행이 막히고, 이 메시지가 에이전트에게 전달된다
    ;;
esac
exit 0`;

const SUBAGENT_MD = `---
name: code-reviewer
description: 구현이 끝난 변경 사항을 보안·유지보수성 관점에서 리뷰한다. 코드를 고치지 않고 의견만 낸다.
tools: Read, Grep, Glob
---

너는 꼼꼼한 코드 리뷰어다. git diff로 바뀐 파일만 본다.
1. 비밀 값 노출, 입력 검증 누락, SQL·XSS 위험을 먼저 찾는다.
2. 중복 코드, 이름이 모호한 함수, 테스트가 빠진 분기를 찾는다.
3. 발견한 것을 "심각 / 보통 / 사소" 순서로, 파일:줄과 함께 적는다.`;

const PERMISSIONS_JSON = `{
  "permissions": {
    "allow": ["Bash(npm run lint)", "Bash(npm test:*)", "Bash(npx tsc:*)"],
    "ask": ["Bash(git push:*)", "Bash(npm install:*)"],
    "deny": ["Read(./.env)", "Read(./.env.*)", "Bash(curl:*)", "Bash(rm -rf:*)"]
  }
}`;

const CODEX_TOML = `# ~/.codex/config.toml
sandbox_mode = "workspace-write"   # 작업 폴더 안에서만 쓰기
approval_policy = "on-request"     # 위험한 명령은 물어보고 실행`;

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "context",
    title: "1. 규칙 파일(AGENTS.md)부터",
    why: "에이전트가 매번 처음부터 저장소를 뒤지지 않게, 빌드·테스트 명령과 규칙을 한 파일에 적어 둬요. 효과가 가장 큰 첫 단계예요.",
    points: [
      "짧게 쓰세요. 200줄을 넘기면 중요한 규칙이 묻혀요. 긴 설명은 문서 파일로 빼고 경로만 적어요.",
      "명령어는 실제로 복사해서 돌아가는 형태로 적어요. \"테스트를 돌린다\"가 아니라 npm test.",
      "Claude Code는 CLAUDE.md가 없을 때만 AGENTS.md를 읽어요. 둘 다 두려면 CLAUDE.md 맨 위에 @AGENTS.md 한 줄을 넣어요.",
      "Codex는 AGENTS.md를 기본으로 읽고, 기본 크기 한도(32KiB)를 넘는 부분은 잘라요.",
      "하위 폴더에도 AGENTS.md를 둘 수 있어요. 가까운 파일이 우선해요.",
    ],
    snippets: [
      { label: "AGENTS.md (Next.js 예시)", code: AGENTS_MD },
      { label: "CLAUDE.md (AGENTS.md를 같이 쓰기)", code: CLAUDE_MD },
    ],
  },
  {
    id: "skills",
    title: "2. 반복하는 일은 스킬로",
    why: "같은 지시를 세 번 넘게 하게 되면 스킬로 만들 때예요. 평소엔 이름과 설명만 읽혀서 많이 둬도 컨텍스트를 적게 써요.",
    points: [
      "위치: Claude Code는 .claude/skills/<이름>/SKILL.md, Codex·Antigravity 등은 .agents/skills/<이름>/SKILL.md.",
      "name은 소문자·숫자·하이픈 64자 이내, 폴더 이름과 같아야 해요. description은 1024자 이내.",
      "description에 \"언제 쓰는지\"를 꼭 적어요. 에이전트는 이 문장만 보고 불러올지 정해요.",
      "본문은 500줄 이내로. 길어지면 참고 파일로 나누고 본문에서 경로를 가리켜요.",
      "배포·삭제처럼 알아서 실행되면 곤란한 스킬은 disable-model-invocation: true로 사람이 부를 때만 돌게 해요.",
    ],
    snippets: [{ label: ".claude/skills/pr-check/SKILL.md", code: SKILL_MD }],
  },
  {
    id: "mcp",
    title: "3. MCP는 꼭 필요한 것만",
    why: "MCP 서버마다 도구 설명이 컨텍스트를 차지하고, 붙일 때마다 에이전트가 만질 수 있는 시스템이 늘어요. 하나씩 붙이세요.",
    points: [
      "범위가 세 가지예요. local(나만·이 저장소), project(.mcp.json으로 팀 공유·커밋됨), user(내 모든 저장소).",
      "토큰은 설정에 그대로 쓰지 말고 ${VAR}로 넣어요. 값은 셸 환경 변수나 비밀 관리 도구에 둬요.",
      "헤드리스 실행(claude -p, SDK)은 서버 승인 창이 뜨지 않아요. CI에서 쓰는 .mcp.json은 특히 짧게 유지해요.",
      "이슈·웹페이지·DB에서 가져온 글에 숨은 지시(프롬프트 인젝션)가 있을 수 있어요. 쓰기 도구는 승인을 켜 둬요.",
    ],
    snippets: [
      { label: ".mcp.json (project 범위)", code: MCP_JSON },
      { label: "Claude Code로 추가", code: "claude mcp add --scope project --transport http github https://api.githubcopilot.com/mcp/\nclaude mcp list" },
    ],
  },
  {
    id: "hooks",
    title: "4. 훅으로 규칙을 강제",
    why: "규칙 파일의 \"하지 마세요\"는 부탁이에요. 훅은 도구 실행 전후에 스크립트를 돌려서 실제로 막거나 고쳐요.",
    points: [
      "PreToolUse 훅이 종료 코드 2로 끝나면 그 도구 실행이 막히고, stderr 메시지가 에이전트에게 전달돼요.",
      "PostToolUse는 수정 직후에 포매터·린터를 돌리기 좋아요.",
      "Edit 훅만으로는 부족해요. 에이전트가 Bash로 같은 파일을 고칠 수 있으니 권한 deny도 같이 걸어요.",
      "Codex·Antigravity도 훅을 지원하지만 이벤트 이름이 달라요(예: BeforeTool/AfterTool). 각 문서를 확인하세요.",
    ],
    snippets: [
      { label: ".claude/settings.json (훅)", code: HOOKS_JSON },
      { label: ".claude/hooks/protect-env.sh", code: PROTECT_ENV },
    ],
  },
  {
    id: "subagents",
    title: "5. 서브에이전트로 역할 나누기",
    why: "리뷰·조사처럼 결과만 필요한 일을 별도 컨텍스트에서 돌려요. 메인 대화가 덜 어지럽고, 도구를 좁혀 실수를 줄여요.",
    points: [
      "위치: .claude/agents/<이름>.md. 프론트매터에 name, description, tools를 적어요.",
      "tools를 좁히세요. 리뷰어에게 Edit·Bash를 주지 않으면 리뷰하다 코드를 고치는 일이 없어요.",
      "description에 언제 부를지 적어 두면 메인 에이전트가 알아서 맡겨요.",
    ],
    snippets: [{ label: ".claude/agents/code-reviewer.md", code: SUBAGENT_MD }],
  },
  {
    id: "permissions",
    title: "6. 권한과 샌드박스",
    why: "매번 승인 누르기는 귀찮고, 다 허용하면 위험해요. 자주 쓰는 안전한 명령만 허용하고 위험한 건 막아 두세요.",
    points: [
      "규칙은 deny → ask → allow 순서로 판단해요. deny에 걸리면 allow에 있어도 막혀요.",
      ".env 읽기, curl 같은 외부 전송, rm -rf는 deny에 넣어 두세요.",
      "비밀 값이 있는 내 컴퓨터에서는 bypassPermissions나 --yolo 같은 '전부 허용' 모드를 쓰지 마세요. 꼭 필요하면 컨테이너·VM 안에서.",
      "자동 승인 모드도 분류기가 위험한 명령을 놓칠 수 있어요. 중요한 저장소에서는 git push·배포를 ask로 두세요.",
      "Codex는 sandbox_mode로 쓰기 범위를, approval_policy로 묻는 시점을 정해요.",
    ],
    snippets: [
      { label: ".claude/settings.json (권한)", code: PERMISSIONS_JSON },
      { label: "Codex 설정", code: CODEX_TOML },
    ],
  },
];

export const STARTER_CHECKLIST: string[] = [
  "AGENTS.md에 설치·실행·테스트·린트 명령을 적었다",
  "AGENTS.md가 200줄 이내다",
  "Claude Code를 쓴다면 CLAUDE.md 맨 위에 @AGENTS.md가 있다",
  ".env와 비밀 파일이 .gitignore에 있다",
  "권한 deny에 .env 읽기와 외부 전송 명령을 넣었다",
  "git push·배포는 ask로 두었다",
  "MCP는 지금 쓰는 것만, 가능하면 읽기 전용으로 붙였다",
  "MCP 토큰은 ${VAR}로만 넣었고 .mcp.json에 실제 값이 없다",
  "포매터·린터를 PostToolUse 훅으로 돌린다",
  "세 번 넘게 반복한 지시는 스킬로 만들었다",
  "남이 만든 스킬은 설치 전에 SKILL.md와 scripts를 읽어 봤다",
];

export const RECENT_CHANGES: string[] = [
  "2026-06-18부터 Gemini CLI는 무료·Google One 사용자에게 Antigravity CLI로 바뀌었어요. 예전 Gemini CLI 글은 명령이 다를 수 있어요.",
  "Codex 문서가 learn.chatgpt.com으로 옮겨 가는 중이에요. 옛 링크는 리다이렉트돼요.",
  "AGENTS.md와 Agent Skills(SKILL.md)가 여러 하네스의 공통 형식이 됐어요. 새로 쓴다면 이 둘로 쓰세요.",
  "공식 MCP 레퍼런스 Postgres 서버는 보관(archived)됐어요. 커뮤니티 서버를 쓰거나 Supabase MCP 같은 공식 서비스 서버를 쓰세요.",
];
/* Footer: lib/dev/guide.ts */
