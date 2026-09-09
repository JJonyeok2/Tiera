/* ---------------------------------------------------------------------------
 * Header: sitemap.xml 생성.
 *
 * 이 사이트의 검색 유입은 대부분 개별 모델 페이지에서 나온다("EXAONE 4.5 성능"
 * 같은 롱테일 질의). 그래서 모델 상세를 전부 sitemap에 올린다.
 *
 * DB를 읽으므로 빌드 타임이 아니라 요청 시점에 만든다. 모델이 동기화로 계속
 * 늘어나는데 빌드 시점에 고정하면 새 모델이 색인되지 않는다.
 *
 * 응답 시간에 상한을 둔다. 이 라우트는 콜드 스타트 + 원격 DB 연결이 겹칠 수 있는데,
 * 크롤러의 sitemap 페치는 인내심이 짧아서 한 번 느리면 "가져올 수 없음"으로 처리된다.
 * 제한 시간을 넘기면 정적 페이지만이라도 즉시 돌려주는 편이, 응답을 못 주는 것보다 낫다.
 *
 * 점수가 하나도 없는 모델은 제외한다. Artificial Analysis가 이름은 알려주지만
 * 평가 데이터가 없는 모델이 상당수인데(누락된 항목을 0으로 채우지 않기로 했으므로),
 * 그런 페이지는 전부 "데이터 없음"만 찍힌 빈 문서다. 이런 걸 sitemap으로 밀어넣으면
 * 얇은 콘텐츠로 취급돼 사이트 전체 평가가 깎이고 크롤링 예산만 낭비된다.
 * ------------------------------------------------------------------------- */
import type { MetadataRoute } from "next";
import { sql } from "drizzle-orm";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

/** DB가 이 시간 안에 답하지 않으면 정적 페이지만 내보낸다. */
const DB_TIMEOUT_MS = 5000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/?type=BENCHMARK"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    // db를 최상단에서 import하지 않는다. 접속 주소가 없으면 import 시점에 던지는데,
    // 그러면 이 try/catch가 잡지 못하고 sitemap 라우트가 통째로 죽는다.
    const { db } = await import("@/db");
    const query = db.execute<{ slug: string; created_at: Date }>(sql`
      SELECT m.slug, m.created_at
      FROM model m
      WHERE m.is_published
        AND EXISTS (SELECT 1 FROM model_score s WHERE s.model_id = m.id)
      ORDER BY m.created_at DESC
    `);

    const res = await Promise.race([
      query,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("sitemap db timeout")), DB_TIMEOUT_MS)
      ),
    ]);

    return [
      ...staticPages,
      ...(res.rows ?? []).map((m) => ({
        url: absoluteUrl(`/models/${m.slug}`),
        lastModified: new Date(m.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // DB가 죽었거나 느려도 sitemap 자체는 200으로 나가야 한다.
    // 여기서 500을 내거나 응답이 늘어지면 크롤러가 sitemap을 통째로 버린다.
    return staticPages;
  }
}
/* Footer: app/sitemap.ts */
