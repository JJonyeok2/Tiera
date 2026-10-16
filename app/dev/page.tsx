/* ---------------------------------------------------------------------------
 * Header: /dev — 개발자 섹션 개요. SPEC 23.24.
 *
 * "AI로 코딩한다"는 이제 모델 고르기만이 아니다. 같은 모델도 어떤 하네스(실행 환경)에서
 * 어떤 스킬·MCP·설정으로 돌리느냐에 따라 결과가 달라진다. 이 페이지는 그 네 갈래를
 * 한 장으로 소개하고 각 페이지로 보낸다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import Link from "next/link";
import { DevHeading, ExtLink } from "@/components/dev/DevBits";
import { HARNESSES, STANDARDS } from "@/lib/dev/harnesses";
import { SKILLS } from "@/lib/dev/skills";
import { MCP_SERVERS } from "@/lib/dev/mcp";
import { shareMeta } from "@/lib/site";

const TITLE = "AI 코딩 개발자 안내";
const DESC = "코딩 에이전트 하네스 비교, 많이 쓰는 스킬(SKILL.md)과 MCP 서버, 하네스 설정 가이드를 한곳에 모았어요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/dev" },
  ...shareMeta({ url: "/dev", title: `${TITLE} — Tiera`, description: DESC }),
};

export default function DevHome() {
  const cards = [
    {
      href: "/dev/harness",
      title: "하네스",
      count: `${HARNESSES.length}개 비교`,
      what: "모델을 코딩 에이전트로 돌리는 실행 환경이에요. Claude Code·Codex·Cursor처럼요. 무료로 되는지, 스킬·MCP·훅을 지원하는지 표로 비교해요.",
    },
    {
      href: "/dev/skills",
      title: "스킬",
      count: `${SKILLS.length}개`,
      what: "에이전트에게 특정 작업 방법을 가르치는 SKILL.md 폴더예요. 요즘 많이 쓰는 스킬과 설치 명령을 모았어요.",
    },
    {
      href: "/dev/mcp",
      title: "MCP 서버",
      count: `${MCP_SERVERS.length}개`,
      what: "에이전트에 GitHub·브라우저·DB·문서 같은 바깥 도구를 붙이는 연결 방식이에요. 보안 주의사항도 같이 적었어요.",
    },
    {
      href: "/dev/guide",
      title: "설정 가이드",
      count: "7단계",
      what: "AGENTS.md부터 스킬·MCP·훅·서브에이전트·권한까지, 저장소에 하네스를 세팅하는 순서와 예시 파일이에요.",
    },
  ];

  return (
    <div className="space-y-10">
      <DevHeading
        title="AI로 코딩할 때 고르는 것들"
        lead={
          <>
            같은 모델이라도 <strong className="text-[var(--color-text)]">어떤 하네스에서, 어떤 스킬과 MCP를 붙여, 어떻게 설정하느냐</strong>에
            따라 결과가 달라져요. 모델 순위는{" "}
            <Link href="/tiers?scope=CODING" className="underline underline-offset-4">
              코딩 티어표
            </Link>
            에서 보고, 여기서는 그 바깥을 골라요.
          </>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2" data-testid="dev-cards">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="group flex h-full flex-col gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-text-mute)]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[17px] font-bold text-[var(--color-text)]">{c.title}</h2>
                <span className="text-[12px] text-[var(--color-text-mute)]">{c.count}</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">{c.what}</p>
              <span className="mt-auto pt-1 text-[13px] font-medium text-[var(--color-text)] group-hover:underline">
                보러 가기 →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h2 className="text-[17px] font-bold text-[var(--color-text)]">하네스를 넘나드는 공통 표준 두 가지</h2>
        <p className="text-[13.5px] text-[var(--color-text-dim)]">
          이 두 형식으로 써 두면 하네스를 바꿔도 대부분 그대로 쓸 수 있어요.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {STANDARDS.map((s) => (
            <li key={s.name} className="space-y-2 rounded-2xl border border-[var(--color-line)] p-5">
              <h3 className="font-mono text-[15px] font-semibold text-[var(--color-text)]">{s.name}</h3>
              <p className="text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">{s.what}</p>
              <ExtLink href={s.url}>공식 사이트</ExtLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-2xl bg-[var(--color-surface-2)] p-5">
        <h2 className="text-[15px] font-bold text-[var(--color-text)]">처음이라면 이 순서로</h2>
        <ol className="list-decimal space-y-1 pl-5 text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">
          <li>
            <Link href="/dev/harness" className="underline underline-offset-4">하네스</Link>를 하나 고른다(무료로 시작하려면 Codex·Antigravity CLI·Copilot CLI).
          </li>
          <li>
            저장소에 <code className="font-mono">AGENTS.md</code>를 만든다 —{" "}
            <Link href="/dev/guide#context" className="underline underline-offset-4">예시 파일</Link>.
          </li>
          <li>필요한 MCP를 하나만 붙인다(대개 GitHub나 문서용 Context7).</li>
          <li>같은 일을 세 번 넘게 시키게 되면 그때 스킬로 만든다.</li>
        </ol>
      </section>
    </div>
  );
}
/* Footer: app/dev/page.tsx */
