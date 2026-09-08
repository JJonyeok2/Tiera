/* Header: 점수 산정 방식.
   MVP 필수 페이지다. 산정 근거를 공개하지 않으면 "이 사이트 점수 신뢰 못 함"이
   첫 피드백으로 온다. 상수는 코드에서 직접 읽어와 문서와 구현이 어긋나지 않게 한다. */
import type { Metadata } from "next";
import Link from "next/link";
import TierStar from "@/components/tier/TierStar";
import { TIER_DESC, TIER_LABEL, TIERS, tierVar } from "@/components/tier/tierTokens";
import {
  BENCH_FLOOR,
  CATEGORY_WEIGHT,
  CONFIDENCE_M,
  GAP_RANK_THRESHOLD,
  MIN_MODELS_FOR_NORMALIZATION,
} from "@/lib/scoring/constants";
import { CATEGORY_LABEL } from "@/lib/labels";
import { SEED_SOURCE_NAME } from "@/db/seed-data";

export const metadata: Metadata = {
  title: "점수 산정 방식 — Tiera",
  description: "Tiera가 커뮤니티 점수와 벤치마크 점수를 어떻게 계산하는지.",
};

export default function AboutPage() {
  return (
    <article className="space-y-10 py-8 text-sm leading-relaxed text-[var(--color-text-dim)]">
      <header className="space-y-2">
        <Link href="/" className="text-xs text-[var(--color-text-mute)] hover:underline">← 랭킹으로</Link>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">점수는 이렇게 계산합니다</h1>
        <p>
          Tiera는 <strong className="text-[var(--color-text)]">벤치마크 점수(스펙)</strong>와{" "}
          <strong className="text-[var(--color-text)]">커뮤니티 점수(체감)</strong>를 따로 계산해
          나란히 보여줍니다. 둘이 어긋나는 지점이 이 사이트에서 가장 볼 만한 부분입니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">티어</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {TIERS.map((t) => (
            <div key={t} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-center">
              <div className="flex justify-center"><TierStar tier={t} size={52} glow /></div>
              <p className="mt-2 text-[10px] tracking-[0.2em]" style={{ color: tierVar(t) }}>
                {TIER_LABEL[t]}
              </p>
              <p className="mt-1 text-[11px] text-[var(--color-text-mute)]">{TIER_DESC[t]}</p>
              <p className="mt-1 text-[11px] tabular-nums text-[var(--color-text-mute)]">
                {t === "prism" ? "90 – 100" : t === "gold" ? "80 – 89.9" : t === "silver" ? "65 – 79.9" : "0 – 64.9"}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-text-mute)]">
          컷은 절대 기준입니다. 상위 몇 %를 잘라 티어를 주는 방식이 아니라서, 모델 전반이 좋아지면
          Prism이 늘어납니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">커뮤니티 점수</h2>
        <p>
          사용자는 카테고리별로 5점 척도로 평가합니다. 안 써본 카테고리는 건너뛸 수 있고,
          건너뛴 항목은 계산에서 통째로 빠집니다.
        </p>
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>카테고리별 평균을 100점으로 환산합니다 (1점 = 20점, 5점 = 100점).</li>
          <li>
            평가 수가 적은 모델은 전체 평균 쪽으로 끌어당깁니다 —{" "}
            <code className="rounded bg-[var(--color-surface-2)] px-1 text-xs">
              S = (v·R + {CONFIDENCE_M}·C) / (v + {CONFIDENCE_M})
            </code>
            . 리뷰 3개짜리 신규 모델이 평균 5.0으로 1위를 먹는 일을 막기 위해서입니다.
          </li>
          <li>
            카테고리 점수를 가중 평균해 종합을 냅니다 —{" "}
            {Object.entries(CATEGORY_WEIGHT)
              .map(([c, w]) => `${CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL]} ${w}`)
              .join(" · ")}
          </li>
        </ol>
        <p className="text-xs text-[var(--color-text-mute)]">
          리뷰가 {CONFIDENCE_M}개 미만이면 <strong>평가 중</strong>으로 표시하고 점수 링을
          점선으로 그립니다. 점수가 아직 크게 움직일 수 있다는 뜻입니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">벤치마크 점수</h2>
        <p>
          MMLU(%)와 LMArena(Elo)처럼 단위가 전혀 다른 지표를 한 축에 올리기 위해, 각 벤치마크를
          등록된 모델 집합 안에서 {BENCH_FLOOR}~100으로 정규화한 뒤 가중 평균합니다.
          결과가 {MIN_MODELS_FOR_NORMALIZATION}개 모델 미만인 벤치마크는 제외합니다.
        </p>
        <p className="text-xs text-[var(--color-text-mute)]">
          하한을 0이 아니라 {BENCH_FLOOR}으로 둔 이유는, 5점 척도를 환산한 커뮤니티 점수의 바닥이
          20점이기 때문입니다. 두 점수를 나란히 놓고 보는 사이트라서 축의 바닥을 맞춰야 합니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">괴리 배지</h2>
        <p>
          두 점수의 <strong className="text-[var(--color-text)]">순위</strong>가{" "}
          {GAP_RANK_THRESHOLD}계단 이상 벌어지면 배지를 붙입니다.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong className="text-sky-300">체감 우위</strong> — 벤치마크 순위보다 커뮤니티 평가가 높은 모델</li>
          <li><strong className="text-fuchsia-300">스펙 우위</strong> — 벤치마크 순위는 높지만 체감 평가는 아쉬운 모델</li>
        </ul>
        <p className="text-xs text-[var(--color-text-mute)]">
          점수 차가 아니라 순위 차로 판정합니다. 벤치마크 점수는 정규화 결과라 본질적으로 상대
          순위이고 커뮤니티 점수는 절대 평점이어서, 둘의 점수를 그냥 빼면 &ldquo;평가가
          엇갈렸다&rdquo;가 아니라 &ldquo;두 척도의 분포가 다르다&rdquo;를 재게 됩니다.
        </p>
      </section>

      <section className="space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
        <h2 className="text-sm font-semibold text-amber-300">현재 데이터에 대한 고지</h2>
        <p className="text-xs">
          지금 이 사이트에 올라와 있는 벤치마크 수치는 출처가 &ldquo;{SEED_SOURCE_NAME}&rdquo;로
          표시된 <strong>예시 값</strong>입니다. 실제 측정치가 아니며, UI와 점수 계산을 검증하기
          위해 넣어둔 개발용 데이터입니다. 리뷰 역시 개발용으로 생성된 것입니다.
        </p>
      </section>

      <p className="text-xs text-[var(--color-text-mute)]">
        Tiera는 재미로 보는 AI 티어표입니다. 모델 선택의 유일한 근거로 삼지 마세요.
      </p>
    </article>
  );
}
/* Footer: app/about/page.tsx */
