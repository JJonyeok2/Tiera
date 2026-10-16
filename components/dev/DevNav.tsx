"use client";
/* ---------------------------------------------------------------------------
 * Header: 개발자 섹션 탭(개요·하네스·스킬·MCP·설정 가이드). SPEC 23.24.
 *
 * 다섯 페이지가 한 묶음이라는 걸 보여주고, 어디서든 옆 페이지로 한 번에 가게 한다.
 * 모바일에서는 가로 스크롤 — 다섯 개를 두 줄로 접으면 탭처럼 안 보인다.
 * ------------------------------------------------------------------------- */
import Link from "next/link";
import { usePathname } from "next/navigation";

export const DEV_TABS = [
  { href: "/dev", label: "개요" },
  { href: "/dev/harness", label: "하네스" },
  { href: "/dev/skills", label: "스킬" },
  { href: "/dev/mcp", label: "MCP" },
  { href: "/dev/guide", label: "설정 가이드" },
] as const;

export default function DevNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="개발자 섹션" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max min-w-full gap-1 border-b border-[var(--color-line)] sm:w-auto">
        {DEV_TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px block whitespace-nowrap border-b-2 px-3 py-2 text-[14px] transition ${
                  active
                    ? "border-[var(--color-text)] font-semibold text-[var(--color-text)]"
                    : "border-transparent text-[var(--color-text-mute)] hover:text-[var(--color-text)]"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
/* Footer: components/dev/DevNav.tsx */
