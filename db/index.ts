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
import { resolveDatabaseUrl } from "./url";

// 주소 해석은 부작용 없는 모듈로 분리했다. 재노출만 한다.
export { resolveDatabaseUrl, resolveDirectDatabaseUrl } from "./url";

const isServerless = Boolean(process.env.VERCEL);

const globalForDb = globalThis as unknown as { __tieraPool?: Pool };

let pool: Pool | undefined = globalForDb.__tieraPool;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    // 주소가 없으면 **던지지 않고** "쿼리하면 실패하는 풀"을 돌려준다.
    // 여기서 던지면 drizzle()이 생성 시점에 프로퍼티를 읽는 순간(=import) 터져서,
    // 쿼리를 한 번도 안 하는 라우트까지 빌드의 "page data 수집" 단계에서 죽는다.
    // Preview 배포가 정확히 이렇게 매번 실패했다(운영 DB 주소는 Production에만 둔다).
    //
    // 가짜 객체가 아니라 진짜 Pool 인스턴스를 쓰는 이유: drizzle이 판별용으로 읽은
    // 값을 실제로 쓰기 때문에, 모양만 흉내 낸 객체는 다른 곳에서 깨진다(아래 주석).
    // 연결은 query/connect 때만 일어나므로 둘만 막으면 접속 시도 자체가 없다.
    //
    // 프로덕션에서 주소가 빠지는 사고는 빌드 단계의 db/migrate-deploy.ts가 막는다(SPEC 19.2).
    // 캐시하지 않는다 — 실행 중에 환경변수가 생길 일은 없지만, 가짜 풀을 붙잡아 둘 이유도 없다.
    const missing = () =>
      new Error("DB 접속 주소가 없습니다. DATABASE_URL 또는 POSTGRES_URL 중 하나를 설정하세요.");
    const unavailable = new Pool({ max: 1 });
    unavailable.query = (() => Promise.reject(missing())) as unknown as Pool["query"];
    unavailable.connect = (() => Promise.reject(missing())) as unknown as Pool["connect"];
    return unavailable;
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
 * drizzle은 생성 시점에 pool 객체를 요구하지만, 실제 커넥션은 쿼리 때 열린다.
 * 프록시로 감싸 풀 생성을 첫 접근까지 미룬다.
 *
 * 주의: "import만으로는 아무 일도 안 난다"가 아니다.
 * drizzle()은 인자가 설정 객체인지 판별하려고 생성 시점에 프로퍼티를 읽고,
 * 그 접근이 여기서 풀 생성을 트리거한다. (예전에는 그래서 주소가 없으면 import에서 던졌다.)
 * 판별용 접근에 undefined를 돌려주는 식으로 우회해봤지만, drizzle이 그 값을
 * 실제로 쓰기 때문에 빌드가 다른 곳에서 깨진다. 그대로 두는 편이 낫다.
 *
 * 그래서 getPool()은 주소가 없을 때 던지지 않고 "쿼리하면 실패하는 풀"을 돌려준다
 * (2026-11-24, Preview 빌드 실패 수정). import는 이제 항상 안전하고, 실패는 쿼리
 * 시점의 거부된 Promise로 나온다 — 각 호출부의 try/catch·에러 경계가 받는다.
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
