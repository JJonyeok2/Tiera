/* ---------------------------------------------------------------------------
 * Header: /local/[class] — VRAM 등급 페이지(예: /local/8gb). SPEC 25.6.
 *
 * 쓰임새 탭(대화/긴 문서/에이전트)과 시스템 RAM 입력을 **링크와 GET 폼**으로 만든다.
 * 클라이언트 상태가 없으니 URL 하나로 화면이 재현되고, 자바스크립트 없이도 동작한다.
 *
 * canonical은 등급 페이지 자체다. ?gpu=는 "찾아온 카드 강조"일 뿐 결과를 바꾸지 않고,
 * ?use=·?ram=은 같은 문서의 보기 전환이라 색인 단위로 쪼개지 않는다.
 *
 * 정렬: 같은 판정 안에서 벤치마크 티어 점수 높은 순, 티어가 없으면 뒤로, 그다음 큰 모델 순.
 * "되는 것 중 가장 똑똑한 것"이 맨 위에 와야 고르는 데 도움이 된다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LocalModelCard from "@/components/local/LocalModelCard";
import {
  LOCAL_CHECKED_AT,
  LOCAL_VARIANTS,
  VRAM_CLASSES,
  getGpu,
  getVramClass,
  gpusInClass,
  type LocalVariant,
} from "@/lib/local/data";
import { getLocalScores, type LocalModelScore } from "@/lib/local/queries";
import {
  USE_CASES,
  formatContext,
  judge,
  unlockedByNext,
  pickUseCase,
  type Judgement,
  type Verdict,
} from "@/lib/local/vram";
import { shareMeta } from "@/lib/site";

export function generateStaticParams() {
  return VRAM_CLASSES.map((c) => ({ class: c.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ class: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { class: slug } = await params;
  const c = getVramClass(slug);
  if (!c) return {};
  const cards = gpusInClass(c).slice(0, 4).map((g) => g.name);
  const title =
    c.kind === "UNIFIED"
      ? `${c.label} 메모리로 돌릴 수 있는 로컬 AI 모델`
      : `${c.label} 그래픽카드로 돌릴 수 있는 로컬 AI 모델`;
  const desc =
    (cards.length ? `${cards.join(", ")} 등 ` : "") +
    `${c.label}에서 쾌적하게 도는 로컬 LLM과 Ollama 실행 명령. 대화·긴 문서·에이전트 용도별로 골라요.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/local/${c.slug}` },
    ...shareMeta({ url: `/local/${c.slug}`, title: `${title} — Tiera`, description: desc }),
  };
}

const GROUPS: { verdict: Verdict[]; title: string; open: boolean; empty?: string }[] = [
  { verdict: ["fit"], title: "그래픽카드에 다 들어가요", open: true, empty: "이 쓰임새로 쾌적하게 도는 모델이 없어요." },
  { verdict: ["offload"], title: "느리지만 돌아가요", open: false },
  { verdict: ["no", "short"], title: "이 카드로는 어려워요", open: false },
];

interface Row {
  v: LocalVariant;
  j: Judgement;
  score?: LocalModelScore;
}

function sortRows(a: Row, b: Row): number {
  const sa = a.score?.score ?? -1;
  const sb = b.score?.score ?? -1;
  if (sa !== sb) return sb - sa;
  return b.v.paramsB - a.v.paramsB;
}

export default async function VramClassPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { class: slug } = await params;
  const c = getVramClass(slug);
  if (!c) notFound();

  const sp = await searchParams;
  const use = pickUseCase(one(sp.use));
  const ramRaw = Number(one(sp.ram));
  // 입력값은 신뢰하지 않는다. 1~1024GB 정수만 받는다.
  const ram = Number.isInteger(ramRaw) && ramRaw >= 1 && ramRaw <= 1024 ? ramRaw : undefined;
  const gpu = getGpu(one(sp.gpu) ?? "");
  const cards = gpusInClass(c);
  const highlighted = gpu && cards.some((g) => g.slug === gpu.slug) ? gpu : undefined;

  const scores = await getLocalScores(LOCAL_VARIANTS);
  const rows: Row[] = LOCAL_VARIANTS.map((v) => ({
    v,
    j: judge(v, c, use.context, c.kind === "DEDICATED" ? ram : undefined),
    score: scores.get(v.id),
  }));
  const up = unlockedByNext(c, use.context);

  const href = (next: { use?: string; ram?: number }) => {
    const q = new URLSearchParams();
    const u = next.use ?? use.id;
    if (u !== "chat") q.set("use", u);
    const r = "ram" in next ? next.ram : ram;
    if (r) q.set("ram", String(r));
    if (highlighted) q.set("gpu", highlighted.slug);
    const s = q.toString();
    return `/local/${c.slug}${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-8">
      <Link href="/local" className="text-[13px] text-[var(--color-text-mute)] hover:underline">
        ← 다른 그래픽카드
      </Link>

      <header className="space-y-2">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[var(--color-text)]">
          {c.kind === "UNIFIED" ? `${c.label} 메모리로` : `${c.label} 그래픽카드로`} 돌릴 수 있는 AI
        </h1>
        {cards.length > 0 && (
          <p className="text-[13.5px] leading-relaxed text-[var(--color-text-dim)]" data-testid="class-cards">
            이 등급:{" "}
            {cards.map((g, i) => (
              <span key={g.slug}>
                {i > 0 && ", "}
                <span
                  className={
                    g.slug === highlighted?.slug
                      ? "rounded bg-[var(--color-surface-2)] px-1 font-semibold text-[var(--color-text)]"
                      : undefined
                  }
                  data-highlighted={g.slug === highlighted?.slug || undefined}
                >
                  {g.name}
                  {g.memoryGb !== c.memoryGb && ` (${g.memoryGb}GB)`}
                </span>
              </span>
            ))}
          </p>
        )}
        {c.kind === "UNIFIED" && (
          <p className="text-[13.5px] text-[var(--color-text-dim)]">
            Mac은 메모리를 운영체제와 나눠 써서 {c.memoryGb}GB 중 약 70%를 AI 몫으로 봤어요.
          </p>
        )}
        <p className="text-[12px] text-[var(--color-text-mute)]">
          {LOCAL_CHECKED_AT} 기준 ·{" "}
          <Link href="/about#local" className="underline underline-offset-4">
            계산 추정치
          </Link>
          예요. 다른 프로그램이 그래픽카드를 쓰고 있으면 덜 들어가요.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-[15px] font-bold text-[var(--color-text)]">어디에 쓸 건가요</h2>
        <nav className="flex flex-wrap gap-2" aria-label="쓰임새" data-testid="use-tabs">
          {USE_CASES.map((u) => {
            const on = u.id === use.id;
            return (
              <Link
                key={u.id}
                href={href({ use: u.id })}
                aria-current={on ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 text-[13.5px] transition ${
                  on
                    ? "border-[var(--color-text)] bg-[var(--color-text)] font-semibold text-[var(--color-bg)]"
                    : "border-[var(--color-line)] text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
                }`}
              >
                {u.label}
              </Link>
            );
          })}
        </nav>
        <p className="text-[13px] text-[var(--color-text-mute)]">
          {use.desc} · 한 번에 {formatContext(use.context)} 토큰까지 기억하는 기준이에요. 길수록 메모리를 더 써요.
        </p>

        {c.kind === "DEDICATED" && (
          <form method="get" action={`/local/${c.slug}`} className="flex flex-wrap items-center gap-2" data-testid="ram-form">
            {use.id !== "chat" && <input type="hidden" name="use" value={use.id} />}
            {highlighted && <input type="hidden" name="gpu" value={highlighted.slug} />}
            <label htmlFor="ram" className="text-[13px] text-[var(--color-text-dim)]">
              시스템 RAM(선택)
            </label>
            <input
              id="ram"
              name="ram"
              type="number"
              inputMode="numeric"
              min={1}
              max={1024}
              defaultValue={ram}
              placeholder="32"
              className="w-20 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1 text-[13.5px] tabular-nums text-[var(--color-text)]"
            />
            <span className="text-[13px] text-[var(--color-text-dim)]">GB</span>
            <button
              type="submit"
              className="rounded-lg border border-[var(--color-line)] px-3 py-1 text-[13px] text-[var(--color-text-dim)] transition hover:border-[var(--color-text-mute)]"
            >
              반영
            </button>
            <span className="text-[12px] text-[var(--color-text-mute)]">
              넣으면 &quot;느리지만 돌아가요&quot;도 보여줘요
            </span>
          </form>
        )}
      </section>

      {GROUPS.map((g) => {
        if (g.verdict.includes("offload") && (c.kind !== "DEDICATED" || !ram)) return null;
        const items = rows.filter((r) => g.verdict.includes(r.j.verdict)).sort(sortRows);
        if (items.length === 0 && !g.empty) return null;
        const body =
          items.length === 0 ? (
            <p className="text-[13.5px] text-[var(--color-text-mute)]">{g.empty}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((r) => (
                <LocalModelCard key={r.v.id} variant={r.v} judgement={r.j} score={r.score} context={use.context} />
              ))}
            </div>
          );
        return g.open ? (
          <section key={g.title} className="space-y-3" data-testid={`group-${g.verdict[0]}`}>
            <h2 className="text-[17px] font-bold text-[var(--color-text)]">
              {g.title} <span className="text-[13px] font-normal text-[var(--color-text-mute)]">{items.length}개</span>
            </h2>
            {body}
          </section>
        ) : (
          <details key={g.title} className="group space-y-3" data-testid={`group-${g.verdict[0]}`}>
            <summary className="cursor-pointer list-none text-[17px] font-bold text-[var(--color-text)]">
              <span className="mr-1 inline-block transition group-open:rotate-90">›</span>
              {g.title} <span className="text-[13px] font-normal text-[var(--color-text-mute)]">{items.length}개</span>
            </summary>
            {body}
          </details>
        );
      })}

      {up && up.models.length > 0 && (
        <section className="space-y-2 rounded-2xl bg-[var(--color-surface-2)] p-5" data-testid="next-class">
          <h2 className="text-[15px] font-bold text-[var(--color-text)]">
            한 단계 위 {up.next.label}이면 이것까지 돼요
          </h2>
          <p className="text-[13.5px] text-[var(--color-text-dim)]">
            {up.models.map((m) => m.name).join(", ")}
          </p>
          <Link
            href={`/local/${up.next.slug}${use.id !== "chat" ? `?use=${use.id}` : ""}`}
            className="text-[13px] font-medium text-[var(--color-text)] underline underline-offset-4"
          >
            {up.next.label} 보기 →
          </Link>
        </section>
      )}
    </div>
  );
}
/* Footer: app/local/[class]/page.tsx */
