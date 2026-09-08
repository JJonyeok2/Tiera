/* Header: POST /api/cron/purge-demo — 시드가 만든 더미 리뷰 삭제.
   CRON_SECRET으로 보호한다. 삭제 범위는 @tiera.local 계정으로 한정되어 있어
   실제 사용자의 평가는 이 경로로 지워질 수 없다 (lib/demo-data.ts 참고). */
import { NextResponse } from "next/server";
import { purgeDemoReviews } from "@/lib/demo-data";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: { code: "CRON_SECRET_NOT_SET", message: "서버에 CRON_SECRET이 없습니다." } },
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
    return NextResponse.json({ data: await purgeDemoReviews() });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: "PURGE_FAILED", message: "삭제에 실패했습니다." } },
      { status: 500 }
    );
  }
}
/* Footer: app/api/cron/purge-demo/route.ts */
