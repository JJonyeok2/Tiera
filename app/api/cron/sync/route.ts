/* Header: GET /api/cron/sync — 외부 벤치마크 데이터 일일 동기화.
   Vercel Cron이 CRON_SECRET을 Bearer로 붙여 호출한다. */
import { NextResponse } from "next/server";
import { syncFromArtificialAnalysis } from "@/lib/data-sources/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  const key = process.env.ARTIFICIAL_ANALYSIS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: { code: "NO_API_KEY", message: "ARTIFICIAL_ANALYSIS_API_KEY가 없습니다." } },
      { status: 503 }
    );
  }

  try {
    const report = await syncFromArtificialAnalysis(key);
    return NextResponse.json({ data: report });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: "SYNC_FAILED", message: "동기화에 실패했습니다." } },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
/* Footer: app/api/cron/sync/route.ts */
