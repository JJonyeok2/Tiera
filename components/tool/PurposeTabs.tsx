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
import { useEffect, useRef, useTransition } from "react";
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
  const navRef = useRef<HTMLElement>(null);

  // 모바일에서는 탭이 한 줄로 옆으로 밀린다. 링크로 들어왔거나 뒤로 가기로
  // 돌아왔을 때 선택된 탭이 화면 밖에 있으면, 뭐가 켜져 있는지 안 보인다.
  useEffect(() => {
    const el = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [current]);

  function select(value: ToolPurpose | undefined) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("for", value);
    else next.delete("for");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `/?${qs}` : "/", { scroll: false }));
  }

  return (
    // 화면이 넓지 않으면(lg 미만) 줄바꿈 대신 가로 스크롤이다. 태블릿에서 두 줄로 접히면
    // 마지막 탭 하나만 아랫줄에 떨어져 어색했다. 알약 11개가 세 줄로 접히면서
    // 첫 화면을 탭이 다 차지했다. 좌우 여백까지 끌어와(-mx-4) 오른쪽 끝 탭이
    // 반쯤 잘려 보이게 두면 "옆으로 더 있다"는 게 따로 표시 없이 읽힌다.
    <nav
      ref={navRef}
      aria-label="용도"
      className={`-mx-4 mt-6 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden transition-opacity ${
        pending ? "opacity-70" : ""
      }`}
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
      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] transition duration-150 ${
        active
          ? "bg-[var(--color-text)] font-medium text-[var(--color-bg)]"
          : empty
            ? "text-[var(--color-text-mute)]/60 hover:bg-[var(--color-surface)]"
            : "text-[var(--color-text-dim)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 tabular-nums text-[11px] ${
          active ? "opacity-60" : "text-[var(--color-text-mute)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
/* Footer: components/tool/PurposeTabs.tsx */
