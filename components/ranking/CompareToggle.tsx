"use client";
/* Header: 행의 비교 체크박스. 행 전체가 링크이므로 이벤트 전파를 끊는다. */
import { MAX_COMPARE, useCompare } from "./CompareContext";

export default function CompareToggle({ slug, name }: { slug: string; name: string }) {
  const { has, toggle, full } = useCompare();
  const checked = has(slug);
  const disabled = !checked && full;

  return (
    <label
      onClick={(e) => e.stopPropagation()}
      title={disabled ? `비교는 최대 ${MAX_COMPARE}개까지 가능합니다` : "비교에 추가"}
      className={`flex shrink-0 items-center ${disabled ? "cursor-not-allowed opacity-35" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        className="size-4 accent-[var(--color-tier-prism)]"
        checked={checked}
        disabled={disabled}
        onChange={() => toggle({ slug, name })}
        aria-label={`${name} 비교에 추가`}
      />
    </label>
  );
}
/* Footer: components/ranking/CompareToggle.tsx */
