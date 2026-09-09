/* ---------------------------------------------------------------------------
 * Header: 랭킹 로딩 스켈레톤.
 *
 * 홈은 요청마다 DB를 읽는 동적 페이지다. 이 파일이 없으면 서버가 응답을
 * 만드는 동안 화면이 통째로 비어 있어서, 느릴 때 사용자는 "안 되는 건가"로 읽는다.
 * 실제 목록과 같은 골격을 먼저 그려두면 대기가 진행 중인 상태로 읽힌다.
 *
 * (home) 라우트 그룹 안에 두는 이유:
 *   loading.tsx는 해당 세그먼트와 그 하위 전체에 적용된다. app/ 최상단에 두면
 *   /models/[slug]까지 스트리밍으로 바뀌는데, 스트리밍은 본문보다 헤더가 먼저
 *   나가므로 뒤늦은 notFound()가 상태 코드를 404로 바꾸지 못한다.
 *   실제로 "없는 모델은 404" 테스트가 200을 받으면서 잡혔다.
 *   없는 페이지가 200을 주면 검색엔진에는 soft 404로 잡혀 색인까지 망가진다.
 *   라우트 그룹은 URL에 영향을 주지 않으면서 적용 범위만 홈으로 좁혀준다.
 * ------------------------------------------------------------------------- */

export default function Loading() {
  return (
    <div className="animate-pulse py-5" aria-busy="true" aria-label="랭킹을 불러오는 중">
      <div className="flex gap-2">
        {[64, 52, 52, 52].map((w, i) => (
          <div
            key={i}
            style={{ width: w }}
            className="h-7 rounded-lg bg-[var(--color-surface-2)]"
          />
        ))}
      </div>

      <div className="mt-3 flex gap-1.5">
        {[46, 40, 52, 40, 60].map((w, i) => (
          <div key={i} style={{ width: w }} className="h-7 rounded-md bg-[var(--color-surface)]" />
        ))}
      </div>

      <div className="mt-6 h-3 w-40 rounded bg-[var(--color-surface)]" />

      <div className="mt-5 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[var(--color-line-soft)] pb-3.5">
            <div className="h-3 w-5 rounded bg-[var(--color-surface)]" />
            <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--color-surface-2)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded bg-[var(--color-surface-2)]" />
              <div className="h-2.5 w-1/4 rounded bg-[var(--color-surface)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
/* Footer: app/loading.tsx */
