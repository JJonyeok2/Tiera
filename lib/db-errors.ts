/* ---------------------------------------------------------------------------
 * Header: DB 에러 판별.
 *
 * "먼저 있는지 확인하고 없으면 넣는다"는 순서만으로는 중복을 못 막는다.
 * 요청 두 개가 동시에 오면 둘 다 확인을 통과한 뒤 둘 다 넣으려고 한다.
 * 실제로 막아주는 건 DB의 unique 제약이고, 그때 나는 에러가 23505다.
 *
 * 이걸 따로 잡지 않으면 두 번째 요청은 "이미 평가했어요"(409)가 아니라
 * 서버 오류(500)를 받는다. 데이터는 멀쩡한데 사용자에게는 고장으로 보인다.
 * ------------------------------------------------------------------------- */

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";

/**
 * Drizzle은 pg 에러를 DrizzleQueryError로 한 겹 감싼다. 코드는 cause 쪽에 있다.
 * 감싸는 방식이 버전마다 달라질 수 있어서 cause를 몇 겹까지 따라 내려간다.
 */
export function isUniqueViolation(e: unknown): boolean {
  let cur: unknown = e;
  for (let depth = 0; depth < 4 && cur; depth++) {
    if (typeof cur === "object" && cur !== null && "code" in cur) {
      if ((cur as { code?: unknown }).code === UNIQUE_VIOLATION) return true;
    }
    cur = typeof cur === "object" && cur !== null ? (cur as { cause?: unknown }).cause : undefined;
  }
  return false;
}
/* Footer: lib/db-errors.ts */
