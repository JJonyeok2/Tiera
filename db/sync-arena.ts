/* ---------------------------------------------------------------------------
 * Header: LMArena 수집 — 1단계는 "매칭률 점검"만 한다.
 *   npm run data:sync-arena
 *
 * 왜 바로 DB에 쓰지 않는가:
 *   이 계획 전체가 "LMArena의 모델명과 우리 슬러그가 실제로 붙는가"에 달려 있다.
 *   LMArena는 claude-opus-5-high처럼 설정별로 이름을 따로 올리고, 우리 슬러그는
 *   Artificial Analysis 이름에서 만들어진다. 출처가 다른 두 이름 체계다.
 *   매칭률이 낮으면 스키마를 바꾸기 전에 설계를 다시 잡아야 한다.
 *   그래서 기본 동작은 조회·대조·보고까지이고, 쓰기는 매칭률을 보고 붙인다.
 *
 * 이 스크립트는 네트워크를 쓴다. 개발 컨테이너에서는 HuggingFace가
 * 막혀 있을 수 있으므로 사용자의 로컬에서 실행한다.
 * ------------------------------------------------------------------------- */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";
import {
  ARENA_SOURCES,
  arenaKey,
  fetchArenaRows,
  looseKey,
  transformArena,
  type ArenaEntry,
  type ArenaRow,
} from "@/lib/data-sources/lmarena";
import { explainError } from "./explain-error";

interface OurModel {
  slug: string;
  name: string;
  developer: string;
}

async function loadOurModels(): Promise<OurModel[]> {
  const r = await db.execute<{ slug: string; name: string; developer: string }>(sql`
    SELECT m.slug, m.name, d.name AS developer
    FROM model m JOIN developer d ON d.id = m.developer_id
    WHERE m.is_published
    ORDER BY m.slug
  `);
  return r.rows ?? [];
}

/**
 * 우리 모델 하나에 아레나 엔트리를 붙인다.
 *
 * 엄격 키(구분자 유지)를 먼저 보고, 실패하면 구분자를 뗀 느슨한 키로 한 번 더 본다.
 * 처음부터 느슨하게 보면 gpt-4-1과 gpt-41 같은 서로 다른 모델이 같은 키가 된다.
 */
function buildIndex(entries: ArenaEntry[]) {
  const strict = new Map<string, ArenaEntry>();
  const loose = new Map<string, ArenaEntry>();
  for (const e of entries) {
    if (!strict.has(e.key)) strict.set(e.key, e);
    const lk = e.key.replace(/-/g, "");
    if (!loose.has(lk)) loose.set(lk, e);
  }
  return { strict, loose };
}

function pct(n: number, total: number): string {
  return total === 0 ? "0%" : `${((n / total) * 100).toFixed(1)}%`;
}

async function main() {
  const ourModels = await loadOurModels();
  console.log(`우리 모델 ${ourModels.length}개\n`);

  // 설정(config)별로 파일을 한 번만 받는다. text 설정에 카테고리 여러 개가 들어있다.
  const configs = [...new Set(ARENA_SOURCES.map((s) => s.config))];
  const rowsByConfig = new Map<string, ArenaRow[]>();
  for (const c of configs) {
    process.stdout.write(`[${c}] 내려받는 중… `);
    const rows = await fetchArenaRows(c);
    rowsByConfig.set(c, rows);
    console.log(`${rows.length.toLocaleString("ko-KR")}행`);
  }
  console.log();

  let overallMatched: OurModel[] = [];
  let overallUnmatched: OurModel[] = [];

  for (const src of ARENA_SOURCES) {
    const rows = rowsByConfig.get(src.config) ?? [];
    const entries = transformArena(rows, src.scope, src.category);
    const { strict, loose } = buildIndex(entries);

    const matched: { m: OurModel; e: ArenaEntry; how: string }[] = [];
    const unmatched: OurModel[] = [];
    for (const m of ourModels) {
      const k = arenaKey(m.slug);
      const hit = strict.get(k);
      if (hit) {
        matched.push({ m, e: hit, how: "정확" });
        continue;
      }
      const lh = loose.get(looseKey(m.slug));
      if (lh) {
        matched.push({ m, e: lh, how: "느슨" });
        continue;
      }
      unmatched.push(m);
    }

    console.log(
      `${src.scope.padEnd(11)} (${src.config}/${src.category})  ` +
        `아레나 ${String(entries.length).padStart(4)}개  ` +
        `매칭 ${String(matched.length).padStart(3)}/${ourModels.length} (${pct(matched.length, ourModels.length)})`
    );

    if (src.scope === "OVERALL") {
      overallMatched = matched.map((x) => x.m);
      overallUnmatched = unmatched;

      console.log("\n  붙은 예시:");
      for (const x of matched.slice(0, 8)) {
        console.log(
          `    ${x.m.slug.padEnd(26)} ← ${x.e.rawName.padEnd(30)} ` +
            `rating ${x.e.rating.toFixed(1)}  votes ${x.e.voteCount.toLocaleString("ko-KR")}  [${x.how}]`
        );
      }

      console.log("\n  못 붙은 우리 모델 (상위 12개):");
      for (const m of unmatched.slice(0, 12)) {
        console.log(`    ${m.slug.padEnd(26)} (${m.developer})`);
      }

      // 아레나에는 있는데 우리가 안 가진 모델 — 목록을 넓힐 후보다.
      const ourKeys = new Set(ourModels.map((m) => arenaKey(m.slug)));
      const onlyArena = entries.filter((e) => !ourKeys.has(e.key));
      console.log(`\n  아레나에만 있는 모델: ${onlyArena.length}개 (상위 10)`);
      for (const e of onlyArena.slice(0, 10)) {
        console.log(
          `    ${e.rawName.padEnd(34)} ${e.organization.padEnd(14)} votes ${e.voteCount.toLocaleString("ko-KR")}`
        );
      }
      console.log();
    }
  }

  console.log("\n=== 요약 ===");
  console.log(`OVERALL 매칭 ${overallMatched.length}/${ourModels.length} (${pct(overallMatched.length, ourModels.length)})`);
  console.log(`미매칭 ${overallUnmatched.length}개`);
  console.log("\n아직 DB에는 아무것도 쓰지 않았습니다. 매칭률을 보고 적재 방식을 정합니다.");
  process.exit(0);
}

main().catch((e) => {
  console.error("아레나 수집 실패\n");
  console.error(explainError(e));
  process.exit(1);
});
/* Footer: db/sync-arena.ts */
