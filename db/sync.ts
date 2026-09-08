/* ---------------------------------------------------------------------------
 * Header: 외부 데이터 동기화 CLI
 *   npm run data:sync            실데이터 수집 → DB 반영
 *   npm run data:sync -- --purge 시드로 넣었던 예시 벤치마크를 먼저 걷어낸다
 *
 * ARTIFICIAL_ANALYSIS_API_KEY 필요. 키는 서버에서만 쓰이며 절대 출력하지 않는다.
 * ------------------------------------------------------------------------- */
import "dotenv/config";
import { purgeSeedBenchmarks, syncFromArtificialAnalysis } from "@/lib/data-sources/sync";
import { explainError } from "./explain-error";

async function main() {
  const key = process.env.ARTIFICIAL_ANALYSIS_API_KEY;
  if (!key) {
    console.error(
      "ARTIFICIAL_ANALYSIS_API_KEY가 없습니다.\n" +
        "https://artificialanalysis.ai 에서 무료 키를 발급받아 환경변수로 넣으세요."
    );
    process.exit(1);
  }

  if (process.argv.includes("--purge")) {
    const n = await purgeSeedBenchmarks();
    console.log(`시드 예시 벤치마크 ${n}종 제거`);
  }

  console.log("Artificial Analysis에서 수집 중…");
  const r = await syncFromArtificialAnalysis(key);

  console.log(`
개발사   ${r.developersUpserted}
모델     ${r.modelsUpserted}
벤치마크 ${r.benchmarksUpserted}종
측정값   ${r.resultsUpserted}건
`);

  if (r.skippedCreators.length > 0) {
    console.log(
      `수록 대상이 아니라 건너뛴 개발사 (${r.skippedCreators.length}곳):\n  ` +
        r.skippedCreators.join(", ") +
        "\n  → 추가하려면 lib/data-sources/creator-country.ts 에 국가를 등록하세요.\n"
    );
  }
  console.log("완료");
  process.exit(0);
}

main().catch((e) => {
  console.error("동기화 실패\n");
  console.error(explainError(e));
  process.exit(1);
});
/* Footer: db/sync.ts */
