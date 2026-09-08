/* ---------------------------------------------------------------------------
 * Header: DB 커넥션
 *
 * 커넥션 풀을 **지연 생성**한다. 이게 이 파일의 핵심이다.
 *
 * `next build`는 프리렌더를 위해 모든 라우트 모듈을 한 번씩 평가한다.
 * 이때 DATABASE_URL이 없을 수 있다(예: Vercel에서 환경변수를 아직 안 넣었거나
 * 빌드 환경에 노출하지 않은 경우). 모듈 최상단에서 던지면 쿼리를 한 번도
 * 하지 않는 페이지까지 빌드가 통째로 깨진다.
 * 그래서 여기서는 절대 던지지 않고, 실제로 쿼리가 나가는 순간에 검사한다.
 *
 * 풀 크기는 실행 환경에 따라 다르다.
 * [로컬 dev] HMR이 모듈을 반복 평가하므로 globalThis에 붙여 재사용한다.
 *   안 그러면 리로드마다 새 풀이 생겨 max_connections를 금방 넘긴다.
 * [서버리스(Vercel)] 람다 인스턴스마다 이 모듈이 따로 평가된다. 인스턴스당
 *   10개씩 잡으면 동시 요청 20개에 200 커넥션이 되어 상한을 그대로 터뜨린다.
 *   인스턴스당 1개만 잡고 실제 풀링은 DB 쪽 pooler(PgBouncer)에 맡긴다.
 *   → DATABASE_URL에 반드시 **pooled** 엔드포인트를 넣을 것.
 * ------------------------------------------------------------------------- */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

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

const isServerless = Boolean(process.env.VERCEL);

const globalForDb = globalThis as unknown as { __tieraPool?: Pool };

let pool: Pool | undefined = globalForDb.__tieraPool;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "DB 접속 주소가 없습니다. DATABASE_URL 또는 POSTGRES_URL 중 하나를 설정하세요."
    );
  }

  pool = new Pool({
    connectionString,
    max: isServerless ? 1 : 10,
    idleTimeoutMillis: isServerless ? 10_000 : 30_000,
    connectionTimeoutMillis: 10_000,
  });

  if (process.env.NODE_ENV !== "production") globalForDb.__tieraPool = pool;
  return pool;
}

/**
 * drizzle은 생성 시점에 pool 객체를 요구하지만, 실제로 건드리는 건 쿼리 때다.
 * 프록시로 감싸 첫 접근까지 생성을 미룬다 — 덕분에 import만으로는 아무 일도 안 난다.
 */
const lazyPool = new Proxy({} as Pool, {
  get(_target, prop) {
    const p = getPool() as unknown as Record<string | symbol, unknown>;
    const value = p[prop];
    return typeof value === "function" ? value.bind(p) : value;
  },
});

export const db = drizzle(lazyPool, { schema });
export { schema };
/* Footer: db/index.ts */
