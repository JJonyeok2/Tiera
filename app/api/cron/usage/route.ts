/* Header: GET /api/cron/usage — OpenRouter 사용량 일일 동기화. SPEC 26.5.
   다른 크론과 같은 방식: CRON_SECRET Bearer 검증, 미설정 503 / 불일치 401.
   OPENROUTER_API_KEY가 없으면 503 — 키 없이 조용히 성공하면 화면이 계속 옛 숫자를 보여준다. */
import { NextResponse } from "next/server";
import { syncOpenRouterUsage } from "@/lib/usage/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: { code: "CRON_SECRET_NOT_SET", message: "서버에 CRON_SECRET이 설정되어 있지 않습니다." } },
      { status: 503 },
    );
  }
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided !== secret) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "시크릿이 일치하지 않습니다." } },
      { status: 401 },
    );
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: { code: "NO_API_KEY", message: "OPENROUTER_API_KEY가 없습니다." } },
      { status: 503 },
    );
  }

  try {
    const report = await syncOpenRouterUsage(key);
    return NextResponse.json({ data: report });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: "SYNC_FAILED", message: "사용량 동기화에 실패했습니다." } },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
/* Footer: app/api/cron/usage/route.ts */
