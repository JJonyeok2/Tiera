/* ---------------------------------------------------------------------------
 * Header: 마이그레이션 실행
 *   npm run db:migrate
 *
 * drizzle-kit push는 스키마를 DB에 맞춰 "밀어넣는" 개발용 명령이라
 * 프로덕션에서 쓰면 안 된다 — 의도치 않은 DROP이 조용히 일어날 수 있다.
 * 프로덕션은 db/migrations의 SQL 파일을 순서대로 적용한다.
 *
 * 최상위 await를 쓰지 않는다. package.json에 "type":"module"이 없으면
 * tsx가 CJS로 변환하는데, CJS는 최상위 await를 지원하지 않아 실행이 깨진다.
 * ------------------------------------------------------------------------- */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { resolveDirectDatabaseUrl } from "./url";
import { explainError } from "./explain-error";

async function main() {
  const url = resolveDirectDatabaseUrl();
  if (!url) {
    throw new Error(
      "DB 접속 주소가 없습니다. DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING / DATABASE_URL 중 하나를 설정하세요."
    );
  }

  // 어디에 적용하는지 눈으로 확인할 수 있게 호스트만 찍는다. 비밀번호는 절대 찍지 않는다.
  try {
    console.log(`대상 호스트: ${new URL(url).host}`);
  } catch {
    console.log("대상 호스트: (주소 형식을 해석하지 못했습니다)");
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  await migrate(drizzle(pool), { migrationsFolder: "./db/migrations" });
  await pool.end();
  console.log("마이그레이션 완료");
}

main().catch((e) => {
  console.error("마이그레이션 실패\n");
  console.error(explainError(e));
  process.exit(1);
});
/* Footer: db/migrate.ts */
