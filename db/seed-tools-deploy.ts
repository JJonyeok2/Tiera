/* ---------------------------------------------------------------------------
 * Header: 배포 시 도구 시드 — Vercel 빌드 단계에서 마이그레이션 직후에 돈다.
 *   npm run db:seed-tools:deploy   (vercel.json의 buildCommand가 호출)
 *
 * 왜 필요한가:
 *   도구 목록은 사용자가 입력하는 데이터가 아니라 **코드에 들어 있는 콘텐츠**다
 *   (db/seed-tools-data.ts). 마이그레이션만 돌리면 tool 테이블이 빈 채로 배포되고,
 *   홈이 통째로 "아직 등록된 도구가 없습니다"가 된다. 모델 랭킹은 수집 크론이
 *   채우지만 도구에는 그런 수집원이 없다 — 배포가 곧 발행이다.
 *
 * 왜 매 빌드마다 돌려도 되는가:
 *   seedTools는 slug 기준 upsert이고 status·is_published는 갱신 대상에서 빠져 있다.
 *   그래서 반복 실행해도 후기가 날아가지 않고, 운영 중에 내린 도구가 되살아나지도
 *   않는다. 처음부터 이걸 전제로 설계했다.
 *
 * 실행 조건과 실패 정책은 migrate-deploy.ts와 일부러 똑같이 맞췄다.
 * 단 하나 다른 점: **여기서 실패해도 빌드를 세우지 않는다.**
 *   마이그레이션 실패는 "코드와 스키마가 어긋난 상태로 배포됨"이라 치명적이지만,
 *   시드 실패는 "도구 설명이 한 배포 늦게 갱신됨"이다. 이미 떠 있는 목록은 그대로
 *   살아 있으므로, 배포 전체를 막는 것이 오히려 손해다.
 * ------------------------------------------------------------------------- */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { resolveDirectDatabaseUrl } from "./url";
import { explainError } from "./explain-error";
import { seedTools } from "./seed-tools";

function skip(reason: string): void {
  console.log(`[seed-tools] 건너뜀 — ${reason}`);
}

async function main() {
  if (!process.env.VERCEL) {
    skip("Vercel 빌드가 아님 (로컬에서는 npm run db:seed-tools를 직접 쓴다)");
    return;
  }
  if (process.env.VERCEL_ENV !== "production") {
    skip(`프로덕션 배포가 아님 (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unknown"})`);
    return;
  }

  const url = resolveDirectDatabaseUrl();
  if (!url) {
    // 여기까지 왔다는 건 마이그레이션이 이미 성공했다는 뜻이라 주소는 있어야 한다.
    // 없다면 설정이 꼬인 것이므로 조용히 넘기지 말고 로그를 남긴다.
    skip("DB 접속 주소가 없습니다 (마이그레이션은 통과했는데 주소가 사라졌습니다)");
    return;
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await seedTools(drizzle(pool) as unknown as typeof import("@/db").db);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  // 배포를 막지 않는다. 위 헤더의 이유 참고.
  console.error("[seed-tools] 실패 — 배포는 계속합니다. 도구 목록이 이전 상태로 남습니다.\n");
  console.error(explainError(e));
});
/* Footer: db/seed-tools-deploy.ts */
