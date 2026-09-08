/* Header: 헤더 우측 로그인 상태. 서버 컴포넌트라 세션을 직접 읽는다. */
import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function UserMenu() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Link href="/login" className="text-xs text-[var(--color-text-mute)] hover:text-[var(--color-text-dim)]">
        로그인
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[110px] truncate text-xs text-[var(--color-text-dim)]">
        {session.user.name ?? session.user.email}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className="text-xs text-[var(--color-text-mute)] hover:text-[var(--color-text-dim)]">
          로그아웃
        </button>
      </form>
    </div>
  );
}
/* Footer: components/site/UserMenu.tsx */
