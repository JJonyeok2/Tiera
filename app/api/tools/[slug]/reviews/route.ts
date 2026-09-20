/* Header: GET/POST /api/tools/[slug]/reviews

   모델 쪽 /api/models/[slug]/reviews와 같은 구조·같은 상태 코드를 쓴다.
   합치지 않은 이유는 검증 스키마의 축 enum이 다르기 때문이다(CODING vs EASE). */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createToolReview,
  listToolReviews,
  ToolReviewError,
  type ToolReviewSort,
} from "@/lib/tool-reviews";
import { toolReviewInputSchema } from "@/lib/validation";
import { parseLimit, parseOffset } from "@/lib/params";
import { rateLimit, REVIEW_LIMIT, sweepRateLimit } from "@/lib/rate-limit";

const SORTS: ToolReviewSort[] = ["recent", "high", "low"];

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const sp = new URL(req.url).searchParams;
  const rawSort = sp.get("sort");
  const sort = SORTS.includes(rawSort as ToolReviewSort) ? (rawSort as ToolReviewSort) : "recent";
  const session = await auth();

  try {
    const { items, total } = await listToolReviews(slug, {
      sort,
      limit: parseLimit(sp.get("limit"), 10, 30),
      offset: parseOffset(sp.get("offset")),
      viewerId: session?.user?.id,
    });
    return NextResponse.json({ data: items, meta: { total } });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  sweepRateLimit();
  // 모델 리뷰와 **같은 버킷을 쓰지 않는다.** 키를 공유하면 모델 5개를 평가한
  // 사람이 도구는 하나도 못 쓰게 된다. 어뷰징 방어는 경로별로 따로 센다.
  const rl = rateLimit(`tool-review:${session.user.id}`, REVIEW_LIMIT.limit, REVIEW_LIMIT.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "잠시 후 다시 시도해 주세요." } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const parsed = toolReviewInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: parsed.error.issues[0]?.message ?? "잘못된 입력입니다.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await createToolReview(session.user.id, slug, parsed.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

function errorResponse(e: unknown) {
  if (e instanceof ToolReviewError) {
    const status = e.code === "DUPLICATE" ? 409 : e.code === "FORBIDDEN" ? 403 : 404;
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status });
  }
  console.error(e);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "처리에 실패했습니다." } },
    { status: 500 }
  );
}
/* Footer: app/api/tools/[slug]/reviews/route.ts */
