/* Header: GET /api/cron/sync — 외부 벤치마크 데이터 일일 동기화.
   Vercel Cron이 CRON_SECRET을 Bearer로 붙여 호출한다. */
import { NextResponse } from "next/server";
import { syncFromArtificialAnalysis } from "@/lib/data-sources/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "권한이 없습니다." } },
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
