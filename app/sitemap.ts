/* ---------------------------------------------------------------------------
 * Header: sitemap.xml 생성.
 *
 * 검색 유입은 개별 상세 페이지에서 나온다. 모델은 "EXAONE 4.5 성능" 같은
 * 개발자 질의, 도구는 "발표자료 AI 추천" 같은 일반 질의다. 둘 다 올린다.
 *
 * 도구는 모델과 달리 점수가 없어도 올린다. 모델 상세는 점수가 없으면 "데이터 없음"만
 * 찍힌 빈 문서지만, 도구 상세는 후기가 0개여도 설명·시작법·가격·한국어가 전부 차 있다.
 * 얇은 문서가 아니므로 뺄 이유가 없다.
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
    { url: absoluteUrl("/models"), changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    // db를 최상단에서 import하지 않는다. 접속 주소가 없으면 import 시점에 던지는데,
    // 그러면 이 try/catch가 잡지 못하고 sitemap 라우트가 통째로 죽는다.
    const { db } = await import("@/db");
    const query = Promise.all([
      db.execute<{ slug: string; created_at: Date }>(sql`
        SELECT m.slug, m.created_at
        FROM model m
        WHERE m.is_published
          AND EXISTS (SELECT 1 FROM model_score s WHERE s.model_id = m.id)
        ORDER BY m.created_at DESC
      `),
      // created_at이 아니라 updated_at이다. 설명을 고쳐도 lastmod가 그대로면
      // 검색엔진이 다시 읽으러 올 이유가 없다(db/schema.ts tool.updatedAt 참고).
      db.execute<{ slug: string; updated_at: Date }>(sql`
        SELECT t.slug, t.updated_at
        FROM tool t
        WHERE t.is_published
        ORDER BY t.updated_at DESC
      `),
    ]);

    const [modelRes, toolRes] = await Promise.race([
      query,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("sitemap db timeout")), DB_TIMEOUT_MS)
      ),
    ]);

    // 홈은 도구 목록이라, 가장 최근에 바뀐 도구 시각을 홈의 lastmod로 쓴다.
    const newest = (toolRes.rows ?? [])[0]?.updated_at;
    return [
      ...staticPages.map((p) =>
        p.url === absoluteUrl("/") && newest ? { ...p, lastModified: new Date(newest) } : p
      ),
      // 도구를 모델보다 위·높은 우선순위로 둔다. 이제 이쪽이 사이트의 정면이다.
      ...(toolRes.rows ?? []).map((t) => ({
        url: absoluteUrl(`/tools/${t.slug}`),
        lastModified: new Date(t.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      ...(modelRes.rows ?? []).map((m) => ({
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
