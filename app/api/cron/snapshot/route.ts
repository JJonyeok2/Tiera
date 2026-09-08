/* ---------------------------------------------------------------------------
 * Header: /api/cron/snapshot — 일일 랭킹 스냅샷
 *
 * Vercel Cron은 **GET**으로 호출하고, CRON_SECRET 환경변수가 설정돼 있으면
 * `Authorization: Bearer <CRON_SECRET>` 헤더를 자동으로 붙여준다.
 * 그래서 GET을 주 경로로 두고, 수동 실행 편의를 위해 POST도 같이 받는다.
 *
 * 시크릿이 없으면 열어두지 않고 막는다(fail closed). 공개 엔드포인트로 두면
 * 누구나 순위 이력을 덮어쓸 수 있다.
 * ------------------------------------------------------------------------- */
import { NextResponse } from "next/server";
import { takeSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";
/** 모델 수가 늘면 집계가 길어진다. 기본 10초로는 모자랄 수 있다. */
export const maxDuration = 60;

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!secret || provided !== secret) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "권한이 없습니다." } },
      { status: 401 }
    );
  }

  try {
    const count = await takeSnapshot();
    return NextResponse.json({ data: { inserted: count } });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: "SNAPSHOT_FAILED", message: "스냅샷 생성에 실패했습니다." } },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
/* Footer: app/api/cron/snapshot/route.ts */
