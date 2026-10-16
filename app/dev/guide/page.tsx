/* ---------------------------------------------------------------------------
 * Header: /dev/guide — 하네스 설정 가이드. SPEC 23.24.
 *
 * 내용은 lib/dev/guide.ts에 있고, 여기서는 목차·섹션·체크리스트로 그린다.
 * 섹션 id(#context, #skills, #mcp …)는 다른 /dev 페이지에서 직접 링크하므로 바꾸지 않는다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import CodeBlock from "@/components/dev/CodeBlock";
import { DevHeading } from "@/components/dev/DevBits";
import { GUIDE_SECTIONS, RECENT_CHANGES, STARTER_CHECKLIST } from "@/lib/dev/guide";
import { shareMeta } from "@/lib/site";

const TITLE = "코딩 에이전트 하네스 설정 가이드";
const DESC = "AGENTS.md, 스킬, MCP, 훅, 서브에이전트, 권한까지 저장소에 코딩 에이전트를 세팅하는 순서와 예시 파일이에요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/dev/guide" },
  ...shareMeta({ url: "/dev/guide", title: `${TITLE} — Tiera`, description: DESC }),
};

export default function GuidePage() {
  return (
    <div className="space-y-10">
      <DevHeading
        title="하네스 설정, 이 순서로"
        lead="규칙 파일 하나만 잘 써도 결과가 눈에 띄게 좋아져요. 위에서부터 필요한 만큼만 따라 하세요. 예시는 Claude Code 기준이고, 다른 하네스에서 다른 부분은 따로 적었어요."
      />

      <nav aria-label="가이드 목차" className="rounded-2xl border border-[var(--color-line)] p-4">
        <ol className="grid gap-1 text-[13.5px] sm:grid-cols-2">
          {GUIDE_SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:underline">
                {s.title}
              </a>
            </li>
          ))}
          <li>
            <a href="#checklist" className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:underline">
              7. 시작 체크리스트
            </a>
          </li>
        </ol>
      </nav>

      {GUIDE_SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 space-y-3" data-testid="guide-section">
          <h2 className="text-[19px] font-bold text-[var(--color-text)]">{s.title}</h2>
          <p className="text-[14px] leading-relaxed text-[var(--color-text-dim)]">{s.why}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">
            {s.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className="space-y-3">
            {s.snippets.map((c) => (
              <CodeBlock key={c.label} label={c.label} code={c.code} />
            ))}
          </div>
        </section>
      ))}

      <section id="checklist" className="scroll-mt-20 space-y-3" data-testid="guide-checklist">
        <h2 className="text-[19px] font-bold text-[var(--color-text)]">7. 시작 체크리스트</h2>
        <p className="text-[14px] text-[var(--color-text-dim)]">저장소에 에이전트를 붙이기 전에 한 번 훑어보세요.</p>
        <ul className="space-y-1.5">
          {STARTER_CHECKLIST.map((item) => (
            <li key={item}>
              <label className="flex cursor-pointer items-start gap-2 text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">
                <input type="checkbox" className="mt-1 accent-[var(--color-text)]" />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-2xl bg-[var(--color-surface-2)] p-5">
        <h2 className="text-[15px] font-bold text-[var(--color-text)]">2026년에 바뀐 것</h2>
        <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">
          {RECENT_CHANGES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
/* Footer: app/dev/guide/page.tsx */
