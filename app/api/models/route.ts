/* Header: GET /api/models — 랭킹 목록 (무한 스크롤용)
   모든 쿼리 파라미터는 lib/params.ts의 화이트리스트를 통과시킨다. */
import { NextResponse } from "next/server";
import { getRanking } from "@/lib/queries";
import {
  parseCountry,
  parseLimit,
  parseOffset,
  parseQuery,
  parseScope,
  parseScoreType,
} from "@/lib/params";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const limit = parseLimit(sp.get("limit"));
  const offset = parseOffset(sp.get("offset"));

  try {
    const { rows, total } = await getRanking({
      scoreType: parseScoreType(sp.get("type")),
      scope: parseScope(sp.get("scope")),
      country: parseCountry(sp.get("country")),
      q: parseQuery(sp.get("q")),
      limit,
      offset,
    });

    return NextResponse.json({
      data: rows,
      meta: { total, nextOffset: offset + rows.length < total ? offset + rows.length : null },
    });
  } catch {
    // 내부 오류 메시지를 그대로 노출하면 스키마 구조가 새어 나간다.
    return NextResponse.json(
      { error: { code: "RANKING_FAILED", message: "랭킹을 불러오지 못했습니다." } },
      { status: 500 }
    );
  }
}
/* Footer: app/api/models/route.ts */
