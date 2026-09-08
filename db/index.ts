/* ---------------------------------------------------------------------------
 * Header: DB 커넥션
 *
 * 실행 환경이 둘이라 풀 전략이 다르다.
 *
 * [로컬 dev] Next.js의 HMR은 모듈을 반복 평가한다. globalThis에 붙이지 않으면
 *   리로드마다 새 풀이 생겨 Postgres의 max_connections를 금방 넘긴다.
 *
 * [서버리스(Vercel)] 람다 인스턴스마다 이 모듈이 따로 평가된다. 인스턴스당
 *   커넥션을 10개씩 잡으면 동시 요청 20개만 들어와도 200 커넥션이 되어
 *   Neon/Supabase의 상한을 그대로 터뜨린다. 그래서 인스턴스당 1개만 잡고,
 *   실제 풀링은 DB 쪽 pooler(PgBouncer)에 맡긴다.
 *   → DATABASE_URL에 반드시 **pooled** 엔드포인트를 넣을 것.
 *      (Neon: -pooler가 붙은 호스트 / Supabase: 6543 포트)
 *
 * 마이그레이션은 pooler를 통과하면 안 된다(prepared statement 문제).
 * 그래서 DATABASE_URL_UNPOOLED를 따로 둔다 — db/migrate.ts가 이걸 쓴다.
 * ------------------------------------------------------------------------- */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const isServerless = Boolean(process.env.VERCEL);

const globalForDb = globalThis as unknown as { __tieraPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  }
  return new Pool({
    connectionString,
    max: isServerless ? 1 : 10,
    // 서버리스에서는 유휴 커넥션을 오래 붙들고 있을 이유가 없다.
    idleTimeoutMillis: isServerless ? 10_000 : 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

const pool = globalForDb.__tieraPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__tieraPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
/* Footer: db/index.ts */
