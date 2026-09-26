/* Header: PATCH/DELETE /api/tool-reviews/[id] — 본인 후기만 다룰 수 있다.

   경로를 /api/reviews/[id]와 나눈 이유: id만 받는 엔드포인트라 한 곳에 합치면
   "이 id가 모델 리뷰인지 도구 후기인지"를 매번 조회해서 갈라야 하고,
   그 분기를 잘못 타면 남의 후기를 건드리는 경로가 열린다. */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteToolReview, ToolReviewError, updateToolReview } from "@/lib/tool-reviews";
import { toolReviewInputSchema } from "@/lib/validation";

async function requireUser() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  const parsed = toolReviewInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: parsed.error.issues[0]?.message ?? "입력한 내용을 다시 확인해 주세요.",
        },
      },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json({
      data: await updateToolReview(userId, (await ctx.params).id, parsed.data),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  if (!userId) return unauthorized();
  try {
    return NextResponse.json({ data: await deleteToolReview(userId, (await ctx.params).id) });
  } catch (e) {
    return errorResponse(e);
  }
}

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "로그인이 필요해요." } },
    { status: 401 }
  );
}

function errorResponse(e: unknown) {
  if (e instanceof ToolReviewError) {
    const status = e.code === "FORBIDDEN" ? 403 : e.code === "DUPLICATE" ? 409 : 404;
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status });
  }
  console.error(e);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "처리하지 못했어요. 잠시 후 다시 해주세요." } },
    { status: 500 }
  );
}
/* Footer: app/api/tool-reviews/[id]/route.ts */
