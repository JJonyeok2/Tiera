/* Header: GET/POST /api/models/[slug]/reviews */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createReview, listReviews, ReviewError, type ReviewSort } from "@/lib/reviews";
import { reviewInputSchema } from "@/lib/validation";
import { parseLimit, parseOffset } from "@/lib/params";
import { rateLimit, REVIEW_LIMIT, sweepRateLimit } from "@/lib/rate-limit";

const SORTS: ReviewSort[] = ["recent", "high", "low"];

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const sp = new URL(req.url).searchParams;
  const rawSort = sp.get("sort");
  const sort = SORTS.includes(rawSort as ReviewSort) ? (rawSort as ReviewSort) : "recent";
  const session = await auth();

  try {
    const { items, total } = await listReviews(slug, {
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
  const rl = rateLimit(`review:${session.user.id}`, REVIEW_LIMIT.limit, REVIEW_LIMIT.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "잠시 후 다시 시도해 주세요." } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const parsed = reviewInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "잘못된 입력입니다." } },
      { status: 400 }
    );
  }

  try {
    const result = await createReview(session.user.id, slug, parsed.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

function errorResponse(e: unknown) {
  if (e instanceof ReviewError) {
    const status = e.code === "DUPLICATE" ? 409 : e.code === "FORBIDDEN" ? 403 : 404;
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status });
  }
  console.error(e);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "처리에 실패했습니다." } },
    { status: 500 }
  );
}
/* Footer: app/api/models/[slug]/reviews/route.ts */
