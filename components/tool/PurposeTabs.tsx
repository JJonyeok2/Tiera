"use client";
/* ---------------------------------------------------------------------------
 * Header: 용도 탭 — 도구 목록의 주 탐색 수단.
 *
 * 모델 쪽 FilterBar와 역할은 비슷하지만 기본값이 다르다.
 * 여기는 "전체"가 기본이다. 잘 모르는 사람이 처음 들어왔을 때 특정 용도가
 * 이미 선택돼 있으면, 그 탭에 없는 도구는 이 사이트에 없는 것이 된다.
 *
 * 탭에 붙는 숫자는 목록과 **같은 조건으로** 센 값이다(getPurposeTotals).
 * 탭에 5라고 적혀 있는데 눌러서 7개가 나오면 둘 중 하나가 거짓말이다.
 * ------------------------------------------------------------------------- */

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { ToolPurpose } from "@/db/schema";
import { PURPOSE_LABEL } from "@/lib/labels";
import { PURPOSES, parseToolPurpose } from "@/lib/params";

export default function PurposeTabs({
  totals,
  allCount,
}: {
  totals: Record<ToolPurpose, number>;
  allCount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = parseToolPurpose(params.get("for"));

  function select(value: ToolPurpose | undefined) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("for", value);
    else next.delete("for");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `/?${qs}` : "/", { scroll: false }));
  }

  return (
    <nav
      aria-label="용도"
      className={`mt-6 flex flex-wrap gap-1.5 transition-opacity ${pending ? "opacity-70" : ""}`}
    >
      <Tab active={!current} label="전체" count={allCount} onClick={() => select(undefined)} />
      {PURPOSES.map((p) => (
        <Tab
          key={p}
          active={current === p}
          label={PURPOSE_LABEL[p]}
          count={totals[p]}
          onClick={() => select(p)}
        />
      ))}
    </nav>
  );
}

function Tab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  // 0개인 용도는 누를 수 있게 두되 흐리게 표시한다. 탭을 아예 숨기면
  // "이 사이트는 영상은 안 다루나 보다"로 읽히는데, 사실은 아직 없는 것뿐이다.
  const empty = count === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      // 선택된 탭은 테두리를 바꾸는 대신 **채운다.** 테두리만 바꾸면 알약 12개
      // 사이에서 어느 게 켜졌는지 한눈에 안 들어왔다.
      className={`rounded-full px-3 py-1.5 text-xs transition duration-150 ${
        active
          ? "bg-[var(--color-text)] font-medium text-[var(--color-bg)]"
          : empty
            ? "text-[var(--color-text-mute)]/60 hover:bg-[var(--color-surface)]"
            : "text-[var(--color-text-dim)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 tabular-nums text-[10px] ${
          active ? "opacity-60" : "text-[var(--color-text-mute)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
/* Footer: components/tool/PurposeTabs.tsx */
