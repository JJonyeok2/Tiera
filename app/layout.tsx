/* Header: 루트 레이아웃. TierStarDefs를 여기서 딱 한 번 마운트한다 —
   별 컴포넌트가 참조하는 그라데이션 정의가 없으면 별이 검게 렌더된다. */
import { Suspense } from "react";
import type { Metadata } from "next";
import TierStarDefs from "@/components/tier/TierStarDefs";
import Header from "@/components/site/Header";
import UserMenu from "@/components/site/UserMenu";
import { ThemeProvider, themeInitScript } from "@/components/site/ThemeProvider";
import ThemeToggle from "@/components/site/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiera — AI 모델 커뮤니티 평가",
  description:
    "벤치마크 점수와 커뮤니티 체감 평가를 나란히 보는 AI 모델 티어. 재미로 보는 AI 티어표.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 저장된 테마를 첫 페인트 전에 박는다. 없으면 다크 사용자에게 흰 화면이 번쩍인다. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
        <TierStarDefs />
        {/* Header는 useSearchParams를 쓴다. Suspense로 감싸지 않으면
            루트 레이아웃에 있다는 이유로 모든 정적 페이지의 프리렌더가 깨진다. */}
        <Suspense fallback={<div className="h-[57px] border-b border-[var(--color-line)]" />}>
          <Header userMenu={<UserMenu />} themeToggle={<ThemeToggle />} />
        </Suspense>
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-xs text-[var(--color-text-mute)] sm:px-6">
          Tiera는 재미로 보는 AI 티어표입니다. 점수 산정 방식은{" "}
          <a className="underline hover:text-[var(--color-text-dim)]" href="/about">
            여기
          </a>
          에서 볼 수 있습니다.
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
/* Footer: app/layout.tsx */
