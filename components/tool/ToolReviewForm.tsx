"use client";
/* ---------------------------------------------------------------------------
 * Header: 도구 후기 작성/수정 폼.
 *
 * 모델 쪽 ReviewForm과 같은 흐름이지만 묻는 것이 다르다.
 * 모델은 능력(코딩·추론)을 묻고, 여기는 **써본 경험**을 묻는다 —
 * 쉬웠나 / 결과물이 쓸 만했나 / 값어치를 했나 / 한국어가 됐나.
 *
 * 축 이름만 쓰지 않고 질문을 같이 보여준다. '가격'만 덩그러니 있으면
 * "싼가"인지 "값어치를 하는가"인지 사람마다 다르게 읽고, 그러면 점수가 섞인다.
 * ------------------------------------------------------------------------- */

import { useState } from "react";
import RatingInput from "@/components/review/RatingInput";
import { TOOL_AXIS_LABEL, TOOL_AXIS_QUESTION } from "@/lib/labels";
import { REVIEW_COMMENT_MAX, TOOL_AXIS_VALUES } from "@/lib/validation";

type Axis = (typeof TOOL_AXIS_VALUES)[number];
type Ratings = Partial<Record<Axis, number>>;

export default function ToolReviewForm({
  slug,
  existing,
  onDone,
}: {
  slug: string;
  existing: {
    id: string;
    comment: string | null;
    isAnonymous?: boolean;
    ratings: { axis: string; score: number }[];
  } | null;
  onDone: () => void | Promise<void>;
}) {
  const [ratings, setRatings] = useState<Ratings>(() => {
    const init: Ratings = {};
    for (const r of existing?.ratings ?? []) init[r.axis as Axis] = r.score;
    return init;
  });
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [anonymous, setAnonymous] = useState(existing?.isAnonymous ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const payload = {
    ratings: TOOL_AXIS_VALUES.flatMap((a) => (ratings[a] ? [{ axis: a, score: ratings[a]! }] : [])),
    comment: comment.trim() || undefined,
    isAnonymous: anonymous,
  };
  const valid = payload.ratings.length > 0 && comment.length <= REVIEW_COMMENT_MAX;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        existing ? `/api/tool-reviews/${existing.id}` : `/api/tools/${slug}/reviews`,
        {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "저장하지 못했어요.");
      }
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tool-reviews/${existing.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제하지 못했어요.");
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <p className="mb-1 text-sm font-semibold text-[var(--color-text)]">
        {existing ? "내 후기 수정" : "써보고 남기기"}
      </p>
      <p className="mb-3 text-[11px] text-[var(--color-text-mute)]">
        써본 항목만 평가해 주세요. 건너뛴 항목은 점수 계산에서 빠집니다.
      </p>

      {TOOL_AXIS_VALUES.map((a) => (
        <div key={a}>
          <RatingInput
            label={TOOL_AXIS_LABEL[a]}
            value={ratings[a] ?? null}
            onChange={(v) => setRatings((prev) => ({ ...prev, [a]: v ?? undefined }))}
          />
          {/* 축 이름 아래에 질문을 붙인다. 기준이 사람마다 갈리면 점수가 섞인다. */}
          <p className="mb-1 ml-[76px] text-[11px] text-[var(--color-text-mute)]">
            {TOOL_AXIS_QUESTION[a]}
          </p>
        </div>
      ))}

      <label className="mt-3 block">
        <span className="text-xs text-[var(--color-text-dim)]">한줄평 (선택)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={REVIEW_COMMENT_MAX}
          placeholder="어떤 일에 써봤고 어땠는지 적어주세요."
          className="mt-1 w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-text-mute)] focus:border-[var(--color-tier-prism)] focus:outline-none"
        />
        <span className="mt-1 block text-right text-[11px] tabular-nums text-[var(--color-text-mute)]">
          {comment.length} / {REVIEW_COMMENT_MAX}
        </span>
      </label>

      <label className="mt-3 flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="mt-[3px] accent-[var(--color-tier-prism)]"
        />
        <span className="text-xs text-[var(--color-text-dim)]">
          익명으로 남기기
          <span className="mt-0.5 block text-[11px] text-[var(--color-text-mute)]">
            목록에 이름 대신 &lsquo;익명&rsquo;으로 표시됩니다. 수정·삭제는 그대로 할 수 있어요.
          </span>
        </span>
      </label>

      {error && <p className="mt-2 text-xs text-[var(--color-down)]">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={submit}
          disabled={!valid || busy}
          className="rounded-lg bg-[var(--color-tier-prism)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {busy ? "저장 중…" : existing ? "수정하기" : "후기 등록"}
        </button>
        <button
          onClick={() => void onDone()}
          className="text-xs text-[var(--color-text-mute)] hover:underline"
        >
          취소
        </button>
        {existing && (
          <button
            onClick={remove}
            disabled={busy}
            className="ml-auto text-xs text-[var(--color-down)] hover:underline disabled:opacity-40"
          >
            후기 삭제
          </button>
        )}
      </div>
      {!valid && payload.ratings.length === 0 && (
        <p className="mt-2 text-[11px] text-[var(--color-text-mute)]">
          최소 한 개 항목은 평가해야 등록할 수 있습니다.
        </p>
      )}
    </div>
  );
}
/* Footer: components/tool/ToolReviewForm.tsx */
