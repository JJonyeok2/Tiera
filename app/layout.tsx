/* Header: 루트 레이아웃. TierStarDefs를 여기서 딱 한 번 마운트한다 —
   별 컴포넌트가 참조하는 그라데이션 정의가 없으면 별이 검게 렌더된다. */
import { Suspense } from "react";
import type { Metadata } from "next";
import TierStarDefs from "@/components/tier/TierStarDefs";
import Header from "@/components/site/Header";
import UserMenu from "@/components/site/UserMenu";
import { ThemeProvider, themeInitScript } from "@/components/site/ThemeProvider";
import ThemeToggle from "@/components/site/ThemeToggle";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // metadataBase가 없으면 canonical·OG 이미지가 상대 경로로 나가서
  // 크롤러가 어떤 도메인을 정본으로 볼지 판단하지 못한다.
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    // 하위 페이지는 제목만 넘기면 뒤에 브랜드가 붙는다.
    template: "%s | Tiera",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // 사이트가 모델 순위표에서 도구 정보방으로 바뀌었는데 키워드는 옛 주제 그대로였다.
  // ('국산'은 화면 문구에서 뺐으므로 여기서도 쓰지 않는다.)
  keywords: [
    "AI 도구 추천",
    "무료 AI 도구",
    "한국어 AI",
    "대학생 AI",
    "AI 모델 순위",
    "AI 티어표",
  ],
  // canonical과 og:url은 여기서 정하지 않는다. 레이아웃 값은 하위 페이지가 그대로
  // 물려받아서, 예전에는 /about·/login이 "정본은 홈"이라고 검색엔진에 알리고 있었다.
  // 각 페이지가 자기 주소를 직접 적는다.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // 서치 콘솔 소유 확인 코드. 환경변수로 받아서 코드 수정 없이 붙였다 뗄 수 있게 한다.
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? { other: { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION } }
      : {}),
  },
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
          Tiera는 AI 도구를 쓸 일·가격·한국어로 골라보는 곳이에요. 점수 매기는 방식은{" "}
          <a className="underline hover:text-[var(--color-text-dim)]" href="/about">
            여기
          </a>
          에 적어 뒀어요.
          <br />
          {/* Artificial Analysis 데이터 이용 약관상 출처 표기는 필수다. 지우지 말 것. */}
          벤치마크 데이터 제공:{" "}
          <a
            className="underline hover:text-[var(--color-text-dim)]"
            href="https://artificialanalysis.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            Artificial Analysis
          </a>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
/* Footer: app/layout.tsx */
