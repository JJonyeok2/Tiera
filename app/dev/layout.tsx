/* ---------------------------------------------------------------------------
 * Header: 개발자 섹션(/dev) 공용 레이아웃. SPEC 23.24.
 *
 * 홈은 "AI를 처음 고르는 사람"용이라, 하네스·스킬·MCP 같은 개발자 내용은 여기로 분리했다.
 * 모든 하위 페이지가 같은 탭을 위에 둔다.
 * ------------------------------------------------------------------------- */
import Link from "next/link";
import DevNav from "@/components/dev/DevNav";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16 pt-7">
      <Link href="/" className="text-[13px] text-[var(--color-text-mute)] hover:underline">
        ← 도구로 돌아가기
      </Link>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-mute)]">
        개발자용
      </p>
      <div className="mt-2">
        <DevNav />
      </div>
      <div className="mt-7">{children}</div>
    </div>
  );
}
/* Footer: app/dev/layout.tsx */
