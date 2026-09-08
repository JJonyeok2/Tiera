/* ---------------------------------------------------------------------------
 * Header: 마이그레이션 실행
 *   npm run db:migrate
 *
 * drizzle-kit push는 스키마를 DB에 맞춰 "밀어넣는" 개발용 명령이라
 * 프로덕션에서 쓰면 안 된다 — 의도치 않은 DROP이 조용히 일어날 수 있다.
 * 프로덕션은 db/migrations의 SQL 파일을 순서대로 적용한다.
 *
 * pooler(PgBouncer)를 통과하면 마이그레이션이 깨질 수 있어
 * DATABASE_URL_UNPOOLED가 있으면 그쪽을 우선 쓴다.
 * ------------------------------------------------------------------------- */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { resolveDirectDatabaseUrl } from "./index";

const url = resolveDirectDatabaseUrl();
if (!url) {
  throw new Error(
    "DB 접속 주소가 없습니다. DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING / DATABASE_URL 중 하나를 설정하세요."
  );
}

const pool = new Pool({ connectionString: url, max: 1 });
await migrate(drizzle(pool), { migrationsFolder: "./db/migrations" });
await pool.end();
console.log("마이그레이션 완료");
/* Footer: db/migrate.ts */
