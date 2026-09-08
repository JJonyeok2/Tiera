"use client";
/* Header: 하단 플로팅 비교 바. 2개 이상 골랐을 때만 나타난다. */
import Link from "next/link";
import { MAX_COMPARE, useCompare } from "./CompareContext";

export default function CompareTray() {
  const { items, clear, toggle } = useCompare();
  if (items.length < 2) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <span className="text-xs text-[var(--color-text-mute)]">
          {items.length}/{MAX_COMPARE} 선택
        </span>
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <button
              key={i.slug}
              onClick={() => toggle(i)}
              className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[11px] text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
            >
              {i.name} ✕
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={clear} className="text-xs text-[var(--color-text-mute)] hover:underline">
            초기화
          </button>
          <Link
            href={`/compare?models=${items.map((i) => i.slug).join(",")}`}
            className="rounded-lg bg-[var(--color-tier-prism)] px-4 py-2 text-xs font-semibold text-white"
          >
            {items.length}개 비교하기
          </Link>
        </div>
      </div>
    </div>
  );
}
/* Footer: components/ranking/CompareTray.tsx */
