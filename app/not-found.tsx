/* Header: 404 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm text-[var(--color-text-dim)]">찾으시는 페이지가 없습니다.</p>
      <Link href="/" className="mt-3 inline-block text-xs text-[var(--color-tier-prism)] hover:underline">
        랭킹으로 돌아가기
      </Link>
    </div>
  );
}
/* Footer: app/not-found.tsx */
