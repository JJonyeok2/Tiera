/* Header: 개발용 더미 리뷰 삭제 CLI — npm run db:purge-demo */
import "dotenv/config";
import { purgeDemoReviews } from "@/lib/demo-data";
import { explainError } from "./explain-error";

async function main() {
  const r = await purgeDemoReviews();
  console.log(`더미 계정 ${r.usersRemoved}개 / 리뷰 ${r.reviewsRemoved}건 삭제`);
  console.log("커뮤니티 점수 재계산 완료");
  process.exit(0);
}

main().catch((e) => {
  console.error("삭제 실패\n");
  console.error(explainError(e));
  process.exit(1);
});
/* Footer: db/purge-demo.ts */
