"use client";
/* Header: 국가 칩 + 카테고리 탭. 상태는 전부 URL 쿼리에 있다. */

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { COUNTRIES, SCOPES } from "@/lib/params";
import { CATEGORY_LABEL, COUNTRY_LABEL } from "@/lib/labels";

export default function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const country = params.get("country") ?? "";
  const scope = params.get("scope") ?? "OVERALL";

  function push(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`/?${next.toString()}`, { scroll: false }));
  }

  return (
    <div className={`space-y-3 py-5 ${pending ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="개발사 국가">
        <Chip label="전체" active={country === ""} onClick={() => push("country", null)} />
        {COUNTRIES.map((c) => (
          <Chip
            key={c}
            label={COUNTRY_LABEL[c]}
            active={country === c}
            onClick={() => push("country", c)}
          />
        ))}
      </div>

      <div role="tablist" aria-label="평가 카테고리" className="flex flex-wrap gap-1.5">
        {SCOPES.map((s) => {
          const active = scope === s;
          return (
            <button
              key={s}
              role="tab"
              aria-selected={active}
              onClick={() => push("scope", s === "OVERALL" ? null : s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                  : "text-[var(--color-text-mute)] hover:text-[var(--color-text-dim)]"
              }`}
            >
              {CATEGORY_LABEL[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "border-[var(--color-text-dim)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
          : "border-[var(--color-line)] text-[var(--color-text-mute)] hover:border-[var(--color-text-mute)] hover:text-[var(--color-text-dim)]"
      }`}
    >
      {label}
    </button>
  );
}
/* Footer: components/ranking/FilterBar.tsx */
