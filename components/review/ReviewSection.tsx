"use client";
/* Header: 모델 상세의 리뷰 영역 — 목록 + 정렬 + 작성/수정 진입.
   서버가 첫 목록과 "내 리뷰"를 넘겨주고, 정렬/더보기만 클라이언트가 처리한다. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABEL, displayAuthorName } from "@/lib/labels";
import type { ReviewListItem, ReviewSort } from "@/lib/reviews";
import ReviewForm from "./ReviewForm";

const SORT_LABEL: Record<ReviewSort, string> = {
  recent: "최신순",
  high: "평점 높은순",
  low: "평점 낮은순",
};

export default function ReviewSection({
  slug,
  initialItems,
  total,
  signedIn,
  myReview,
}: {
  slug: string;
  initialItems: ReviewListItem[];
  total: number;
  signedIn: boolean;
  myReview: { id: string; comment: string | null; ratings: { category: string; score: number }[] } | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(total);

  // 서버가 새 initialItems를 내려주면(예: router.refresh 이후) 목록을 갈아끼운다.
  // 이걸 빼먹으면 방금 쓴 내 리뷰가 목록에 나타나지 않는다.
  useEffect(() => {
    setItems(initialItems);
    setCount(total);
  }, [initialItems, total]);

  async function load(nextSort: ReviewSort, offset: number) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/models/${slug}/reviews?sort=${nextSort}&offset=${offset}&limit=10`
      );
      const json = (await res.json()) as { data: ReviewListItem[]; meta: { total: number } };
      setItems((prev) => (offset === 0 ? json.data : [...prev, ...json.data]));
      setCount(json.meta.total);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-dim)]">
          리뷰 <span className="tabular-nums">{count.toLocaleString("ko-KR")}</span>
        </h2>

        <div className="ml-auto flex items-center gap-1">
          {(Object.keys(SORT_LABEL) as ReviewSort[]).map((s) => (
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
      </div>

      {!signedIn ? (
        <Link
          href={`/login?callbackUrl=/models/${slug}`}
          className="inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
        >
          로그인하고 평가하기
        </Link>
      ) : editing ? (
        <ReviewForm
          slug={slug}
          existing={myReview}
          onDone={async () => {
            setEditing(false);
            await load(sort, 0); // 목록을 즉시 갱신
            router.refresh(); // 점수 카드와 myReview는 서버가 다시 계산해 준다
          }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg bg-[var(--color-tier-prism)] px-4 py-2 text-xs font-semibold text-white"
        >
          {myReview ? "내 평가 수정" : "이 모델 평가하기"}
        </button>
      )}

      <ul className="space-y-3">
        {items.length === 0 && (
          <li className="py-8 text-center text-xs text-[var(--color-text-mute)]">
            아직 리뷰가 없습니다. 첫 평가를 남겨보세요.
          </li>
        )}
        {items.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* 익명이면 서버가 뭘 내려주든 화면은 이름을 쓰지 않는다.
                  쿼리 쪽 익명 처리(lib/reviews.ts)가 1차 방어선이고 이건 2차다.
                  한 겹만 두면 그 한 겹이 무너지는 날 이름이 그대로 노출된다. */}
              <span
                className={`text-xs font-medium ${
                  r.isAnonymous ? "text-[var(--color-text-mute)]" : "text-[var(--color-text)]"
                }`}
              >
                {displayAuthorName(r)}
              </span>
              {r.isMine && (
                <span className="rounded bg-[var(--color-tier-prism)]/15 px-1.5 py-[2px] text-[10px] text-[var(--color-tier-prism)]">
                  내 평가
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
                  key={x.category}
                  className="rounded bg-[var(--color-surface-2)] px-1.5 py-[2px] text-[10px] text-[var(--color-text-dim)]"
                >
                  {CATEGORY_LABEL[x.category as keyof typeof CATEGORY_LABEL] ?? x.category} {x.score}
                </span>
              ))}
            </div>
            {r.comment && <p className="mt-2 text-sm text-[var(--color-text-dim)]">{r.comment}</p>}
          </li>
        ))}
      </ul>

      {items.length < count && (
        <button
          onClick={() => void load(sort, items.length)}
          disabled={loading}
          className="w-full rounded-lg border border-[var(--color-line)] py-2 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)] disabled:opacity-50"
        >
          {loading ? "불러오는 중…" : "더 보기"}
        </button>
      )}
    </section>
  );
}
/* Footer: components/review/ReviewSection.tsx */
