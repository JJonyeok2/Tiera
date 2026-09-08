/* ---------------------------------------------------------------------------
 * Header: 인메모리 레이트 리미터
 *
 * ⚠️ 단일 프로세스 메모리에만 산다. 서버리스나 다중 인스턴스로 배포하면
 *    인스턴스마다 카운터가 따로 놀아서 사실상 제한이 풀린다.
 *    프로덕션에서는 Redis(Upstash 등)로 교체해야 한다. SPEC 11절.
 *
 * 그럼에도 지금 넣어두는 이유: 리뷰 작성은 점수를 직접 움직이는 쓰기 경로라
 * 제한이 아예 없는 상태로 배포되는 것보다는 낫고, 인터페이스를 미리 고정해두면
 * 나중에 구현체만 갈아끼우면 되기 때문이다.
 * ------------------------------------------------------------------------- */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** 오래된 버킷을 치워 Map이 무한정 커지지 않게 한다. */
export function sweepRateLimit(now = Date.now()) {
  for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
}

/** 리뷰 작성: 사용자당 10분에 5건. SPEC 11절. */
export const REVIEW_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };
/* Footer: lib/rate-limit.ts */
