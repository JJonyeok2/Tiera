"use client";
/* Header: 상단 바 — 로고 / 검색 / 유틸(테마·계정).

   로고 옆 설명 문구는 뺐다. 바로 아래 ScoreTypeSwitch가 두 축을 이름과 개수까지
   보여주기 때문에 헤더에서 또 말하면 같은 문장이 화면에 두 번 나온다.

   점수 종류 전환은 여기 있었지만 목록 위로 옮겼다(ScoreTypeSwitch).
   사이트의 핵심 축이 테마·로그인 버튼 옆에 있으면 유틸리티처럼 보인다.

   검색어는 URL 쿼리에 반영한다. 공유 가능한 링크가 되어야 하고,
   뒤로가기가 기대대로 동작해야 하기 때문이다.

   검색은 홈(도구)과 /models(모델) 두 곳에서 동작한다. 찾는 대상이 다르므로
   안내 문구도 다르다. 이동 경로는 pathname을 그대로 쓴다 — '/'를 박아 두면
   /models에서 검색할 때마다 도구 목록으로 튕긴다. */

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
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
  }, [q, params, router, pathname]);



  // 검색이 의미 있는 두 화면. 상세·비교·소개에서는 입력창을 띄우지 않는다.
  const searchable = pathname === "/" || pathname === "/models";
  const placeholder = pathname === "/models" ? "모델 또는 개발사 검색" : "도구 검색";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]/92 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <TierStar tier="prism" size={24} />
          {/* leading-none이 없으면 줄상자(기본 line-height)가 글자보다 커서,
              박스를 기준으로 정렬해도 글자가 별보다 아래로 내려앉아 보인다. */}
          <span className="text-[17px] font-bold leading-none tracking-tight">Tiera</span>
        </Link>

        {searchable && (
          <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
            <label className="sr-only" htmlFor="site-search">
              {placeholder}
            </label>
            <input
              id="site-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] focus:border-[var(--color-tier-prism)] focus:outline-none"
            />
          </div>
        )}

        <div className={`flex shrink-0 items-center gap-3 ${searchable ? "" : "ml-auto"}`}>
          {themeToggle}
          {userMenu}
        </div>
      </div>
    </header>
  );
}
/* Footer: components/site/Header.tsx */
