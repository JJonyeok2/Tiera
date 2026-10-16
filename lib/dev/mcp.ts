/* ---------------------------------------------------------------------------
 * Header: 많이 쓰는 MCP 서버. SPEC 23.24.
 *
 * MCP 서버는 에이전트에게 외부 도구(GitHub·브라우저·DB·문서)를 붙인다. 붙이는 순간
 * 에이전트가 내 계정 권한으로 그 시스템을 만지게 되므로, 항목마다 보안 주의를 단다.
 *
 * 2026-10-16에 각 공식 README·문서에서 설치 명령을 확인했다.
 * 공식 레퍼런스 Postgres 서버는 보관(archived) 처리돼 커뮤니티 서버(Postgres MCP Pro)를 싣는다.
 * 설치 예시는 Claude Code 명령을 기본으로 둔다 — 다른 하네스는 각 README의 JSON 설정을 쓴다.
 * ------------------------------------------------------------------------- */
import type { McpServer } from "./types";

export const MCP_REGISTRY = {
  url: "https://registry.modelcontextprotocol.io",
  what: "MCP 프로젝트가 운영하는 공식 서버 목록(앱스토어형)이에요. 아직 프리뷰 단계예요.",
};

export const MCP_SERVERS: McpServer[] = [
  {
    slug: "github",
    name: "GitHub",
    publisher: "GitHub",
    official: true,
    what: "저장소·이슈·PR·코드를 조회하고 이슈·PR을 만들거나 리뷰해요.",
    transport: "원격 HTTP · 로컬 stdio",
    auth: "GitHub PAT 또는 OAuth",
    install: [
      {
        label: "Claude Code",
        code: `claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer \${GITHUB_PAT}"}}'`,
      },
    ],
    security: "PAT는 최소 권한으로 만들고 커밋하지 마세요. 조회만 필요하면 읽기 전용 모드를 쓰세요.",
    docs: "https://github.com/github/github-mcp-server",
  },
  {
    slug: "playwright",
    name: "Playwright MCP",
    publisher: "Microsoft",
    official: true,
    what: "브라우저를 열어 클릭·입력·스냅샷으로 웹페이지를 조작하고 테스트해요.",
    transport: "로컬 stdio",
    auth: "없음",
    install: [{ label: "Claude Code", code: "claude mcp add playwright npx @playwright/mcp@latest" }],
    security: "공식 문서에 '보안 경계가 아니다'라고 적혀 있어요. 외부에서 접속 가능한 주소로 띄우지 마세요.",
    docs: "https://github.com/microsoft/playwright-mcp",
  },
  {
    slug: "chrome-devtools",
    name: "Chrome DevTools MCP",
    publisher: "Google",
    official: true,
    what: "실제 Chrome의 콘솔·네트워크·성능 트레이스를 읽어 디버깅해요.",
    transport: "로컬 stdio",
    auth: "없음",
    install: [{ label: "Claude Code", code: "claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest" }],
    security: "브라우저 속 데이터가 에이전트에게 보여요. 개인 계정 프로필에서는 쓰지 마세요. 사용 통계는 --no-usage-statistics로 꺼요.",
    docs: "https://github.com/ChromeDevTools/chrome-devtools-mcp",
  },
  {
    slug: "context7",
    name: "Context7",
    publisher: "Upstash",
    official: true,
    what: "라이브러리의 최신 문서와 예시를 가져와 오래된 API로 코드를 짜는 실수를 줄여요.",
    transport: "원격 HTTP · 로컬 stdio",
    auth: "API 키(무료 발급) 또는 OAuth",
    install: [
      {
        label: "Claude Code",
        code: 'claude mcp add --scope user --header "Authorization: Bearer ${CONTEXT7_API_KEY}" --transport http context7 https://mcp.context7.com/mcp',
      },
    ],
    security: "문서가 커뮤니티 기여로 모여 정확성이 보장되지 않고, 가져온 내용에 프롬프트 인젝션이 숨을 수 있어요.",
    docs: "https://context7.com/docs/resources/all-clients",
  },
  {
    slug: "figma",
    name: "Figma",
    publisher: "Figma",
    official: true,
    what: "Figma 디자인의 구조·변수·컴포넌트를 읽어 코드로 옮기고, 캔버스에 쓸 수도 있어요.",
    transport: "원격 HTTP",
    auth: "Figma 계정 로그인",
    install: [{ label: "Claude Code", code: "claude mcp add --transport http figma https://mcp.figma.com/mcp" }],
    security: "쓰기 권한이 있어요. 중요한 파일에서는 변경 내용을 꼭 확인하세요.",
    docs: "https://developers.figma.com/docs/figma-mcp-server/remote-server-installation",
  },
  {
    slug: "notion",
    name: "Notion",
    publisher: "Notion",
    official: true,
    what: "Notion 페이지와 데이터베이스를 검색·읽기·만들기·수정해요.",
    transport: "원격 HTTP",
    auth: "OAuth",
    install: [{ label: "Claude Code", code: "claude mcp add --transport http notion https://mcp.notion.com/mcp" }],
    security: "내가 접근할 수 있는 워크스페이스 전체를 에이전트가 읽고 쓸 수 있어요.",
    docs: "https://developers.notion.com/guides/mcp/get-started-with-mcp",
  },
  {
    slug: "supabase",
    name: "Supabase",
    publisher: "Supabase",
    official: true,
    what: "테이블 조회, SQL 실행, 마이그레이션, Edge Functions, 로그 확인을 해요.",
    transport: "원격 HTTP",
    auth: "OAuth",
    install: [
      {
        label: "Claude Code",
        code: 'claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<id>&read_only=true"',
      },
    ],
    security: "데이터 속 프롬프트 인젝션으로 위험한 쿼리가 실행될 수 있어요. 운영 DB는 read_only로, 도구 승인은 수동으로 두세요.",
    docs: "https://supabase.com/docs/guides/getting-started/mcp",
  },
  {
    slug: "postgres-mcp-pro",
    name: "Postgres MCP Pro",
    publisher: "Crystal DBA",
    official: false,
    what: "Postgres에 붙어 스키마 조회·SQL 실행·인덱스 튜닝·상태 점검을 해요.",
    transport: "로컬 stdio",
    auth: "DATABASE_URI 접속 문자열",
    install: [
      {
        label: "JSON 설정",
        code: '{ "mcpServers": { "postgres": { "command": "uvx", "args": ["postgres-mcp", "--access-mode=restricted"], "env": { "DATABASE_URI": "${DATABASE_URI}" } } } }',
      },
    ],
    security: "unrestricted 모드는 쓰기·스키마 변경까지 돼요. 운영 DB는 restricted(읽기 전용)로만, 접속 문자열은 커밋하지 마세요.",
    docs: "https://github.com/crystaldba/postgres-mcp",
  },
  {
    slug: "sentry",
    name: "Sentry",
    publisher: "Sentry",
    official: true,
    what: "에러·이슈·스택트레이스를 조회해 버그 원인을 분석해요.",
    transport: "원격 HTTP",
    auth: "OAuth",
    install: [{ label: "Claude Code", code: "claude mcp add --transport http sentry https://mcp.sentry.dev/mcp/<org>/<project>" }],
    security: "조직 전체 대신 프로젝트 단위 주소로 범위를 좁히세요. 에러 로그에 개인정보가 섞일 수 있어요.",
    docs: "https://docs.sentry.io/ai/mcp/",
  },
  {
    slug: "linear",
    name: "Linear",
    publisher: "Linear",
    official: true,
    what: "이슈·프로젝트·코멘트를 찾고 만들고 수정해요.",
    transport: "원격 HTTP",
    auth: "OAuth 또는 API 키",
    install: [{ label: "Claude Code", code: "claude mcp add --transport http linear-server https://mcp.linear.app/mcp" }],
    security: "쓰기가 필요 없으면 /mcp/readonly 주소나 읽기 전용 키를 쓰세요.",
    docs: "https://linear.app/docs/mcp",
  },
  {
    slug: "stripe",
    name: "Stripe",
    publisher: "Stripe",
    official: true,
    what: "고객·결제·구독·인보이스를 조회·생성하고 Stripe 문서를 검색해요.",
    transport: "원격 HTTP",
    auth: "OAuth 또는 Agent API 키",
    install: [{ label: "Claude Code", code: "claude mcp add --transport http stripe https://mcp.stripe.com/" }],
    security: "실제 돈이 움직이는 쓰기 도구가 있어요. 샌드박스부터 쓰고 도구 승인을 켜세요.",
    docs: "https://docs.stripe.com/mcp",
  },
  {
    slug: "vercel",
    name: "Vercel",
    publisher: "Vercel",
    official: true,
    what: "문서 검색, 프로젝트·배포 관리, 배포 로그 분석을 해요.",
    transport: "원격 HTTP",
    auth: "OAuth",
    install: [{ label: "Claude Code", code: "claude mcp add --transport http vercel https://mcp.vercel.com" }],
    security: "에이전트가 내 Vercel 계정과 같은 권한을 가져요. 사람 확인 단계를 꼭 켜세요.",
    docs: "https://vercel.com/docs/agent-resources/vercel-mcp",
  },
  {
    slug: "filesystem",
    name: "Filesystem (레퍼런스)",
    publisher: "MCP 프로젝트",
    official: true,
    what: "지정한 폴더 안에서 파일을 읽고 쓰고 검색해요.",
    transport: "로컬 stdio",
    auth: "없음(허용 폴더 지정)",
    install: [
      {
        label: "JSON 설정",
        code: '{ "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"] } }',
      },
    ],
    security: "교육용 예제예요. 허용 폴더는 최소로, 홈 폴더 전체는 열지 마세요.",
    docs: "https://github.com/modelcontextprotocol/servers",
  },
  {
    slug: "fetch",
    name: "Fetch (레퍼런스)",
    publisher: "MCP 프로젝트",
    official: true,
    what: "웹페이지를 가져와 LLM이 읽기 좋은 마크다운으로 바꿔요.",
    transport: "로컬 stdio",
    auth: "없음",
    install: [{ label: "JSON 설정", code: '{ "mcpServers": { "fetch": { "command": "uvx", "args": ["mcp-server-fetch"] } } }' }],
    security: "로컬·내부 IP에도 접근할 수 있어요. 사내망에서 조심하고, 가져온 페이지 속 프롬프트 인젝션에 주의하세요.",
    docs: "https://github.com/modelcontextprotocol/servers",
  },
];
/* Footer: lib/dev/mcp.ts */
