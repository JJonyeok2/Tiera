/* ---------------------------------------------------------------------------
 * Header: 배포 시 마이그레이션 — Vercel 빌드 단계에서 실행된다.
 *   npm run db:migrate:deploy   (vercel.json의 buildCommand가 호출)
 *
 * 왜 빌드에서 도는가:
 *   운영 DB 접속 주소는 Vercel에 Sensitive로 저장돼 있어 밖에서 읽을 수 없다.
 *   (대시보드에서도, vercel env pull로도 못 읽는다. 그게 Sensitive의 정의다.)
 *   그래서 로컬에서 운영 DB에 마이그레이션을 돌릴 방법이 사실상 없다.
 *   반면 빌드 컨테이너 안에서는 그 값이 정상적으로 주입된다.
 *
 * 왜 빌드보다 먼저 도는가:
 *   마이그레이션이 실패하면 빌드도 멈춰야 한다. 컬럼이 없는 DB 위에
 *   그 컬럼을 조회하는 코드가 배포되면 런타임 500이 되고, 원인을 찾기 어렵다.
 *   빌드에서 죽으면 배포가 아예 안 나가므로 서비스는 이전 버전 그대로 살아 있다.
 *
 * 실행 조건:
 *   - Vercel 프로덕션 배포에서만 실행한다. 프리뷰 배포까지 돌면 브랜치 하나
 *     띄울 때마다 운영 DB 스키마가 바뀐다.
 *   - Vercel이 아닌 곳(로컬 npm run build 등)에서는 건너뛴다. 빌드가 DB를
 *     요구하게 만들면 DB 없이 빌드만 확인하려는 경우가 막힌다.
 *
 * 마이그레이션 파일은 재실행에 안전하게 쓴다(ADD COLUMN IF NOT EXISTS 등).
 * 빌드는 재시도·롤백으로 여러 번 돌 수 있다.
 * ------------------------------------------------------------------------- */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { resolveDirectDatabaseUrl } from "./url";
import { explainError } from "./explain-error";

function skip(reason: string): void {
  console.log(`[migrate] 건너뜀 — ${reason}`);
}

async function main() {
  const onVercel = Boolean(process.env.VERCEL);
  const env = process.env.VERCEL_ENV;

  if (!onVercel) {
    skip("Vercel 빌드가 아님 (로컬에서는 npm run db:migrate를 직접 쓴다)");
    return;
  }
  if (env !== "production") {
    skip(`프로덕션 배포가 아님 (VERCEL_ENV=${env ?? "unknown"})`);
    return;
  }

  const url = resolveDirectDatabaseUrl();
  if (!url) {
    // 프로덕션인데 주소가 없으면 조용히 넘어가면 안 된다.
    // 그대로 배포되면 첫 요청에서 죽는다.
    throw new Error(
      "프로덕션 배포인데 DB 접속 주소가 없습니다. " +
        "DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING / DATABASE_URL 중 하나를 설정하세요."
    );
  }

  try {
    console.log(`[migrate] 대상 호스트: ${new URL(url).host}`);
  } catch {
    console.log("[migrate] 대상 호스트: (주소 형식을 해석하지 못했습니다)");
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./db/migrations" });
    console.log("[migrate] 완료");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("[migrate] 실패 — 빌드를 중단합니다.\n");
  console.error(explainError(e));
  process.exit(1);
});
/* Footer: db/migrate-deploy.ts */
