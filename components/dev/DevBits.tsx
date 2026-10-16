/* ---------------------------------------------------------------------------
 * Header: 개발자 섹션 공용 작은 조각들 — 페이지 머리말, 배지, 바깥 링크. SPEC 23.24.
 *
 * 다섯 페이지가 같은 모양의 제목·확인 날짜·배지를 쓰도록 여기 모은다.
 * 바깥 링크는 전부 rel="noopener noreferrer nofollow" — 남의 사이트에 순위 신호를 주지 않는다.
 * ------------------------------------------------------------------------- */
import { DEV_CHECKED_AT } from "@/lib/dev/harnesses";

export function DevHeading({ title, lead }: { title: string; lead: React.ReactNode }) {
  return (
    <header className="space-y-2">
      <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[var(--color-text)]">{title}</h1>
      <p className="max-w-2xl text-[14.5px] leading-relaxed text-[var(--color-text-dim)]">{lead}</p>
      <p className="text-[12px] text-[var(--color-text-mute)]" data-testid="dev-checked">
        {DEV_CHECKED_AT} 공식 문서로 확인 · 이 분야는 자주 바뀌어요. 설치 전에 링크된 문서를 한 번 더 보세요.
      </p>
    </header>
  );
}

export function Badge({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: "plain" | "good" | "warn";
}) {
  const cls =
    tone === "good"
      ? "border-[var(--color-up)]/40 text-[var(--color-up)]"
      : tone === "warn"
        ? "border-[var(--color-down)]/40 text-[var(--color-down)]"
        : "border-[var(--color-line)] text-[var(--color-text-dim)]";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11.5px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

export function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-[13px] font-medium text-[var(--color-text)] underline decoration-[var(--color-line)] underline-offset-4 hover:decoration-[var(--color-text)]"
    >
      {children} ↗
    </a>
  );
}

/** 주의사항 한 줄. 스킬·MCP는 내 권한으로 코드를 돌리므로 눈에 띄게 둔다. */
export function Caution({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-[13px] leading-relaxed text-[var(--color-text-dim)]">
      <span className="mr-1 font-semibold text-[var(--color-down)]">주의</span>
      {children}
    </p>
  );
}
/* Footer: components/dev/DevBits.tsx */
