"use client";
/* ---------------------------------------------------------------------------
 * Header: 복사 버튼이 달린 코드 블록. 개발자 섹션(/dev) 전용. SPEC 23.24.
 *
 * 설치 명령은 손으로 옮겨 치다가 틀리기 쉽다(따옴표·하이픈). 그래서 블록마다 복사 버튼을 둔다.
 * 클립보드 API가 막힌 환경(비보안 컨텍스트·권한 거부)에서는 "복사 안 됨"을 잠깐 보여주고,
 * 코드는 select-all이라 직접 긁어 갈 수 있다.
 * ------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "done" | "fail";

export default function CodeBlock({
  code,
  label,
  lang,
}: {
  code: string;
  /** 블록 위 작은 제목. "Claude Code", ".claude/settings.json" 등 */
  label?: string;
  /** 스크린리더용 언어 이름. 강조(하이라이트)는 하지 않는다 — 번들만 커진다. */
  lang?: string;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("done");
    } catch {
      setState("fail");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1600);
  }

  return (
    <div
      data-testid="code-block"
      // min-w-0: 카드가 flex·grid라 기본 min-width:auto면 긴 명령 줄이 카드째 늘린다.
      className="min-w-0 max-w-full overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line-soft)] px-3 py-1.5">
        <span className="truncate font-mono text-[11.5px] text-[var(--color-text-mute)]">
          {label ?? lang ?? "명령어"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md px-2 py-0.5 text-[12px] font-medium text-[var(--color-text-dim)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          aria-label={label ? `${label} 복사` : "코드 복사"}
        >
          {state === "done" ? "복사됨" : state === "fail" ? "복사 안 됨" : "복사"}
        </button>
      </div>
      <pre
        className="overflow-x-auto px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-text)]"
        aria-label={lang ? `${lang} 코드` : undefined}
      >
        <code className="select-all font-mono whitespace-pre">{code}</code>
      </pre>
      {/* 복사 결과를 스크린리더에도 알린다. 버튼 글자만 바뀌면 읽히지 않을 수 있다. */}
      <span className="sr-only" aria-live="polite">
        {state === "done" ? "복사했어요" : state === "fail" ? "복사하지 못했어요" : ""}
      </span>
    </div>
  );
}
/* Footer: components/dev/CodeBlock.tsx */
