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
  if (!secret) {
    // "서버에 시크릿이 없음"과 "보낸 값이 틀림"을 구분해 준다.
    // 둘 다 401로 뭉뚱그리면 설정 실수인지 인증 실패인지 알 방법이 없다.
    // 시크릿 자체는 노출하지 않으므로 이 구분만으로 추측이 쉬워지지는 않는다.
    return NextResponse.json(
      {
        error: {
          code: "CRON_SECRET_NOT_SET",
          message: "서버에 CRON_SECRET이 설정되어 있지 않습니다. Vercel 환경변수와 재배포 여부를 확인하세요.",
        },
      },
      { status: 503 }
    );
  }

  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided !== secret) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "시크릿이 일치하지 않습니다." } },
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
