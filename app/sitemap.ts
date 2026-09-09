/* ---------------------------------------------------------------------------
 * Header: sitemap.xml 생성.
 *
 * 이 사이트의 검색 유입은 대부분 개별 모델 페이지에서 나온다("EXAONE 4.5 성능"
 * 같은 롱테일 질의). 그래서 모델 상세를 전부 sitemap에 올린다.
 *
 * DB를 읽으므로 빌드 타임이 아니라 요청 시점에 만든다. 모델이 동기화로 계속
 * 늘어나는데 빌드 시점에 고정하면 새 모델이 색인되지 않는다.
 * ------------------------------------------------------------------------- */
import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/?type=BENCHMARK"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const rows = await db
      .select({ slug: models.slug, createdAt: models.createdAt })
      .from(models)
      .where(eq(models.isPublished, true))
      .orderBy(desc(models.createdAt));

    return [
      ...staticPages,
      ...rows.map((m) => ({
        url: absoluteUrl(`/models/${m.slug}`),
        lastModified: m.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // DB가 잠깐 죽어도 sitemap 자체는 200으로 나가야 한다.
    // 여기서 500을 내면 크롤러가 sitemap을 통째로 버린다.
    return staticPages;
  }
}
/* Footer: app/sitemap.ts */
