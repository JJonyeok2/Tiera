"use client";
/* Header: 상단 바 — 로고 / 검색 / 유틸(테마·계정).

   로고 옆 설명 문구는 뺐다. 홈은 히어로가, /models는 ScoreTypeSwitch가 바로
   아래에서 그 페이지가 뭔지 말해주므로 헤더에서 또 말하면 두 번 나온다.

   모델 점수 종류 전환도 여기 있었지만 /models 목록 위로 옮겼다.
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

/** 헤더 링크. 순서가 곧 화면 순서다 */
const NAV: { href: string; label: string; match: (path: string) => boolean }[] = [
  { href: "/usage", label: "사용량", match: (p) => p === "/usage" },
  { href: "/local", label: "내 PC로", match: (p) => p.startsWith("/local") },
  { href: "/dev", label: "개발자", match: (p) => p.startsWith("/dev") },
  { href: "/tiers", label: "티어표", match: (p) => p === "/tiers" },
];

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
      startTransition(() =>
        router.replace(`${pathname}?${next.toString()}`, { scroll: false }),
      );
    }, 300);
    return () => clearTimeout(t);
  }, [q, params, router, pathname]);

  // 검색이 의미 있는 두 화면. 상세·비교·소개에서는 입력창을 띄우지 않는다.
  const searchable = pathname === "/" || pathname === "/models";
  // 홈 검색은 이름만이 아니라 하려는 일도 찾는다(lib/search.ts). 예시를 placeholder에
  // 넣어 둬야 "이름을 알아야 검색할 수 있다"고 생각하지 않는다.
  const placeholder =
    pathname === "/models"
      ? "모델 또는 개발사 검색"
      : "도구 이름이나 하려는 일 (예: PPT, 번역)";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]/92 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <TierStar tier="prism" size={24} />
          {/* leading-none이 없으면 줄상자(기본 line-height)가 글자보다 커서,
              박스를 기준으로 정렬해도 글자가 별보다 아래로 내려앉아 보인다. */}
          <span className="text-[17px] font-bold leading-none tracking-tight">
            Tiera
          </span>
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

        {/* 모바일에서는 검색창이 둘째 줄로 내려가서 첫 줄에 로고와 이 묶음만 남는다.
            그때 ml-auto가 없으면 로고 바로 옆에 붙어서, 검색창 있는 화면(홈)과
            없는 화면(상세)에서 버튼 위치가 달라졌다. 데스크톱에서는 검색창이
            flex-1로 남은 폭을 먹으므로 ml-auto가 있어도 결과가 같다. */}
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {/* 페이지 링크 묶음과 유틸(테마·계정)을 눈으로 나눈다. 예전에는 링크 네 개와 버튼이
              같은 간격으로 한 줄에 늘어서 어디까지가 메뉴인지 안 보였다(2026-11-24 피드백).
              - 링크는 테두리 있는 알약 하나로 묶고, 현재 페이지는 칸을 채운다.
              - 그 오른쪽에 세로 구분선을 두고 테마·로그인을 놓는다.
              링크 순서의 근거: 사용량(SPEC 26)·내 PC로(SPEC 25)는 일반 사용자용이라 앞,
              개발자(SPEC 23.24)·티어표(사이트 이름의 뿌리)는 뒤. */}
          <nav
            aria-label="주요 메뉴"
            className="flex items-center rounded-full border border-[var(--color-line)] p-0.5"
          >
            {NAV.map((n) => {
              const on = n.match(pathname);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] transition hover:text-[var(--color-text)] ${
                    on
                      ? "bg-[var(--color-surface-2)] font-semibold text-[var(--color-text)]"
                      : "text-[var(--color-text-mute)]"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <span aria-hidden className="h-5 w-px bg-[var(--color-line)]" />
          {themeToggle}
          {userMenu}
        </div>
      </div>
    </header>
  );
}
/* Footer: components/site/Header.tsx */
