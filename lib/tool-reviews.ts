/* ---------------------------------------------------------------------------
 * Header: 도구 후기 쓰기·읽기 경로.
 *
 * lib/reviews.ts(모델 리뷰)와 같은 골격이고, 같은 규칙 두 개를 그대로 지킨다:
 *
 *   1. 후기가 바뀌면 반드시 그 도구의 점수를 다시 계산한다.
 *      빼먹어도 에러가 안 나기 때문에 더 위험하다 — 순위가 조용히 낡는다.
 *   2. 익명 처리는 **SQL에서** 한다. 화면에서만 가리면 이름이 응답 JSON에
 *      그대로 실려 나가서 개발자도구만 열면 누구인지 보인다.
 *
 * 모델 쪽과 합치지 않은 이유는 축 enum이 다르기 때문이다(Category vs ToolAxis).
 * 한 함수로 묶으면 EASE 점수가 model_score로 들어가도 타입이 못 막는다.
 * ------------------------------------------------------------------------- */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { toolReviewRatings, toolReviews, tools } from "@/db/schema";
import { recomputeToolScores } from "@/lib/scoring/recompute";
import type { ToolReviewInput } from "@/lib/validation";

export class ToolReviewError extends Error {
  constructor(
    readonly code: "TOOL_NOT_FOUND" | "DUPLICATE" | "NOT_FOUND" | "FORBIDDEN",
    message: string
  ) {
    super(message);
  }
}

async function toolIdBySlug(slug: string): Promise<string> {
  const row = await db.select({ id: tools.id }).from(tools).where(eq(tools.slug, slug)).limit(1);
  if (!row[0]) throw new ToolReviewError("TOOL_NOT_FOUND", "도구를 찾을 수 없습니다.");
  return row[0].id;
}

export async function createToolReview(userId: string, slug: string, input: ToolReviewInput) {
  const toolId = await toolIdBySlug(slug);

  const existing = await db
    .select({ id: toolReviews.id })
    .from(toolReviews)
    .where(and(eq(toolReviews.userId, userId), eq(toolReviews.toolId, toolId)))
    .limit(1);
  if (existing[0]) {
    throw new ToolReviewError("DUPLICATE", "이미 이 도구를 평가했습니다. 기존 후기를 수정해 주세요.");
  }

  const reviewId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(toolReviews)
      .values({ userId, toolId, comment: input.comment, isAnonymous: input.isAnonymous ?? false })
      .returning({ id: toolReviews.id });
    await tx
      .insert(toolReviewRatings)
      .values(input.ratings.map((r) => ({ reviewId: created.id, ...r })));
    return created.id;
  });

  await recomputeToolScores(toolId);
  return { reviewId, toolId };
}

export async function updateToolReview(userId: string, reviewId: string, input: ToolReviewInput) {
  const row = await db
    .select({ id: toolReviews.id, userId: toolReviews.userId, toolId: toolReviews.toolId })
    .from(toolReviews)
    .where(eq(toolReviews.id, reviewId))
    .limit(1);
  if (!row[0]) throw new ToolReviewError("NOT_FOUND", "후기를 찾을 수 없습니다.");
  // 소유권은 서버에서 반드시 확인한다. 클라이언트가 보낸 id를 믿지 않는다.
  if (row[0].userId !== userId) {
    throw new ToolReviewError("FORBIDDEN", "본인의 후기만 수정할 수 있습니다.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(toolReviews)
      .set({
        comment: input.comment,
        isAnonymous: input.isAnonymous ?? false,
        updatedAt: new Date(),
      })
      .where(eq(toolReviews.id, reviewId));
    await tx.delete(toolReviewRatings).where(eq(toolReviewRatings.reviewId, reviewId));
    await tx.insert(toolReviewRatings).values(input.ratings.map((r) => ({ reviewId, ...r })));
  });

  await recomputeToolScores(row[0].toolId);
  return { toolId: row[0].toolId };
}

export async function deleteToolReview(userId: string, reviewId: string) {
  const row = await db
    .select({ userId: toolReviews.userId, toolId: toolReviews.toolId })
    .from(toolReviews)
    .where(eq(toolReviews.id, reviewId))
    .limit(1);
  if (!row[0]) throw new ToolReviewError("NOT_FOUND", "후기를 찾을 수 없습니다.");
  if (row[0].userId !== userId) {
    throw new ToolReviewError("FORBIDDEN", "본인의 후기만 삭제할 수 있습니다.");
  }

  await db.delete(toolReviews).where(eq(toolReviews.id, reviewId));
  await recomputeToolScores(row[0].toolId);
  return { toolId: row[0].toolId };
}

