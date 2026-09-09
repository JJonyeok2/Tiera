/* Header: robots.txt 생성.
   /api와 /login은 색인 가치가 없고, 검색 결과 페이지(?q=)는 중복 문서를 만든다. */
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
/* Footer: app/robots.ts */
