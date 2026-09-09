"use client";
/* Header: 상단 바 — 로고 / 검색 / 유틸(테마·계정).

   점수 종류 전환은 여기 있었지만 목록 위로 옮겼다(ScoreTypeSwitch).
   사이트의 핵심 축이 테마·로그인 버튼 옆에 있으면 유틸리티처럼 보인다.

   검색어는 URL 쿼리에 반영한다. 공유 가능한 링크가 되어야 하고,
   뒤로가기가 기대대로 동작해야 하기 때문이다. */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import TierStar from "@/components/tier/TierStar";

export default function Header({
  userMenu,
  themeToggle,
}: {
  userMenu?: React.ReactNode;
  themeToggle?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");

  // 뒤로/앞으로 이동했을 때 입력창이 URL과 어긋나지 않도록 맞춘다.
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  // 300ms 디바운스 — 타자 한 글자마다 서버 컴포넌트를 다시 그리면 낭비다.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      startTransition(() => router.replace(`/?${next.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
  }, [q, params, router]);



  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]/92 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <TierStar tier="prism" size={24} />
          <span className="text-[17px] font-bold tracking-tight">Tiera</span>
          <span className="hidden text-[11px] text-[var(--color-text-mute)] sm:inline">
            벤치마크 vs 체감 평가
          </span>
        </Link>

        {onHome && (
          <>
            <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
              <label className="sr-only" htmlFor="model-search">
                모델 또는 개발사 검색
              </label>
              <input
                id="model-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="모델 또는 개발사 검색"
                className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] focus:border-[var(--color-tier-prism)] focus:outline-none"
              />
            </div>

          </>
        )}

        <div className={`flex shrink-0 items-center gap-3 ${onHome ? "" : "ml-auto"}`}>
          {themeToggle}
          {userMenu}
        </div>
      </div>
    </header>
  );
}
/* Footer: components/site/Header.tsx */
