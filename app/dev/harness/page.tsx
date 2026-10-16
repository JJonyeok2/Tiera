/* ---------------------------------------------------------------------------
 * Header: /dev/harness — 코딩 에이전트 하네스 비교. SPEC 23.24.
 *
 * 위: 기능 지원 표(데스크톱은 표, 모바일은 가로 스크롤). 아래: 하네스별 카드 —
 * 무료 여부, 설치 한 줄, 잘하는 것, 주의, 문서 링크.
 * 기능 칸은 "지원/일부/없음/확인 못 함" 네 가지만 쓴다. 문서로 확인 못 한 걸 "없음"으로
 * 적으면 거짓말이 된다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import CodeBlock from "@/components/dev/CodeBlock";
import { Badge, Caution, DevHeading, ExtLink } from "@/components/dev/DevBits";
import { HARNESSES } from "@/lib/dev/harnesses";
import { HARNESS_FEATURE_LABEL, HARNESS_FEATURES, type Support } from "@/lib/dev/types";
import { shareMeta } from "@/lib/site";

const TITLE = "코딩 에이전트 하네스 비교";
const DESC = "Claude Code·Codex·Antigravity CLI·Copilot CLI·Cursor 등 코딩 에이전트를 무료 여부와 스킬·MCP·훅 지원으로 비교해요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/dev/harness" },
  ...shareMeta({ url: "/dev/harness", title: `${TITLE} — Tiera`, description: DESC }),
};

// 기호는 글꼴 글리프(◐ 등) 대신 CSS 도형으로 그린다. 한글 웹폰트에 반원 글리프가 없어
// 대체 글꼴로 찍히면서 크기·위치가 제각각이었다.
const SUPPORT_MARK: Record<Support, { text: string; shape: React.ReactNode }> = {
  yes: { text: "지원", shape: <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-up)]" /> },
  partial: {
    text: "일부",
    shape: <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[var(--color-tier-gold)]" />,
  },
  no: { text: "없음", shape: <span className="inline-block h-0.5 w-2.5 rounded bg-[var(--color-text-mute)]" /> },
  unknown: { text: "확인 못 함", shape: <span className="text-[12px] font-semibold leading-none text-[var(--color-text-mute)]">?</span> },
};

function Mark({ s }: { s: Support }) {
  const m = SUPPORT_MARK[s];
  return (
    <span className="inline-flex h-4 items-center justify-center align-middle" title={m.text}>
      <span aria-hidden="true" className="inline-flex">{m.shape}</span>
      <span className="sr-only">{m.text}</span>
    </span>
  );
}

export default function HarnessPage() {
  return (
    <div className="space-y-10">
      <DevHeading
        title="하네스: 모델을 코딩 에이전트로 돌리는 곳"
        lead="하네스는 모델에게 파일 읽기·명령 실행 같은 도구와 권한, 규칙 파일, 스킬, MCP를 쥐여 주는 실행 환경이에요. 같은 모델이어도 하네스가 다르면 할 수 있는 일이 달라요."
      />

      <section className="space-y-3">
        <h2 className="text-[17px] font-bold text-[var(--color-text)]">기능 한눈에 보기</h2>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--color-text-mute)]" aria-label="표 기호 설명">
          {(Object.keys(SUPPORT_MARK) as Support[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-flex">{SUPPORT_MARK[k].shape}</span>
              {SUPPORT_MARK[k].text}
            </span>
          ))}
        </p>
        {/* relative가 없으면 칸 안의 sr-only(절대 위치) 글자가 스크롤 상자를 빠져나가
            문서 전체를 가로로 늘린다(모바일에서 페이지가 옆으로 밀렸다). */}
        <div className="relative -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[720px] border-collapse text-[13px]" data-testid="harness-table">
            <caption className="sr-only">하네스별 기능 지원 표</caption>
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-[12px] text-[var(--color-text-mute)]">
                <th scope="col" className="py-2 pr-3 font-medium">하네스</th>
                <th scope="col" className="px-2 py-2 font-medium">무료</th>
                {HARNESS_FEATURES.map((f) => (
                  <th key={f} scope="col" className="px-2 py-2 text-center font-medium">
                    {HARNESS_FEATURE_LABEL[f]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HARNESSES.map((h) => (
                <tr key={h.slug} className="border-b border-[var(--color-line-soft)]">
                  <th scope="row" className="py-2 pr-3 text-left font-semibold text-[var(--color-text)]">
                    <a href={`#${h.slug}`} className="hover:underline">{h.name}</a>
                  </th>
                  <td className="px-2 py-2">{h.free ? <Badge tone="good">무료</Badge> : <Badge>유료</Badge>}</td>
                  {HARNESS_FEATURES.map((f) => (
                    <td key={f} className="px-2 py-2 text-center">
                      <Mark s={h.support[f]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[17px] font-bold text-[var(--color-text)]">하나씩 보기</h2>
        <ul className="space-y-4">
          {HARNESSES.map((h) => (
            <li
              key={h.slug}
              id={h.slug}
              data-testid="harness-card"
              className="scroll-mt-20 space-y-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[17px] font-bold text-[var(--color-text)]">{h.name}</h3>
                <span className="text-[13px] text-[var(--color-text-mute)]">{h.maker}</span>
                {h.free ? <Badge tone="good">무료로 시작</Badge> : <Badge>유료</Badge>}
                {h.openSource && <Badge>오픈소스 · {h.openSource}</Badge>}
                {h.kinds.map((k) => (
                  <Badge key={k}>{k}</Badge>
                ))}
              </div>
              <p className="text-[14px] leading-relaxed text-[var(--color-text)]">{h.bestAt}</p>
              <dl className="grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-[7rem_1fr]">
                <dt className="text-[var(--color-text-mute)]">가장 싸게</dt>
                <dd className="text-[var(--color-text-dim)]">{h.cheapest}</dd>
                <dt className="text-[var(--color-text-mute)]">모델</dt>
                <dd className="text-[var(--color-text-dim)]">{h.models}</dd>
                <dt className="text-[var(--color-text-mute)]">규칙 파일</dt>
                <dd className="font-mono text-[12.5px] text-[var(--color-text-dim)]">{h.contextFile}</dd>
              </dl>
              <CodeBlock label="설치" code={h.install} />
              <Caution>{h.caution}</Caution>
              <ExtLink href={h.docs}>공식 문서</ExtLink>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
/* Footer: app/dev/harness/page.tsx */
