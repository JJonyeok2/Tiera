/* ---------------------------------------------------------------------------
 * Header: 모델 보기 방식 전환 — 순위 목록(/models) ↔ 티어표(/tiers).
 *
 * 같은 점수를 두 모양으로 보여준다. 목록은 "몇 등인지", 티어표는 "어느 급인지"를
 * 한눈에 보게 한다. 카테고리(scope)·점수 종류(type)·국가(country) 쿼리는 그대로
 * 넘겨서, 코딩 목록을 보다가 누르면 코딩 티어표가 나온다.
 *
 * 링크라서 JS 없이도 동작하고, 새 탭으로 열 수도 있다.
 * ------------------------------------------------------------------------- */
import Link from "next/link";

type View = "list" | "tiers";

const VIEWS: { value: View; label: string; path: string }[] = [
  { value: "list", label: "순위 목록", path: "/models" },
  { value: "tiers", label: "티어표", path: "/tiers" },
];

/** 두 화면이 함께 쓰는 쿼리만 넘긴다. q·page 같은 건 화면마다 뜻이 달라 버린다. */
const SHARED_KEYS = ["scope", "type", "country"] as const;

export default function ViewSwitch({
  current,
  searchParams,
}: {
  current: View;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const qs = new URLSearchParams();
  for (const k of SHARED_KEYS) {
    const v = searchParams[k];
    if (typeof v === "string" && v) qs.set(k, v);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return (
    <nav
      aria-label="보기 방식"
      className="inline-flex rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-1"
    >
      {VIEWS.map((v) => {
        const active = v.value === current;
        return (
          <Link
            key={v.value}
            href={`${v.path}${suffix}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition ${
              active
                ? "bg-[var(--color-text)] text-[var(--color-bg)]"
                : "text-[var(--color-text-mute)] hover:text-[var(--color-text)]"
            }`}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
/* Footer: components/ranking/ViewSwitch.tsx */
