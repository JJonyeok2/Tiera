/* ---------------------------------------------------------------------------
 * Header: /dev/skills — 많이 쓰는 에이전트 스킬(SKILL.md). SPEC 23.24.
 *
 * 스킬은 폴더 하나(SKILL.md + 스크립트·참고 파일)라 남이 만든 걸 깔면 그 스크립트가
 * 내 권한으로 돈다. 그래서 공식/커뮤니티를 배지로 구분하고, 카드마다 주의를 단다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import Link from "next/link";
import CodeBlock from "@/components/dev/CodeBlock";
import { Badge, Caution, DevHeading, ExtLink } from "@/components/dev/DevBits";
import { SKILLS } from "@/lib/dev/skills";
import { shareMeta } from "@/lib/site";

const TITLE = "인기 에이전트 스킬 모음";
const DESC = "Anthropic 공식 스킬, Superpowers, Matt Pocock Skills 등 요즘 많이 쓰는 SKILL.md 스킬과 설치 명령을 모았어요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/dev/skills" },
  ...shareMeta({ url: "/dev/skills", title: `${TITLE} — Tiera`, description: DESC }),
};

export default function SkillsPage() {
  return (
    <div className="space-y-8">
      <DevHeading
        title="스킬: 에이전트에게 일하는 법을 가르치는 폴더"
        lead={
          <>
            스킬은 <code className="font-mono">SKILL.md</code>와 스크립트를 담은 폴더예요. 에이전트는 평소엔 이름과 설명만 보고 있다가, 지금
            하는 일에 맞을 때 본문을 불러와요. 직접 만드는 법은{" "}
            <Link href="/dev/guide#skills" className="underline underline-offset-4">설정 가이드</Link>에 있어요.
          </>
        }
      />

      <Caution>
        스킬에 들어 있는 스크립트는 내 컴퓨터에서 내 권한으로 실행돼요. 커뮤니티 스킬은 설치 전에 SKILL.md와 scripts 폴더를 열어 보세요.
      </Caution>

      <ul className="grid gap-4 lg:grid-cols-2">
        {SKILLS.map((s) => (
          <li
            key={s.slug}
            id={s.slug}
            data-testid="skill-card"
            className="flex min-w-0 scroll-mt-20 flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-bold text-[var(--color-text)]">{s.name}</h2>
              {s.official ? <Badge tone="good">공식</Badge> : <Badge>커뮤니티</Badge>}
              {s.popularity && <Badge>{s.popularity}</Badge>}
            </div>
            <p className="text-[12.5px] text-[var(--color-text-mute)]">{s.publisher}</p>
            <p className="text-[14px] leading-relaxed text-[var(--color-text)]">{s.what}</p>
            <p className="text-[12.5px] text-[var(--color-text-dim)]">
              <span className="text-[var(--color-text-mute)]">쓸 수 있는 곳 · </span>
              {s.worksIn}
            </p>
            <div className="space-y-2">
              {s.install.map((c) => (
                <CodeBlock key={c.label} label={c.label} code={c.code} />
              ))}
            </div>
            <Caution>{s.caution}</Caution>
            <div className="mt-auto">
              <ExtLink href={s.url}>저장소</ExtLink>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
/* Footer: app/dev/skills/page.tsx */
