/* ---------------------------------------------------------------------------
 * Header: 사용법 세 단계 — 홈 첫 화면 질문 바로 아래. SPEC 23.22.
 *
 * 처음 온 사람이 "여기서 뭘 하면 되지?"를 읽기 전에 알게 하려고, 사이트가 하는 일을
 * 세 동사로 줄였다: 고르기 → 비교하기 → 써보고 배우기. 이 세 단계가 그대로
 * 화면 순서(용도 칸 → 목록의 가격·한국어 → 상세의 써보러 가기·어디서 배우나요)다.
 *
 * 설명서 문단이 아니라 한 줄짜리 길잡이다. 첫 화면 높이를 거의 먹지 않아야
 * 아래 12칸이 휴대폰 한 화면에 그대로 들어간다(tests/e2e/tools.spec.ts).
 * ------------------------------------------------------------------------- */
const STEPS = [
  // short는 휴대폰 한 줄(약 340px)에 셋이 다 들어가는 길이로 맞췄다. 두 줄이 되면
  // 아래 12칸 마지막 줄이 첫 화면 밖으로 밀린다.
  { short: "고르기", long: "아래 칸에서 하려는 일 고르기" },
  { short: "비교하기", long: "돈이 드는지, 한국어가 되는지 비교" },
  { short: "써보고 배우기", long: "써보러 가기 · 배울 곳까지 한 번에" },
] as const;

export default function HowToSteps() {
  return (
    <ol
      aria-label="사용법"
      className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-[12px] text-[var(--color-text-dim)] sm:mt-4 sm:text-[13px]"
    >
      {STEPS.map((s, i) => (
        <li key={s.short} className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] py-1 pl-1 pr-2.5">
            <span
              aria-hidden="true"
              className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--color-text)] text-[11px] font-bold text-[var(--color-bg)]"
            >
              {i + 1}
            </span>
            {/* 좁은 화면에서는 짧은 말, 넓은 화면에서는 무엇을 하는지까지. */}
            <span className="sm:hidden">{s.short}</span>
            <span className="hidden sm:inline">{s.long}</span>
          </span>
          {i < STEPS.length - 1 && (
            <span aria-hidden="true" className="text-[var(--color-text-mute)]">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
/* Footer: components/site/HowToSteps.tsx */