export type ToolReviewSort = "recent" | "high" | "low";

export interface ToolReviewListItem {
  id: string;
  authorName: string;
  authorImage: string | null;
  comment: string | null;
  createdAt: string;
  isMine: boolean;
  isAnonymous: boolean;
  ratings: { axis: string; score: number }[];
  average: number;
}

export async function listToolReviews(
  slug: string,
  {
    sort = "recent",
    limit = 10,
    offset = 0,
    viewerId,
    toolId: knownId,
  }: {
    sort?: ToolReviewSort;
    limit?: number;
    offset?: number;
    viewerId?: string;
    toolId?: string;
  } = {}
) {
  // 호출자가 id를 이미 알면 slug→id 조회를 건너뛴다.
  // 상세 페이지에서 이 한 번이 그대로 왕복 한 번이다.
  const toolId = knownId ?? (await toolIdBySlug(slug));

  // 정렬 키는 화이트리스트에서만 고른다. 사용자 입력을 SQL에 직접 넣지 않는다.
  const orderBy =
    sort === "high"
      ? sql`avg_score DESC, created_at DESC`
      : sort === "low"
        ? sql`avg_score ASC, created_at DESC`
        : sql`created_at DESC`;

  const rows = await db.execute<{
    id: string;
    comment: string | null;
    created_at: string;
    user_id: string;
    author_name: string | null;
    author_image: string | null;
    is_anonymous: boolean;
    avg_score: number;
    ratings: { axis: string; score: number }[] | null;
    total: string;
  }>(sql`
    WITH base AS (
      SELECT r.id, r.comment, r.created_at, r.user_id,
             -- 익명이면 이름을 아예 내보내지 않는다. 화면에서 가리는 건 2차 방어다.
             CASE WHEN r.is_anonymous THEN NULL ELSE u.name END AS author_name,
             CASE WHEN r.is_anonymous THEN NULL ELSE u.image END AS author_image,
             r.is_anonymous,
             COALESCE(AVG(rr.score), 0) AS avg_score,
             JSON_AGG(JSON_BUILD_OBJECT('axis', rr.axis, 'score', rr.score)
                      ORDER BY rr.axis) FILTER (WHERE rr.id IS NOT NULL) AS ratings
      FROM tool_review r
      JOIN "user" u ON u.id = r.user_id
      LEFT JOIN tool_review_rating rr ON rr.review_id = r.id
      WHERE r.tool_id = ${toolId}
      GROUP BY r.id, u.name, u.image, r.is_anonymous
    )
    SELECT *, COUNT(*) OVER ()::text AS total FROM base
    ORDER BY ${orderBy}
    LIMIT ${limit} OFFSET ${offset}
  `);

  const list = rows.rows ?? [];
  const items: ToolReviewListItem[] = list.map((r) => ({
    id: r.id,
    authorName: r.author_name ?? "익명",
    authorImage: r.author_image,
    isAnonymous: Boolean(r.is_anonymous),
    comment: r.comment,
    createdAt: new Date(r.created_at).toISOString(),
    isMine: viewerId !== undefined && r.user_id === viewerId,
    ratings: r.ratings ?? [],
    average: Number(r.avg_score),
  }));

  return { items, total: list.length > 0 ? Number(list[0].total) : 0 };
}

export async function getMyToolReview(userId: string, slug: string, knownId?: string) {
  const toolId = knownId ?? (await toolIdBySlug(slug));

  const rows = await db.execute<{
    id: string;
    comment: string | null;
    is_anonymous: boolean;
    ratings: { axis: string; score: number }[] | null;
  }>(sql`
    SELECT r.id, r.comment, r.is_anonymous,
           JSON_AGG(JSON_BUILD_OBJECT('axis', rr.axis, 'score', rr.score)
                    ORDER BY rr.axis) FILTER (WHERE rr.id IS NOT NULL) AS ratings
    FROM tool_review r
    LEFT JOIN tool_review_rating rr ON rr.review_id = r.id
    WHERE r.user_id = ${userId} AND r.tool_id = ${toolId}
    GROUP BY r.id, r.is_anonymous
    LIMIT 1
  `);

  const row = rows.rows?.[0];
  if (!row) return null;
  return {
    id: row.id,
    comment: row.comment,
    isAnonymous: Boolean(row.is_anonymous),
    ratings: row.ratings ?? [],
  };
}
/* Footer: lib/tool-reviews.ts */
