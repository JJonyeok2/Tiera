"use client";
/* Header: 리뷰 작성/수정 폼. */

import { useState } from "react";
import RatingInput from "./RatingInput";
import { CATEGORY_LABEL } from "@/lib/labels";
import { CATEGORY_VALUES, REVIEW_COMMENT_MAX } from "@/lib/validation";

type Ratings = Partial<Record<(typeof CATEGORY_VALUES)[number], number>>;

export default function ReviewForm({
  slug,
  existing,
  onDone,
}: {
  slug: string;
  existing: { id: string; comment: string | null; ratings: { category: string; score: number }[] } | null;
  onDone: () => void | Promise<void>;
}) {
  const [ratings, setRatings] = useState<Ratings>(() => {
    const init: Ratings = {};
    for (const r of existing?.ratings ?? []) init[r.category as keyof Ratings] = r.score;
    return init;
  });
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const payload = {
    ratings: CATEGORY_VALUES.flatMap((c) =>
      ratings[c] ? [{ category: c, score: ratings[c]! }] : []
    ),
    comment: comment.trim() || undefined,
  };
  const valid = payload.ratings.length > 0 && comment.length <= REVIEW_COMMENT_MAX;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        existing ? `/api/reviews/${existing.id}` : `/api/models/${slug}/reviews`,
        {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "저장에 실패했습니다.");
      }
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${existing.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <p className="mb-1 text-sm font-semibold text-[var(--color-text)]">
        {existing ? "내 평가 수정" : "이 모델 평가하기"}
      </p>
      <p className="mb-3 text-[11px] text-[var(--color-text-mute)]">
        써본 항목만 평가해 주세요. 건너뛴 항목은 점수 계산에서 빠집니다.
      </p>

      {CATEGORY_VALUES.map((c) => (
        <RatingInput
          key={c}
          label={CATEGORY_LABEL[c]}
          value={ratings[c] ?? null}
          onChange={(v) => setRatings((prev) => ({ ...prev, [c]: v ?? undefined }))}
        />
      ))}

      <label className="mt-3 block">
        <span className="text-xs text-[var(--color-text-dim)]">한줄평 (선택)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={REVIEW_COMMENT_MAX}
          placeholder="어떤 작업에 써봤고 어땠는지 적어주세요."
          className="mt-1 w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-text-mute)] focus:border-[var(--color-tier-prism)] focus:outline-none"
        />
        <span className="mt-1 block text-right text-[11px] tabular-nums text-[var(--color-text-mute)]">
          {comment.length} / {REVIEW_COMMENT_MAX}
        </span>
      </label>

      {error && <p className="mt-2 text-xs text-[var(--color-down)]">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={submit}
          disabled={!valid || busy}
          className="rounded-lg bg-[var(--color-tier-prism)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {busy ? "저장 중…" : existing ? "수정하기" : "평가 등록"}
        </button>
        <button onClick={() => void onDone()} className="text-xs text-[var(--color-text-mute)] hover:underline">
          취소
        </button>
        {existing && (
          <button
            onClick={remove}
            disabled={busy}
            className="ml-auto text-xs text-[var(--color-down)] hover:underline disabled:opacity-40"
          >
            평가 삭제
          </button>
        )}
      </div>
      {!valid && payload.ratings.length === 0 && (
        <p className="mt-2 text-[11px] text-[var(--color-text-mute)]">
          최소 한 개 카테고리는 평가해야 등록할 수 있습니다.
        </p>
      )}
    </div>
  );
}
/* Footer: components/review/ReviewForm.tsx */
