/* ---------------------------------------------------------------------------
 * Header: DB 접속 주소 해석 — 부작용이 없는 모듈.
 *
 * 커넥션 풀을 만드는 db/index.ts와 분리해 둔다. 마이그레이션 스크립트처럼
 * "주소만 알면 되는" 코드가 index를 import하면 풀 생성 경로까지 끌려들어와서,
 * 주소가 없을 때 친절한 안내 대신 raw 스택으로 죽는다.
 * ------------------------------------------------------------------------- */

/**
 * 접속 주소를 찾는 순서.
 *
 * Vercel의 Supabase/Postgres 연동은 환경변수를 자기 이름으로 자동 주입한다
 * (POSTGRES_URL 등). 사용자가 DATABASE_URL을 손으로 또 넣게 만들 이유가 없어서
 * 그 이름들도 그대로 받아준다. 앞에 있는 것이 이긴다.
 */
export function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||          // Vercel 연동(풀링됨)
    process.env.POSTGRES_PRISMA_URL ||   // 〃
    undefined
  );
}

/** 마이그레이션용 — 풀러를 통과하지 않는 직결 주소를 우선한다. */
export function resolveDirectDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING || // Vercel 연동(직결)
    resolveDatabaseUrl()
  );
}
/* Footer: db/url.ts */
