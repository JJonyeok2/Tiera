/* ---------------------------------------------------------------------------
 * Header: Next.js 설정.
 * ------------------------------------------------------------------------- */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 예전엔 "prisma"가 들어 있었다(이 프로젝트는 Drizzle이다). 그 바람에 db/와
  // scripts/가 린트 대상에서 빠져 있었다 — 시드 데이터와 배포 스크립트가 거기 있다.
  eslint: { dirs: ["app", "lib", "components", "db", "scripts"] },
  // OG 이미지가 assets/og의 글꼴을 fs로 읽는다. 배포 번들에 빠지면 한글이
  // 다시 네모로 나오거나 이미지 생성 자체가 실패한다. 명시적으로 넣어 둔다.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/og/**"],
  },
};

export default nextConfig;
/* Footer: next.config.ts */
