/* ---------------------------------------------------------------------------
 * Header: 리뷰 쓰기 경로
 * 리뷰가 바뀌면 반드시 해당 모델의 커뮤니티 점수를 다시 계산한다.
 * 이걸 빼먹으면 랭킹이 조용히 낡는다 — 에러가 안 나기 때문에 더 위험하다.
 * ------------------------------------------------------------------------- */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { models, reviewRatings, reviews, users } from "@/db/schema";
import { recomputeCommunity } from "@/lib/scoring/recompute";
import type { ReviewInput } from "@/lib/validation";

export class ReviewError extends Error {
  constructor(
    readonly code: "MODEL_NOT_FOUND" | "DUPLICATE" | "NOT_FOUND" | "FORBIDDEN",
    message: string
  ) {
    super(message);
  }
}

async function modelIdBySlug(slug: string): Promise<string> {
  const row = await db.select({ id: models.id }).from(models).where(eq(models.slug, slug)).limit(1);
  if (!row[0]) throw new ReviewError("MODEL_NOT_FOUND", "모델을 찾을 수 없습니다.");
  return row[0].id;
}

export async function createReview(userId: string, slug: string, input: ReviewInput) {
  const modelId = await modelIdBySlug(slug);

  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.modelId, modelId)))
    .limit(1);
  if (existing[0]) {
    throw new ReviewError("DUPLICATE", "이미 이 모델을 평가했습니다. 기존 평가를 수정해 주세요.");
  }

  const reviewId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(reviews)
      .values({ userId, modelId, comment: input.comment })
      .returning({ id: reviews.id });
    await tx
      .insert(reviewRatings)
      .values(input.ratings.map((r) => ({ reviewId: created.id, ...r })));
    return created.id;
  });

  await recomputeCommunity(modelId);
  return { reviewId, modelId };
}

export async function updateReview(userId: string, reviewId: string, input: ReviewInput) {
  const row = await db
    .select({ id: reviews.id, userId: reviews.userId, modelId: reviews.modelId })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);
  if (!row[0]) throw new ReviewError("NOT_FOUND", "리뷰를 찾을 수 없습니다.");
  // 소유권 검증. 세션 사용자와 리뷰 작성자가 같은지 서버에서 반드시 확인한다.
  if (row[0].userId !== userId) throw new ReviewError("FORBIDDEN", "본인의 평가만 수정할 수 있습니다.");

  await db.transaction(async (tx) => {
    await tx
      .update(reviews)
      .set({ comment: input.comment, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId));
    await tx.delete(reviewRatings).where(eq(reviewRatings.reviewId, reviewId));
    await tx.insert(reviewRatings).values(input.ratings.map((r) => ({ reviewId, ...r })));
  });

  await recomputeCommunity(row[0].modelId);
  return { modelId: row[0].modelId };
}

export async function deleteReview(userId: string, reviewId: string) {
  const row = await db
    .select({ userId: reviews.userId, modelId: reviews.modelId })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);
  if (!row[0]) throw new ReviewError("NOT_FOUND", "리뷰를 찾을 수 없습니다.");
  if (row[0].userId !== userId) throw new ReviewError("FORBIDDEN", "본인의 평가만 삭제할 수 있습니다.");

  await db.delete(reviews).where(eq(reviews.id, reviewId));
  await recomputeCommunity(row[0].modelId);
  return { modelId: row[0].modelId };
}

export type ReviewSort = "recent" | "high" | "low";

export interface ReviewListItem {
  id: string;
  authorName: string;
  authorImage: string | null;
  comment: string | null;
  createdAt: string;
  isMine: boolean;
  ratings: { category: string; score: number }[];
  average: number;
}

export async function listReviews(
  slug: string,
  { sort = "recent", limit = 10, offset = 0, viewerId, modelId: knownId }:
  { sort?: ReviewSort; limit?: number; offset?: number; viewerId?: string; modelId?: string } = {}
) {
  // 호출자가 이미 id를 알고 있으면 slug→id 조회를 건너뛴다.
  // 상세 페이지에서 이 한 번이 왕복 한 번이라 그대로 지연이 된다.
  const modelId = knownId ?? (await modelIdBySlug(slug));

  // 정렬 키는 화이트리스트에서만 고른다. 사용자 입력을 SQL에 직접 넣지 않는다.
  const orderBy =
    sort === "high" ? sql`avg_score DESC, created_at DESC`
    : sort === "low" ? sql`avg_score ASC, created_at DESC`
    : sql`created_at DESC`;

  const rows = await db.execute<{
    id: string; comment: string | null; created_at: string; user_id: string;
    author_name: string | null; author_image: string | null;
    avg_score: number; ratings: { category: string; score: number }[] | null; total: string;
  }>(sql`
    WITH base AS (
      SELECT r.id, r.comment, r.created_at, r.user_id,
             u.name AS author_name, u.image AS author_image,
             COALESCE(AVG(rr.score), 0) AS avg_score,
             JSON_AGG(JSON_BUILD_OBJECT('category', rr.category, 'score', rr.score)
                      ORDER BY rr.category) FILTER (WHERE rr.id IS NOT NULL) AS ratings
      FROM review r
      JOIN "user" u ON u.id = r.user_id
      LEFT JOIN review_rating rr ON rr.review_id = r.id
      WHERE r.model_id = ${modelId}
      GROUP BY r.id, u.name, u.image
    )
    SELECT *, COUNT(*) OVER ()::text AS total FROM base
    ORDER BY ${orderBy}
    LIMIT ${limit} OFFSET ${offset}
  `);

  const list = rows.rows ?? [];
  const items: ReviewListItem[] = list.map((r) => ({
    id: r.id,
    authorName: r.author_name ?? "익명",
    authorImage: r.author_image,
    comment: r.comment,
    createdAt: new Date(r.created_at).toISOString(),
    isMine: viewerId !== undefined && r.user_id === viewerId,
    ratings: r.ratings ?? [],
    average: Number(r.avg_score),
  }));

  return { items, total: list.length > 0 ? Number(list[0].total) : 0 };
}

export async function getMyReview(userId: string, slug: string, knownId?: string) {
  const modelId = knownId ?? (await modelIdBySlug(slug));

  // 리뷰와 평점을 한 번에 가져온다. 두 번 나눠 물으면 왕복이 두 번이다.
  const rows = await db.execute<{
    id: string;
    comment: string | null;
    ratings: { category: string; score: number }[] | null;
  }>(sql`
    SELECT r.id, r.comment,
           JSON_AGG(JSON_BUILD_OBJECT('category', rr.category, 'score', rr.score)
                    ORDER BY rr.category) FILTER (WHERE rr.id IS NOT NULL) AS ratings
    FROM review r
    LEFT JOIN review_rating rr ON rr.review_id = r.id
    WHERE r.user_id = ${userId} AND r.model_id = ${modelId}
    GROUP BY r.id
    LIMIT 1
  `);

  const row = rows.rows?.[0];
  if (!row) return null;
  return { id: row.id, comment: row.comment, ratings: row.ratings ?? [] };
}

export { users };
/* Footer: lib/reviews.ts */
