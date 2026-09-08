/* ---------------------------------------------------------------------------
 * Header: 개발용 더미 리뷰 정리
 *
 * 시드가 만든 가짜 평가를 걷어낸다. 벤치마크가 실데이터로 바뀐 뒤에도
 * 여론만 가짜로 남아 있으면, 이 서비스의 핵심인 괴리 배지가
 * "진짜 벤치마크 vs 가짜 여론"을 비교하는 꼴이 된다.
 *
 * 삭제 범위는 **@tiera.local 계정이 쓴 리뷰로 한정**한다.
 * 시드 사용자는 그 도메인으로만 만들어지므로(db/seed.ts), 실제 사용자의
 * 평가는 구조적으로 지워질 수 없다. 실수로라도 범위를 넓히지 말 것.
 * ------------------------------------------------------------------------- */

import { like } from "drizzle-orm";
import { db } from "@/db";
import { reviews, users } from "@/db/schema";
import { recomputeCommunity } from "@/lib/scoring/recompute";

/** 시드 사용자를 식별하는 유일한 조건 */
export const DEMO_EMAIL_PATTERN = "seed-user-%@tiera.local";

export interface PurgeReport {
  usersRemoved: number;
  /** 리뷰·평점은 사용자 삭제 시 FK cascade로 함께 지워진다 */
  reviewsRemoved: number;
}

export async function purgeDemoReviews(): Promise<PurgeReport> {
  const demoUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, DEMO_EMAIL_PATTERN));

  if (demoUsers.length === 0) {
    return { usersRemoved: 0, reviewsRemoved: 0 };
  }

  const reviewsBefore = await db.$count(reviews);

  // review / review_rating 은 user_id FK가 cascade라 계정만 지우면 따라 지워진다.
  await db.delete(users).where(like(users.email, DEMO_EMAIL_PATTERN));

  const reviewsAfter = await db.$count(reviews);

  // 리뷰가 사라졌으니 커뮤니티 점수를 다시 계산한다.
  // 이걸 빼먹으면 리뷰는 없는데 점수만 남아 랭킹이 거짓말을 한다.
  await recomputeCommunity();

  return {
    usersRemoved: demoUsers.length,
    reviewsRemoved: reviewsBefore - reviewsAfter,
  };
}
/* Footer: lib/demo-data.ts */
