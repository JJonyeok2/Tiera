/* ---------------------------------------------------------------------------
 * Header: 도구 시드 스크립트 — SPEC 23.7 2·3단계.
 *   npm run db:seed-tools
 *
 * 모델 시드(seed.ts)와 달리 **지우고 다시 넣지 않는다.** slug 기준 upsert다.
 * 이유: 이 테이블에는 곧 사용자 리뷰가 붙는다. 도구를 지웠다 넣으면 id가 바뀌고
 * tool_review가 cascade로 같이 날아간다. 시드를 한 번 더 돌렸다는 이유로
 * 남의 후기가 사라지면 안 된다.
 *
 * 그리고 **가짜 리뷰를 만들지 않는다.** 모델 쪽 시드는 개발 환경에서 더미 리뷰를
 * 넣지만 여기는 넣지 않는다. 도구 목록은 처음부터 프로덕션에 올라가고,
 * 로그인이 열려 있어 진짜 후기와 섞이기 때문이다.
 * 후기 0개인 카드로 시작하는 게 맞다.
 * ------------------------------------------------------------------------- */

import "dotenv/config";
import { eq, isNull, sql } from "drizzle-orm";
import { developers, models, tools } from "@/db/schema";
import { DEVELOPER_DEFAULT_TOOL, SEED_TOOLS } from "@/db/seed-tools-data";
import { explainError } from "./explain-error";

/**
 * DB 인스턴스를 인자로 받는다.
 *
 * 로컬 CLI는 @/db의 공용 풀을 쓰지만, 배포 시드(seed-tools-deploy.ts)는
 * Vercel이 주입한 **직결 주소**로 자기 풀을 따로 연다 — 마이그레이션과 같은 이유다.
 * 여기서 @/db를 직접 import하면 그 분기가 불가능해진다.
 */
type Db = typeof import("@/db").db;

async function upsertTools(db: Db): Promise<Map<string, string>> {
  const devRows = await db.select({ id: developers.id, slug: developers.slug }).from(developers);
  const devIdBySlug = new Map(devRows.map((d) => [d.slug, d.id]));

  const idBySlug = new Map<string, string>();
  let inserted = 0;
  let updated = 0;

  for (const t of SEED_TOOLS) {
    // developerSlug가 있는데 그 개발사가 DB에 없으면 조용히 null로 넘기지 않는다.
    // 매핑 규칙(23.4)이 이 연결을 타고 도는데, 끊긴 걸 모르면 모델이 도구에
    // 영영 안 붙고 원인은 화면 어디에도 안 나타난다.
    if (t.developerSlug && !devIdBySlug.has(t.developerSlug)) {
      throw new Error(
        `도구 '${t.slug}'가 가리키는 개발사 '${t.developerSlug}'가 developer 테이블에 없습니다. ` +
          `seed-data.ts의 DEVELOPERS를 먼저 넣었는지 확인하세요.`
      );
    }

    const values = {
      slug: t.slug,
      name: t.name,
      maker: t.maker,
      developerId: t.developerSlug ? devIdBySlug.get(t.developerSlug)! : null,
      purpose: t.purpose,
      alsoFor: t.alsoFor ?? [],
      origin: t.origin,
      summary: t.summary,
      howToStart: t.howToStart,
      pricingKind: t.pricingKind,
      priceNote: t.priceNote,
      studentFree: t.studentFree ?? false,
      koreanLevel: t.koreanLevel,
      koreanNote: t.koreanNote ?? null,
      siteUrl: t.siteUrl,
      platforms: t.platforms,
      caution: t.caution ?? null,
    };

    const [row] = await db
      .insert(tools)
      .values(values)
      .onConflictDoUpdate({
        target: tools.slug,
        // status·isPublished·createdAt은 갱신 대상에서 뺀다.
        // 운영 중에 관리자가 내린 도구를 시드가 다시 올려버리면 안 된다.
        set: {
          name: values.name,
          maker: values.maker,
          developerId: values.developerId,
          purpose: values.purpose,
          alsoFor: values.alsoFor,
          origin: values.origin,
          summary: values.summary,
          howToStart: values.howToStart,
          pricingKind: values.pricingKind,
          priceNote: values.priceNote,
          studentFree: values.studentFree,
          koreanLevel: values.koreanLevel,
          koreanNote: values.koreanNote,
          siteUrl: values.siteUrl,
          platforms: values.platforms,
          caution: values.caution,
        },
      })
      .returning({ id: tools.id, createdAt: tools.createdAt });

    idBySlug.set(t.slug, row.id);
    // createdAt이 방금이면 새로 들어온 것이다. 정확한 구분은 아니지만
    // 로그용 숫자라 이 정도면 충분하다.
    if (Date.now() - row.createdAt.getTime() < 5_000) inserted += 1;
    else updated += 1;
  }

  console.log(`도구 ${SEED_TOOLS.length}개 — 신규 ${inserted} / 갱신 ${updated}`);
  return idBySlug;
}

