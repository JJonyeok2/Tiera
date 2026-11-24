/* ---------------------------------------------------------------------------
 * Header: 로컬 모델 카드 — 모델 이름·티어·필요 메모리 막대·실행 명령. SPEC 25.6.
 *
 * 막대는 "필요 / 이 등급이 쓸 수 있는 양"이다. 넘치면 넘친 만큼 잘라서 꽉 찬 막대로
 * 그리고 숫자로 말한다. 막대가 카드 밖으로 뻗으면 레이아웃이 깨지고, 넘친 양은
 * 막대 길이보다 숫자가 더 정확하게 전한다.
 * ------------------------------------------------------------------------- */
import Link from "next/link";
import CodeBlock from "@/components/dev/CodeBlock";
import TierStar from "@/components/tier/TierStar";
import { TIER_LABEL, tierVar } from "@/components/tier/tierTokens";
import type { LocalVariant } from "@/lib/local/data";
import type { LocalModelScore } from "@/lib/local/queries";
import { formatContext, formatGb, formatParams, type Judgement } from "@/lib/local/vram";

const BAR_TONE: Record<Judgement["verdict"], string> = {
  fit: "var(--color-up)",
  offload: "var(--c-gold)",
  no: "var(--color-down)",
  short: "var(--color-text-mute)",
};

/** 이 비율을 넘으면 "들어가긴 하지만 빠듯하다"고 따로 알린다 */
const TIGHT = 0.95;

export default function LocalModelCard({
  variant: v,
  judgement: j,
  score,
  context,
}: {
  variant: LocalVariant;
  judgement: Judgement;
  score?: LocalModelScore;
  context: number;
}) {
  const ratio = Math.min(1, j.requiredGb / j.capacityGb);

  return (
    <article
      data-testid="local-model-card"
      data-verdict={j.verdict}
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold text-[var(--color-text)]">{v.name}</h3>
          <p className="text-[12.5px] text-[var(--color-text-mute)]">
            {v.developer} · {formatParams(v)} · {v.quant}
          </p>
        </div>
        {score ? (
          <Link
            href={`/models/${score.slug}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-line)] px-2 py-1 transition hover:border-[var(--color-text-mute)]"
            title={`벤치마크 종합 ${score.score.toFixed(1)}점 — 모델 상세 보기`}
          >
            <TierStar tier={score.tier} size={18} />
            <span className="text-[11.5px] font-semibold" style={{ color: tierVar(score.tier) }}>
              {TIER_LABEL[score.tier]}
            </span>
          </Link>
        ) : (
          <span className="shrink-0 text-[11.5px] text-[var(--color-text-mute)]">티어 정보 없음</span>
        )}
      </header>

      {v.note && <p className="text-[13px] leading-relaxed text-[var(--color-text-dim)]">{v.note}</p>}

      {j.verdict === "short" ? (
        <p className="text-[13px] text-[var(--color-text-dim)]">
          이 모델은 최대 {formatContext(v.maxContext)}까지만 받아서 {formatContext(context)}이 필요한 이 쓰임새에는 짧아요.
        </p>
      ) : (
        <div className="space-y-1">
          <div className="flex items-baseline justify-between text-[12.5px]">
            <span className="text-[var(--color-text-dim)]">
              필요 <strong className="tabular-nums text-[var(--color-text)]">{formatGb(j.requiredGb)}</strong>
            </span>
            <span className="tabular-nums text-[var(--color-text-mute)]">쓸 수 있는 양 {formatGb(j.capacityGb)}</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]"
            role="img"
            aria-label={`필요 ${formatGb(j.requiredGb)}, 쓸 수 있는 양 ${formatGb(j.capacityGb)}`}
          >
            <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: BAR_TONE[j.verdict] }} />
          </div>
          {j.verdict === "fit" && ratio > TIGHT && (
            <p className="text-[12px] text-[var(--color-text-mute)]">
              빠듯해요. 브라우저나 게임처럼 그래픽카드를 쓰는 프로그램을 닫고 쓰세요.
            </p>
          )}
          {j.requiredGb > j.capacityGb && (
            <p className="text-[12px] text-[var(--color-text-mute)]">
              {formatGb(j.requiredGb - j.capacityGb)} 모자라요
            </p>
          )}
        </div>
      )}

      {j.verdict !== "short" && j.verdict !== "no" && (
        <CodeBlock code={`ollama run ${v.ollamaTag}`} label="Ollama로 실행" lang="shell" />
      )}
    </article>
  );
}
/* Footer: components/local/LocalModelCard.tsx */
