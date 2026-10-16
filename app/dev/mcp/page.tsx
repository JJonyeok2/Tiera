/* ---------------------------------------------------------------------------
 * Header: /dev/mcp — 많이 쓰는 MCP 서버. SPEC 23.24.
 *
 * MCP는 에이전트에 바깥 시스템을 붙인다. 붙이는 순간 에이전트가 내 계정 권한으로
 * GitHub·DB·결제를 만질 수 있으므로, 목록보다 먼저 "붙이기 전 세 가지"를 보여준다.
 * 설치 예시는 Claude Code 명령이 기본이고, 다른 하네스는 문서의 JSON 설정을 쓴다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import Link from "next/link";
import CodeBlock from "@/components/dev/CodeBlock";
import { Badge, Caution, DevHeading, ExtLink } from "@/components/dev/DevBits";
import { MCP_REGISTRY, MCP_SERVERS } from "@/lib/dev/mcp";
import { shareMeta } from "@/lib/site";

const TITLE = "많이 쓰는 MCP 서버";
const DESC = "GitHub·Playwright·Context7·Supabase·Figma 등 코딩 에이전트에 붙이는 MCP 서버와 설치 명령, 보안 주의사항을 모았어요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/dev/mcp" },
  ...shareMeta({ url: "/dev/mcp", title: `${TITLE} — Tiera`, description: DESC }),
};

export default function McpPage() {
  return (
    <div className="space-y-8">
      <DevHeading
        title="MCP: 에이전트에 바깥 도구를 붙이는 방법"
        lead="MCP(Model Context Protocol)는 에이전트가 GitHub·브라우저·DB·문서 같은 바깥 시스템을 쓰게 해 주는 공통 연결 방식이에요. 한 번 만든 서버를 여러 하네스가 같이 써요."
      />

      <section className="space-y-2 rounded-2xl bg-[var(--color-surface-2)] p-5" data-testid="mcp-safety">
        <h2 className="text-[15px] font-bold text-[var(--color-text)]">붙이기 전에 세 가지</h2>
        <ol className="list-decimal space-y-1 pl-5 text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">
          <li>
            <strong className="text-[var(--color-text)]">읽기 전용부터.</strong> 대부분 read-only 옵션이 있어요. 쓰기가 꼭 필요할 때만 켜세요.
          </li>
          <li>
            <strong className="text-[var(--color-text)]">키는 환경 변수로.</strong> 설정 파일에 토큰을 그대로 적지 말고{" "}
            <code className="font-mono">{"${VAR}"}</code>로 넣으세요. <code className="font-mono">.mcp.json</code>은 커밋돼요.
          </li>
          <li>
            <strong className="text-[var(--color-text)]">가져온 내용을 믿지 마세요.</strong> 웹페이지·이슈·DB 행에 숨은 지시문(프롬프트 인젝션)이
            에이전트를 조종할 수 있어요. 도구 실행 승인은 켜 두세요.
          </li>
        </ol>
        <p className="pt-1 text-[13px] text-[var(--color-text-dim)]">
          범위(local·project·user)와 설정 예시는{" "}
          <Link href="/dev/guide#mcp" className="underline underline-offset-4">설정 가이드</Link>에 있어요.
        </p>
      </section>

      <ul className="grid gap-4 lg:grid-cols-2">
        {MCP_SERVERS.map((m) => (
          <li
            key={m.slug}
            id={m.slug}
            data-testid="mcp-card"
            className="flex min-w-0 scroll-mt-20 flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-bold text-[var(--color-text)]">{m.name}</h2>
              {m.official ? <Badge tone="good">공식</Badge> : <Badge>커뮤니티</Badge>}
              <Badge>{m.transport}</Badge>
            </div>
            <p className="text-[12.5px] text-[var(--color-text-mute)]">
              {m.publisher} · 인증: {m.auth}
            </p>
            <p className="text-[14px] leading-relaxed text-[var(--color-text)]">{m.what}</p>
            <div className="space-y-2">
              {m.install.map((c) => (
                <CodeBlock key={c.label} label={c.label} code={c.code} />
              ))}
            </div>
            <Caution>{m.security}</Caution>
            <div className="mt-auto">
              <ExtLink href={m.docs}>공식 문서</ExtLink>
            </div>
          </li>
        ))}
      </ul>

      <section className="space-y-2 rounded-2xl border border-[var(--color-line)] p-5">
        <h2 className="text-[15px] font-bold text-[var(--color-text)]">더 찾고 싶다면</h2>
        <p className="text-[13.5px] text-[var(--color-text-dim)]">{MCP_REGISTRY.what}</p>
        <ExtLink href={MCP_REGISTRY.url}>MCP Registry</ExtLink>
      </section>
    </div>
  );
}
/* Footer: app/dev/mcp/page.tsx */
