"use client";
/* Header: 5점 별점 입력. 라디오 그룹 시맨틱을 써서 키보드로도 조작할 수 있다.
   "평가 안 함"이 별도 상태인 이유: 안 써본 카테고리를 억지로 매기게 하면
   점수가 오염된다. 미평가는 계산에서 통째로 빠진다. */

export default function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const name = `rating-${label}`;
  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <span className="w-16 shrink-0 text-sm text-[var(--color-text-dim)]">{label}</span>

      <div role="radiogroup" aria-label={`${label} 평점`} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === n}
              onChange={() => onChange(n)}
            />
            <span
              aria-label={`${n}점`}
              className={`inline-block text-xl leading-none transition ${
                value !== null && n <= value
                  ? "text-[var(--color-tier-gold)]"
                  : "text-[var(--color-surface-2)] hover:text-[var(--color-text-mute)]"
              }`}
            >
              ★
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className={`rounded px-2 py-1 text-[11px] transition ${
          value === null
            ? "bg-[var(--color-surface-2)] text-[var(--color-text-dim)]"
            : "text-[var(--color-text-mute)] hover:text-[var(--color-text-dim)]"
        }`}
      >
        평가 안 함
      </button>
    </div>
  );
}
/* Footer: components/review/RatingInput.tsx */
