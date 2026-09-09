"use client";
/* ---------------------------------------------------------------------------
 * Header: 테마 선택 — 아이콘 하나 + 드롭다운.
 *
 * 원래는 라이트·다크·시스템 세 버튼이 항상 펼쳐져 있었다. 하루에 한 번 쓸까 말까 한
 * 설정이 헤더 폭을 계속 차지했다. 접어두고 필요할 때만 펼친다.
 *
 * 옵션 버튼은 접힌 상태에서도 role="radio"와 title을 그대로 유지한다 —
 * 접근성 트리와 E2E 선택자가 둘 다 그 속성에 걸려 있다.
 * ------------------------------------------------------------------------- */

import { useEffect, useRef, useState } from "react";
import { useTheme, type ThemeChoice } from "./ThemeProvider";

const OPTIONS: { value: ThemeChoice; label: string; icon: string }[] = [
  { value: "light", label: "라이트", icon: "☀" },
  { value: "dark", label: "다크", icon: "☾" },
  { value: "system", label: "시스템", icon: "◐" },
];

export default function ThemeToggle() {
  const { theme, setTheme, ready } = useTheme();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // 바깥을 누르거나 Esc를 누르면 닫는다. 열어두고 다른 걸 누르면 닫히는 게 기대 동작이다.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentIcon = OPTIONS.find((o) => o.value === theme)?.icon ?? "◐";

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="화면 테마"
        title="화면 테마"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[13px] text-[var(--color-text-dim)] transition hover:border-[var(--color-text-mute)]"
      >
        {/* 서버는 저장된 테마를 모른다(=system). 클라이언트는 마운트 직후 알게 되므로
            이 자리는 원래 어긋난다. 실제 버그가 아니라 경고만 끈다. */}
        <span aria-hidden="true" suppressHydrationWarning>
          {ready ? currentIcon : "◐"}
        </span>
      </button>

      <div
        role="radiogroup"
        aria-label="화면 테마"
        hidden={!open}
        className="absolute right-0 top-full z-40 mt-1.5 w-32 overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] py-1 shadow-lg"
      >
        {OPTIONS.map((o) => {
          const active = ready && theme === o.value;
          return (
            <button
              key={o.value}
              role="radio"
              suppressHydrationWarning
              aria-checked={active}
              title={o.label}
              onClick={() => {
                setTheme(o.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition ${
                active
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                  : "text-[var(--color-text-mute)] hover:text-[var(--color-text-dim)]"
              }`}
            >
              <span aria-hidden="true" className="w-3.5 text-center">
                {o.icon}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
/* Footer: components/site/ThemeToggle.tsx */
