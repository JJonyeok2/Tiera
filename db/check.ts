/* ---------------------------------------------------------------------------
 * Header: DB 연결 점검
 *   npm run db:check
 *
 * 마이그레이션이 실패했을 때 "연결이 안 되는 것"과 "연결은 되는데 쿼리가
 * 실패하는 것"을 갈라 보기 위한 스크립트다. 원인을 끝까지 펼쳐서 찍는다.
 * 비밀번호는 어떤 경우에도 출력하지 않는다.
 * ------------------------------------------------------------------------- */
import "dotenv/config";
import { Pool } from "pg";
import { resolveDirectDatabaseUrl } from "./url";
import { explainError } from "./explain-error";

async function main() {
  const url = resolveDirectDatabaseUrl();
  if (!url) {
    console.error("DB 접속 주소가 없습니다. DATABASE_URL_UNPOOLED 또는 DATABASE_URL을 설정하세요.");
    process.exit(1);
  }

  let parsed: URL | undefined;
  try {
    parsed = new URL(url);
  } catch {
    console.error("주소 형식이 잘못됐습니다. 비밀번호에 특수문자(/ + $ = @ : ? #)가 있으면 깨집니다.");
    process.exit(1);
  }

  console.log(`호스트 : ${parsed.host}`);
  console.log(`사용자 : ${decodeURIComponent(parsed.username)}`);
  console.log(`DB     : ${parsed.pathname.replace(/^\//, "")}`);
  console.log("연결 시도 중…\n");

  const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15_000 });
  try {
    const r = await pool.query("select current_user, current_database(), version()");
    console.log("✅ 연결 성공");
    console.log(`   current_user : ${r.rows[0].current_user}`);
    console.log(`   database     : ${r.rows[0].current_database}`);
  } catch (e) {
    console.error("❌ 연결 실패\n");
    console.error(explainError(e));
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
/* Footer: db/check.ts */
