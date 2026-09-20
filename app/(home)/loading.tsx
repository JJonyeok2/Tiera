/* ---------------------------------------------------------------------------
 * Header: 도구 목록 로딩 스켈레톤.
 *
 * 홈은 요청마다 DB를 읽는 동적 페이지다. 이 파일이 없으면 서버가 응답을
 * 만드는 동안 화면이 통째로 비어 있어서, 느릴 때 사용자는 "안 되는 건가"로 읽는다.
 *
 * (home) 라우트 그룹 안에 두는 이유는 랭킹 때와 같다 —
 * app/ 최상단에 두면 /models/[slug]까지 스트리밍으로 바뀌어 notFound()가
 * 404 상태 코드를 못 만든다. 그룹은 URL을 바꾸지 않고 범위만 홈으로 좁힌다.
 * ------------------------------------------------------------------------- */

export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="도구 목록을 불러오는 중">
      <div className="pt-7">
        <div className="h-5 w-64 rounded bg-[var(--color-surface-2)]" />
        <div className="mt-2.5 h-3 w-80 max-w-full rounded bg-[var(--color-surface)]" />
      </div>

      {/* 용도 탭 */}
      <div className="flex flex-wrap gap-1.5 pt-5">
        {[44, 40, 52, 68, 56, 64, 44, 40, 68, 44, 40].map((w, i) => (
          <div key={i} style={{ width: w }} className="h-7 rounded-full bg-[var(--color-surface)]" />
        ))}
      </div>

      <div className="mt-4 h-7 w-24 rounded-full bg-[var(--color-surface)]" />

      {/* 카드 격자 — 실제 목록과 같은 골격이어야 대기가 진행 중으로 읽힌다 */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <div className="h-3.5 w-1/3 rounded bg-[var(--color-surface-2)]" />
            <div className="mt-2 h-2.5 w-1/4 rounded bg-[var(--color-surface-2)]" />
            <div className="mt-3 space-y-1.5">
              <div className="h-2.5 w-full rounded bg-[var(--color-surface-2)]" />
              <div className="h-2.5 w-4/5 rounded bg-[var(--color-surface-2)]" />
            </div>
            <div className="mt-4 flex gap-1.5">
              <div className="h-3 w-14 rounded bg-[var(--color-surface-2)]" />
              <div className="h-3 w-16 rounded bg-[var(--color-surface-2)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
/* Footer: app/(home)/loading.tsx */
