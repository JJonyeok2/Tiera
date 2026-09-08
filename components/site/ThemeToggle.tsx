"use client";
/* Header: 다크 / 라이트 / 시스템 세그먼트 토글 */

import { useTheme, type ThemeChoice } from "./ThemeProvider";

const OPTIONS: { value: ThemeChoice; label: string; icon: string }[] = [
  { value: "light", label: "라이트", icon: "☀" },
  { value: "dark", label: "다크", icon: "☾" },
  { value: "system", label: "시스템", icon: "◐" },
];

export default function ThemeToggle() {
  const { theme, setTheme, ready } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="화면 테마"
      className="flex shrink-0 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] p-0.5"
    >
      {OPTIONS.map((o) => {
        const active = ready && theme === o.value;
        return (
          <button
            key={o.value}
            role="radio"
            /* 서버는 저장된 테마를 모른다(=system). 클라이언트는 마운트 직후 알게 되므로
               이 속성은 원래 어긋난다. 그래서 여기서만 경고를 끈다 — 실제 버그가 아니다. */
            suppressHydrationWarning
            aria-checked={active}
            title={o.label}
            onClick={() => setTheme(o.value)}
            className={`rounded-full px-2 py-1 text-[11px] leading-none transition ${
              active
                ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                : "text-[var(--color-text-mute)] hover:text-[var(--color-text-dim)]"
            }`}
          >
            <span aria-hidden="true">{o.icon}</span>
            <span className="sr-only">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
/* Footer: components/site/ThemeToggle.tsx */
