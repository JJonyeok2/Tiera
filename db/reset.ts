/* Header: 개발용 스키마 초기화. public 스키마를 통째로 비운다. 프로덕션 금지. */
import { Pool } from "pg";
import "dotenv/config";

if (process.env.NODE_ENV === "production") {
  throw new Error("db/reset.ts는 프로덕션에서 실행할 수 없다.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
await pool.end();
console.log("schema reset");
/* Footer: db/reset.ts */
