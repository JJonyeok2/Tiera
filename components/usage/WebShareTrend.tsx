"use client";
/* ---------------------------------------------------------------------------
 * Header: 세계 웹 방문 점유율 추이 — 3강 선 그래프. SPEC 26.4.
 *
 * - 확인된 달에만 점을 찍는다. 값이 없는 달은 보간하지 않고, 선은 확인된 점끼리만 잇는다
 *   (점선으로 이어 "그 사이 값은 모른다"를 드러낸다).
 * - x축은 달 사이 실제 간격대로 놓는다. 띄엄띄엄한 달을 같은 간격으로 놓으면 기울기가 거짓말을 한다.
 * - 색만으로 구분하지 않는다 — 선 끝에 이름을 직접 달고, 범례와 표 보기를 함께 둔다.
 * - 마우스를 올리면 그 달의 세 값을 보여준다(세로 기준선 + 툴팁).
 * ------------------------------------------------------------------------- */
import { useMemo, useState } from "react";

export interface TrendSeries {
  key: string;
  name: string;
  color: string;
  /** month(YYYY-MM) → % */
  points: { month: string; value: number }[];
}

const W = 640;
const H = 260;
// 오른쪽 여백은 선 끝 이름표 자리다("ChatGPT 55.7%"가 잘리지 않게).
const PAD = { l: 36, r: 118, t: 14, b: 28 };

function monthIndex(m: string): number {
  const [y, mo] = m.split("-").map(Number);
  return y * 12 + (mo - 1);
}

export default function WebShareTrend({ series, months }: { series: TrendSeries[]; months: string[] }) {
  const [hover, setHover] = useState<string | null>(null);

  const { x, y, ticks, minI, maxI } = useMemo(() => {
    const idx = months.map(monthIndex);
    const minI = Math.min(...idx);
    const maxI = Math.max(...idx);
    const x = (m: string) => PAD.l + ((monthIndex(m) - minI) / Math.max(1, maxI - minI)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - v / 100) * (H - PAD.t - PAD.b);
    return { x, y, ticks: [0, 25, 50, 75, 100], minI, maxI };
  }, [months]);

  const hovered = hover ? series.map((s) => ({ s, p: s.points.find((p) => p.month === hover) })) : [];

  return (
    <figure className="max-w-[720px] space-y-2" data-testid="web-trend">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--color-text-dim)]" aria-hidden>
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-4 rounded" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="생성형 AI 웹 방문 점유율 추이. 아래 표 보기에 같은 값이 있어요."
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-line-soft)" strokeWidth={1} />
              <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-text-mute)">
                {t}%
              </text>
            </g>
          ))}
          {months.map((m) => {
            const i = monthIndex(m);
            // 첫·마지막 달과 1월만 라벨. 모든 달에 쓰면 겹친다.
            const label = i === minI || i === maxI || m.endsWith("-01");
            return label ? (
              <text key={m} x={x(m)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--color-text-mute)">
                {m.replace("-", ".")}
              </text>
            ) : null;
          })}

          {hover && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--color-text-mute)" strokeWidth={1} />
          )}

          {series.map((s) => {
            const pts = [...s.points].sort((a, b) => monthIndex(a.month) - monthIndex(b.month));
            const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.month)},${y(p.value)}`).join(" ");
            const last = pts[pts.length - 1];
            return (
              <g key={s.key}>
                <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" />
                {pts.map((p) => (
                  <circle
                    key={p.month}
                    cx={x(p.month)}
                    cy={y(p.value)}
                    r={4}
                    fill={s.color}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  />
                ))}
                {last && (
                  <text x={x(last.month) + 8} y={y(last.value) + 4} fontSize={12} fill="var(--color-text)">
                    {s.name} {last.value}%
                  </text>
                )}
              </g>
            );
          })}

          {/* 달마다 세로 띠로 마우스 영역을 넓게 잡는다. 점(8px)만 잡게 하면 맞추기 어렵다. */}
          {months.map((m) => (
            <rect
              key={m}
              x={x(m) - 14}
              y={PAD.t}
              width={28}
              height={H - PAD.t - PAD.b}
              fill="transparent"
              onMouseEnter={() => setHover(m)}
            />
          ))}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[12px] shadow-sm"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: "translateX(-50%)" }}
          >
            <div className="mb-1 font-semibold text-[var(--color-text)]">{hover.replace("-", ".")}</div>
            {hovered.map(({ s, p }) => (
              <div key={s.key} className="flex items-center gap-1.5 text-[var(--color-text-dim)]">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name} {p ? `${p.value}%` : "–"}
              </div>
            ))}
          </div>
        )}
      </div>
      <figcaption className="text-[12px] text-[var(--color-text-mute)]">
        점은 Similarweb이 숫자를 공개한 달이에요. 점 사이 점선은 그 사이 값을 모른다는 뜻이에요.
      </figcaption>
      <details className="text-[12.5px]">
        <summary className="cursor-pointer text-[var(--color-text-mute)]">표로 보기</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead>
            <tr className="text-[var(--color-text-mute)]">
              <th className="py-1 font-medium">달</th>
              {series.map((s) => (
                <th key={s.key} className="py-1 text-right font-medium">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m} className="border-t border-[var(--color-line-soft)] text-[var(--color-text-dim)]">
                <td className="py-1">{m.replace("-", ".")}</td>
                {series.map((s) => {
                  const p = s.points.find((q) => q.month === m);
                  return (
                    <td key={s.key} className="py-1 text-right">{p ? `${p.value}%` : "–"}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
/* Footer: components/usage/WebShareTrend.tsx */