/**
 * 개발사 → 기본 도구 규칙으로 모델을 붙인다. SPEC 23.4
 *
 * **이미 tool_id가 있는 모델은 건드리지 않는다.** 사람이 손으로 잡아준 예외를
 * 자동 규칙이 덮으면, 고쳐도 다음 실행에 원상복구되는 버그가 된다.
 * 기존 수집 로직이 description·context를 다루는 원칙과 같다.
 */
async function mapModelsToTools(db: Db, idBySlug: Map<string, string>) {
  let total = 0;

  for (const [devSlug, toolSlug] of Object.entries(DEVELOPER_DEFAULT_TOOL)) {
    const toolId = idBySlug.get(toolSlug);
    if (!toolId) {
      console.warn(`  규칙 건너뜀: 도구 '${toolSlug}'를 찾지 못했습니다`);
      continue;
    }

    const [dev] = await db
      .select({ id: developers.id })
      .from(developers)
      .where(eq(developers.slug, devSlug));
    if (!dev) {
      console.warn(`  규칙 건너뜀: 개발사 '${devSlug}'가 없습니다`);
      continue;
    }

    const res = await db
      .update(models)
      .set({ toolId })
      .where(sql`${models.developerId} = ${dev.id} AND ${models.toolId} IS NULL`)
      .returning({ id: models.id });

    if (res.length > 0) console.log(`  ${devSlug} → ${toolSlug}: ${res.length}개`);
    total += res.length;
  }

  const [{ count: unmapped }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(models)
    .where(isNull(models.toolId));

  console.log(`모델 매핑 ${total}개`);
  // 이 숫자는 경고가 아니다. 도구 없이 API로만 쓰이는 모델이라는 뜻이고,
  // 개발자용 /models 랭킹에는 그대로 나온다.
  console.log(`도구에 안 붙은 모델 ${unmapped}개 (API 전용 — 정상)`);
}

/** 시드 본체. CLI와 배포 스크립트가 함께 쓴다. */
export async function seedTools(db: Db) {
  const idBySlug = await upsertTools(db);

  const byPurpose = new Map<string, number>();
  for (const t of SEED_TOOLS) byPurpose.set(t.purpose, (byPurpose.get(t.purpose) ?? 0) + 1);
  console.log(
    "용도별: " +
      [...byPurpose.entries()].map(([p, n]) => `${p} ${n}`).join(" · ")
  );
  console.log(`국산 ${SEED_TOOLS.filter((t) => t.origin === "KR").length}개`);
  console.log(
    `한국어 미확인 ${SEED_TOOLS.filter((t) => t.koreanLevel === "UNKNOWN").length}개 ` +
      `(화면에 "확인 중"으로 나갑니다)`
  );
  console.log();

  await mapModelsToTools(db, idBySlug);

  console.log("\n완료. 도구 점수는 후기가 쌓여야 생깁니다 — 지금은 tool_score가 비어 있습니다.");
}

/** 직접 실행됐을 때만 CLI로 동작한다. import만으로는 아무 일도 하지 않는다. */
async function main() {
  const { db } = await import("@/db");
  await seedTools(db);
  process.exit(0);
}

// 파일명을 **끝까지** 맞춘다. includes("seed-tools")로 쓰면
// seed-tools-deploy.ts도 걸려서, 배포 스크립트가 직결 풀을 열기 전에
// 여기가 먼저 @/db 공용 풀로 시드를 돌려버린다.
if (process.argv[1] && /[/\\]seed-tools\.(ts|js)$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error("도구 시드 실패\n");
    console.error(explainError(e));
    process.exit(1);
  });
}
/* Footer: db/seed-tools.ts */
