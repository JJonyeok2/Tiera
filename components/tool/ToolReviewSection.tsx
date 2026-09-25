"use client";
/* ---------------------------------------------------------------------------
 * Header: 도구 상세의 후기 영역 — 목록 + 정렬 + 작성/수정 진입.
 *
 * 서버가 첫 목록과 "내 후기"를 넘겨주고, 정렬·더보기만 클라이언트가 처리한다.
 * 모델 쪽 ReviewSection과 같은 구조이고, 거기서 실제로 났던 버그 두 개를
 * 여기서도 그대로 막는다:
 *   - initialItems가 바뀌면 목록을 갈아끼운다. 빼먹으면 방금 쓴 내 후기가 안 뜬다.
 *   - 목록 로드 실패를 잡아서 알린다. 조용히 두면 옛 목록을 최신으로 착각한다.
 * ------------------------------------------------------------------------- */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TOOL_AXIS_LABEL, displayAuthorName } from "@/lib/labels";
import type { ToolReviewListItem, ToolReviewSort } from "@/lib/tool-reviews";
import ToolReviewForm from "./ToolReviewForm";

const SORT_LABEL: Record<ToolReviewSort, string> = {
  recent: "최신순",
  high: "평점 높은순",
  low: "평점 낮은순",
};

export default function ToolReviewSection({
  slug,
  toolName,
  initialItems,
  total,
  signedIn,
  myReview,
}: {
  slug: string;
  toolName: string;
  initialItems: ToolReviewListItem[];
  total: number;
  signedIn: boolean;
  myReview: {
    id: string;
    comment: string | null;
    isAnonymous?: boolean;
    ratings: { axis: string; score: number }[];
  } | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [sort, setSort] = useState<ToolReviewSort>("recent");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ sort: ToolReviewSort; offset: number } | null>(
    null
  );
  const [count, setCount] = useState(total);

  useEffect(() => {
    setItems(initialItems);
    setCount(total);
  }, [initialItems, total]);

  async function load(nextSort: ToolReviewSort, offset: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/tools/${slug}/reviews?sort=${nextSort}&offset=${offset}&limit=10`
      );
      // res.ok를 먼저 본다. 500 응답 본문은 JSON이 아닐 수 있어서
      // 바로 json()을 부르면 파싱 예외로 바뀌어 원인이 가려진다.
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as {
        data: ToolReviewListItem[];
        meta: { total: number };
      };
      setItems((prev) => (offset === 0 ? json.data : [...prev, ...json.data]));
      setCount(json.meta.total);
    } catch {
      setError("후기를 불러오지 못했어요.");
      setLastAttempt({ sort: nextSort, offset });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 border-t border-[var(--color-line-soft)] pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-mute)]">
          후기 <span className="tabular-nums">{count.toLocaleString("ko-KR")}</span>
        </h2>

        {count > 0 && (
          <div className="ml-auto flex items-center gap-1">
            {(Object.keys(SORT_LABEL) as ToolReviewSort[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSort(s);
                  void load(s, 0);
                }}
                className={`rounded px-2 py-1 text-[11px] ${
                  sort === s
                    ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                    : "text-[var(--color-text-mute)] hover:text-[var(--color-text-dim)]"
                }`}
              >
                {SORT_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        {!signedIn ? (
          <Link
            href={`/login?callbackUrl=/tools/${slug}`}
            className="inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
          >
            로그인하고 후기 남기기
          </Link>
        ) : editing ? (
          <ToolReviewForm
            slug={slug}
            existing={myReview}
            onDone={async () => {
              setEditing(false);
              await load(sort, 0); // 목록 즉시 갱신
              router.refresh(); // 점수와 myReview는 서버가 다시 계산해 준다
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg bg-[var(--color-tier-prism)] px-4 py-2 text-xs font-semibold text-white"
          >
            {myReview ? "내 후기 수정" : `${toolName} 써보고 남기기`}
          </button>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {items.length === 0 && (
          <li className="py-8 text-center text-xs text-[var(--color-text-mute)]">
            아직 후기가 없어요. 첫 후기를 남겨보세요.
          </li>
        )}
        {items.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* 익명이면 서버가 뭘 내려주든 화면은 이름을 쓰지 않는다.
                  쿼리 쪽 익명 처리가 1차 방어선이고 이건 2차다. */}
              <span
                className={`text-xs font-medium ${
                  r.isAnonymous ? "text-[var(--color-text-mute)]" : "text-[var(--color-text)]"
                }`}
              >
                {displayAuthorName(r)}
              </span>
              {r.isMine && (
                <span className="rounded bg-[var(--color-tier-prism)]/15 px-1.5 py-[2px] text-[10px] text-[var(--color-tier-prism)]">
                  내 후기
                </span>
              )}
              <span className="text-[11px] tabular-nums text-[var(--color-text-mute)]">
                평균 {r.average.toFixed(1)} / 5
              </span>
              <time className="ml-auto text-[11px] text-[var(--color-text-mute)]">
                {r.createdAt.slice(0, 10)}
              </time>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.ratings.map((x) => (
                <span
                  key={x.axis}
                  className="rounded bg-[var(--color-surface-2)] px-1.5 py-[2px] text-[10px] text-[var(--color-text-dim)]"
                >
                  {TOOL_AXIS_LABEL[x.axis as keyof typeof TOOL_AXIS_LABEL] ?? x.axis} {x.score}
                </span>
              ))}
            </div>
            {r.comment && <p className="mt-2 text-sm text-[var(--color-text-dim)]">{r.comment}</p>}
          </li>
        ))}
      </ul>

      {error && (
        <p className="py-2 text-center text-xs text-[var(--color-down)]">
          {error}{" "}
          <button
            onClick={() => void load(lastAttempt?.sort ?? sort, lastAttempt?.offset ?? 0)}
            className="underline"
          >
            다시 시도
          </button>
        </p>
      )}

      {items.length < count && (
        <button
          onClick={() => void load(sort, items.length)}
          disabled={loading}
          className="mt-3 w-full rounded-lg border border-[var(--color-line)] py-2 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)] disabled:opacity-50"
        >
          {loading ? "불러오는 중…" : "더 보기"}
        </button>
      )}
    </section>
  );
}
/* Footer: components/tool/ToolReviewSection.tsx */
