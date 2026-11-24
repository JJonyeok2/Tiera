/* ---------------------------------------------------------------------------
 * Header: 모델 상세의 "내 컴퓨터로 돌리려면" — /local의 역방향. SPEC 25.6.
 *
 * 모델에서 출발한 사람에게 "어떤 카드가 있어야 하나"를 쓰임새별 한 줄로 답한다.
 * 로컬 변형이 없는 모델(API 전용)에서는 아무것도 그리지 않는다.
 * ------------------------------------------------------------------------- */
import Link from "next/link";
import CodeBlock from "@/components/dev/CodeBlock";
import { variantsForModel } from "@/lib/local/data";
import { USE_CASES, formatGb, minimumClass, requiredGb } from "@/lib/local/vram";

export default function LocalRunSection({ modelSlug }: { modelSlug: string }) {
  const variants = variantsForModel(modelSlug);
  if (variants.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="local-run">
      <h2 className="text-sm font-semibold text-[var(--color-text-dim)]">내 컴퓨터로 돌리려면</h2>
      {variants.map((v) => (
        <div key={v.id} className="space-y-3 rounded-xl border border-[var(--color-line)] p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left text-[11px] text-[var(--color-text-mute)]">
                  <th className="py-2 font-medium">쓰임새</th>
                  <th className="py-2 text-right font-medium">필요 메모리</th>
                  <th className="py-2 text-right font-medium">그래픽카드</th>
                  <th className="py-2 text-right font-medium">Mac</th>
                </tr>
              </thead>
              <tbody>
                {USE_CASES.map((u) => {
                  const short = u.context > v.maxContext;
                  const gpu = minimumClass(v, u.context, "DEDICATED");
                  const mac = minimumClass(v, u.context, "UNIFIED");
                  return (
                    <tr key={u.id} className="border-b border-[var(--color-line-soft)]">
                      <td className="py-2">{u.label}</td>
                      <td className="py-2 text-right tabular-nums text-[var(--color-text-dim)]">
                        {short ? "–" : formatGb(requiredGb(v, u.context))}
                      </td>
                      <td className="py-2 text-right">
                        {short ? (
                          <span className="text-[var(--color-text-mute)]">컨텍스트가 짧아요</span>
                        ) : gpu ? (
                          <Link href={`/local/${gpu.slug}?use=${u.id}`} className="underline underline-offset-4">
                            {gpu.label}부터
                          </Link>
                        ) : (
                          <span className="text-[var(--color-text-mute)]">한 장으로는 어려워요</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {short ? (
                          "–"
                        ) : mac ? (
                          <Link href={`/local/${mac.slug}?use=${u.id}`} className="underline underline-offset-4">
                            {mac.label}부터
                          </Link>
                        ) : (
                          <span className="text-[var(--color-text-mute)]">어려워요</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <CodeBlock code={`ollama run ${v.ollamaTag}`} label={`Ollama로 실행 · ${v.quant} ${formatGb(v.sizeGb)}`} lang="shell" />
          <p className="text-[11.5px] text-[var(--color-text-mute)]">
            <Link href="/about#local" className="underline underline-offset-2">계산 추정치</Link>예요. 그래픽카드 한 장 기준.
          </p>
        </div>
      ))}
    </section>
  );
}
/* Footer: components/local/LocalRunSection.tsx */
