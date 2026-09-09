"use client";
/* ---------------------------------------------------------------------------
 * Header: 점수 종류 전환 — 벤치마크 ↔ 커뮤니티 평가.
 *
 * 원래는 헤더 우측에 테마·로그인 버튼과 나란히 있었다. 그러면 이 사이트에서
 * 제일 중요한 축이 유틸리티 버튼처럼 보인다. 두 순위를 나란히 놓고 그 차이를
 * 보는 게 사이트의 전부인데, 그 전환이 구석의 작은 토글이면 아무도 안 누른다.
 *
 * 그래서 목록 위로 끌어내고 각 칸에 모델 수와 한 줄 설명을 붙였다.
 * "지금 무슨 순위를 보고 있는지"와 "반대쪽에는 뭐가 있는지"가 동시에 보여야 한다.
 * ------------------------------------------------------------------------- */

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { ScoreType } from "@/db/schema";
import { parseScoreType } from "@/lib/params";

const PANELS: { value: ScoreType; label: string; desc: string }[] = [
  { value: "BENCHMARK", label: "벤치마크", desc: "공개 시험 성적" },
  { value: "COMMUNITY", label: "커뮤니티 평가", desc: "써 본 사람들의 체감" },
];

export default function ScoreTypeSwitch({
  totals,
}: {
  totals: Record<ScoreType, number>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = parseScoreType(params.get("type"));

  function select(value: ScoreType) {
    if (value === current) return;
    const next = new URLSearchParams(params.toString());
    next.set("type", value);
    startTransition(() => router.replace(`/?${next.toString()}`, { scroll: false }));
  }

  return (
    <div
      role="tablist"
      aria-label="점수 종류"
      className={`grid grid-cols-2 gap-2 pt-5 transition-opacity ${pending ? "opacity-70" : ""}`}
    >
      {PANELS.map((p) => {
        const active = current === p.value;
        return (
          <button
            key={p.value}
            role="tab"
            aria-selected={active}
            onClick={() => select(p.value)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              active
                ? "border-[var(--color-tier-prism)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-text-mute)]"
            }`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span
                className={`text-sm font-semibold ${
                  active ? "text-[var(--color-text)]" : "text-[var(--color-text-dim)]"
                }`}
              >
                {p.label}
              </span>
              <span className="text-[11px] tabular-nums text-[var(--color-text-mute)]">
                {totals[p.value].toLocaleString("ko-KR")}개
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-text-mute)]">
              {p.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}
/* Footer: components/ranking/ScoreTypeSwitch.tsx */
