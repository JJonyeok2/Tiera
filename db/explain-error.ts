/* ---------------------------------------------------------------------------
 * Header: DB 에러를 사람이 읽을 수 있게 펼친다
 *
 * drizzle은 원인을 `cause`에 중첩해서 감춘다. 최상단 메시지만 찍으면
 * "Failed query: ..." 만 보이고 정작 왜 실패했는지가 사라진다.
 * 여기서 cause 체인을 끝까지 따라가며 pg 에러 코드까지 풀어 준다.
 * ------------------------------------------------------------------------- */

const HINTS: Record<string, string> = {
  ENOTFOUND: "호스트 주소를 찾지 못했습니다. 주소 오타를 확인하세요.",
  ECONNREFUSED: "포트가 닫혀 있습니다. 포트 번호(Session 5432 / Transaction 6543)를 확인하세요.",
  ETIMEDOUT: "연결이 시간 초과됐습니다. 방화벽이나 네트워크를 확인하세요.",
  "28P01": "비밀번호가 틀렸습니다. Supabase에서 재설정한 값과 같은지 확인하세요.",
  "28000": "사용자 이름이 틀렸습니다. Shared pooler는 postgres.<프로젝트ref> 형식이어야 합니다.",
  "3D000": "그런 이름의 데이터베이스가 없습니다. 주소 끝이 /postgres 인지 확인하세요.",
  "42501": "권한이 없습니다.",
  XX000: "풀러가 요청을 거절했습니다. 사용자 이름 형식(postgres.<ref>)과 포트를 확인하세요.",
};

export function explainError(e: unknown): string {
  const lines: string[] = [];
  let cur: unknown = e;
  let depth = 0;

  while (cur && depth < 6) {
    const err = cur as { message?: string; code?: string; cause?: unknown; detail?: string };
    if (err.message) lines.push(`  ${depth === 0 ? "" : "↳ "}${err.message}`);
    if (err.detail) lines.push(`     detail: ${err.detail}`);
    if (err.code) {
      lines.push(`     code: ${err.code}`);
      const hint = HINTS[err.code];
      if (hint) lines.push(`     → ${hint}`);
    }
    cur = err.cause;
    depth += 1;
  }

  return lines.length > 0 ? lines.join("\n") : `  ${String(e)}`;
}
/* Footer: db/explain-error.ts */
