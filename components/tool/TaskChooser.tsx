/* ---------------------------------------------------------------------------
 * Header: 하려는 일 고르기 — 홈 첫 화면의 주인공.
 *
 * 이 사이트에 오는 사람은 도구 이름을 모른다. 아는 건 "발표자료를 만들어야 한다"
 * 같은 할 일이다. 그래서 첫 화면은 도구가 아니라 **할 일**을 고르게 한다.
 *
 * 예전엔 작은 알약 탭(대화 8 · 자료조사 11 …)이었다. 숫자와 명사만 있어서 탭 하나가
 * 뭘 뜻하는지 눌러 봐야 알았다. 여기서는 칸마다 할 일을 문장으로 적고, 그 칸에
 * 들어 있는 도구 로고를 몇 개 보여준다 — "아, 캔바가 여기 있구나"로 길을 찾는다.
 *
 * 링크다(버튼이 아니라). 클라이언트 JS 없이 동작하고, 새 탭으로 열 수도 있고,
 * 검색엔진도 /?for=… 페이지를 따라간다.
 * ------------------------------------------------------------------------- */
import Link from "next/link";
import ToolLogo from "@/components/tool/ToolLogo";
import type { ToolPurpose } from "@/db/schema";
import type { ToolListRow } from "@/lib/queries";
import { PURPOSE_HINT, PURPOSE_LABEL } from "@/lib/labels";
import { PURPOSES } from "@/lib/params";

/** 칸마다 보여줄 로고 수. 더 많으면 칸이 로고 진열장이 된다. */
const PREVIEW = 3;

export default function TaskChooser({
  tools,
  totals,
}: {
  tools: ToolListRow[];
  totals: Record<ToolPurpose, number>;
}) {
  const kr = tools.filter((t) => t.origin === "KR");
  const krPreview = kr.filter((t) => t.logoUrl).slice(0, PREVIEW);

  return (
    <nav aria-label="용도" className="mt-7">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {PURPOSES.map((p) => {
          // 본업인 도구를 먼저, 겸하는 도구는 그다음. 목록 정렬과 같은 순서다.
          const inTab = [
            ...tools.filter((t) => t.purpose === p),
            ...tools.filter((t) => t.purpose !== p && t.alsoFor.includes(p)),
          ];
          const preview = inTab.filter((t) => t.logoUrl).slice(0, PREVIEW);
          const count = totals[p];
          return (
            <Link
              key={p}
              href={`/?for=${p}`}
              className="group flex min-h-[7.5rem] flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-text-mute)]"
            >
              <span className="text-[17px] font-bold leading-snug tracking-tight text-[var(--color-text)]">
                {PURPOSE_LABEL[p]}
                {/* 개수는 이름 바로 옆에 붙인다. 따로 떨어뜨리면 무슨 숫자인지 읽히지 않는다. */}
                <span
                  data-count
                  className="ml-1.5 text-[13px] font-normal tabular-nums text-[var(--color-text-mute)]"
                >
                  {count}
                </span>
              </span>
              <span className="mt-1 text-[13px] leading-snug text-[var(--color-text-mute)]">
                {PURPOSE_HINT[p]}
              </span>
              {preview.length > 0 && (
                <span
                  className="mt-auto flex items-center gap-1 pt-3"
                  aria-hidden="true"
                >
                  {preview.map((t) => (
                    <ToolLogo
                      key={t.slug}
                      name={t.name}
                      logoUrl={t.logoUrl}
                      size="sm"
                    />
                  ))}
                </span>
              )}
            </Link>
          );
        })}
        {/* 열두 번째 칸. 용도가 열한 갈래라 격자 끝이 한 칸 비어 있었는데, 그 자리에
            "한국에서 만든 도구"를 둔다 — 2·3·4열 어디서든 줄이 꽉 찬다. 용도는 아니지만
            "한국어가 제일 잘 되는 걸 원한다"는 것도 고르는 출발점이 되기 때문이다. */}
        <Link
          href="/?origin=KR"
          className="group flex min-h-[7.5rem] flex-col rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-text-mute)]"
        >
          <span className="text-[17px] font-bold leading-snug tracking-tight text-[var(--color-text)]">
            한국에서 만든 도구
            <span className="ml-1.5 text-[13px] font-normal tabular-nums text-[var(--color-text-mute)]">
              {kr.length}
            </span>
          </span>
          <span className="mt-1 text-[13px] leading-snug text-[var(--color-text-mute)]">
            한국어가 제일 자연스러운 것부터
          </span>
          {krPreview.length > 0 && (
            <span
              className="mt-auto flex items-center gap-1 pt-3"
              aria-hidden="true"
            >
              {krPreview.map((t) => (
                <ToolLogo
                  key={t.slug}
                  name={t.name}
                  logoUrl={t.logoUrl}
                  size="sm"
                />
              ))}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
/* Footer: components/tool/TaskChooser.tsx */
