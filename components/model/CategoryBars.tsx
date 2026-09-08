/* Header: 카테고리별 점수 막대. 커뮤니티/벤치마크 두 계열을 겹쳐 보여준다.
   두 점수 모두 20~100 밴드에 있으므로 같은 축에 그려도 된다 (lib/scoring/constants.ts). */
import { BENCH_FLOOR } from "@/lib/scoring/constants";
import { CATEGORY_LABEL } from "@/lib/labels";
import type { ScoreCell } from "@/lib/queries";
import type { ScoreScope } from "@/db/schema";

const CATS: ScoreScope[] = ["CODING", "WRITING", "REASONING", "MULTIMODAL"];

/** 20~100 밴드를 0~100% 너비로 편다. */
const pct = (v: number) => Math.max(0, Math.min(100, ((v - BENCH_FLOOR) / (100 - BENCH_FLOOR)) * 100));

export default function CategoryBars({
  community, benchmark,
}: {
  community: Partial<Record<ScoreScope, ScoreCell>>;
  benchmark: Partial<Record<ScoreScope, ScoreCell>>;
}) {
  return (
    <section aria-label="카테고리별 점수" className="space-y-3">
      <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-mute)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm bg-[var(--color-tier-prism)]" /> 커뮤니티
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm bg-[var(--color-text-mute)]" /> 벤치마크
        </span>
      </div>

      {CATS.map((c) => {
        const cm = community[c];
        const bm = benchmark[c];
        return (
          <div key={c} className="grid grid-cols-[64px_1fr_88px] items-center gap-3">
            <span className="text-xs text-[var(--color-text-dim)]">{CATEGORY_LABEL[c]}</span>
            <div className="space-y-1">
              <Bar value={cm?.score} color="var(--color-tier-prism)" />
              <Bar value={bm?.score} color="var(--color-text-mute)" />
            </div>
            <span className="text-right text-[11px] tabular-nums text-[var(--color-text-mute)]">
              {cm ? cm.score.toFixed(0) : "–"} / {bm ? bm.score.toFixed(0) : "–"}
            </span>
          </div>
        );
      })}
    </section>
  );
}

function Bar({ value, color }: { value?: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-sm bg-[var(--color-surface-2)]">
      {value !== undefined && (
        <div className="h-full rounded-sm" style={{ width: `${pct(value)}%`, background: color }} />
      )}
    </div>
  );
}
/* Footer: components/model/CategoryBars.tsx */
