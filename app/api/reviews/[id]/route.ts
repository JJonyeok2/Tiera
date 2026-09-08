/* Header: PATCH/DELETE /api/reviews/[id] — 본인 리뷰만 다룰 수 있다. */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteReview, ReviewError, updateReview } from "@/lib/reviews";
import { reviewInputSchema } from "@/lib/validation";

async function requireUser() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  const parsed = reviewInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "잘못된 입력입니다." } },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json({ data: await updateReview(userId, (await ctx.params).id, parsed.data) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  if (!userId) return unauthorized();
  try {
    return NextResponse.json({ data: await deleteReview(userId, (await ctx.params).id) });
  } catch (e) {
    return errorResponse(e);
  }
}

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
    { status: 401 }
  );
}

function errorResponse(e: unknown) {
  if (e instanceof ReviewError) {
    const status = e.code === "FORBIDDEN" ? 403 : e.code === "DUPLICATE" ? 409 : 404;
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status });
  }
  console.error(e);
  return NextResponse.json({ error: { code: "INTERNAL", message: "처리에 실패했습니다." } }, { status: 500 });
}
/* Footer: app/api/reviews/[id]/route.ts */
