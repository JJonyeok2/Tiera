/* ---------------------------------------------------------------------------
 * Header: 점수 매기는 방식.
 *
 * 산정 근거를 공개하지 않으면 "이 사이트 점수 못 믿겠다"가 첫 피드백으로 온다.
 * 숫자(가중치·보정 강도·최소 후기 수)는 전부 코드에서 직접 읽어 온다 —
 * 여기 손으로 적으면 구현을 바꾸는 날 문서만 거짓말을 하게 된다.
 *
 * 순서: 도구 점수가 먼저다. 방향을 바꾼 뒤에도 이 페이지는 모델 점수 설명만
 * 있어서, 도구 카드의 "자세히"를 따라온 사람이 자기가 본 점수의 설명을
 * 못 찾았다. 모델 점수는 아래로 내려 "개발자용"으로 묶는다.
 * ------------------------------------------------------------------------- */
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
  TOOL_AXES,
  TOOL_AXIS_WEIGHT,
  TOOL_CONFIDENCE_M,
  TOOL_MIN_REVIEWS_FOR_TIER,
} from "@/lib/scoring/constants";
import { CATEGORY_LABEL, TOOL_AXIS_LABEL, TOOL_AXIS_QUESTION } from "@/lib/labels";
import { shareMeta } from "@/lib/site";

export const metadata: Metadata = {
  // 레이아웃 템플릿이 " | Tiera"를 붙인다. 여기서 또 붙이면 "Tiera | Tiera"가 된다.
  title: "점수 매기는 방식",
  description: "Tiera가 도구 후기와 모델 점수를 어떻게 계산하는지 적어 뒀어요.",
  alternates: { canonical: "/about" },
  ...shareMeta({
    url: "/about",
    title: "점수 매기는 방식 — Tiera",
    description: "Tiera가 도구 후기와 모델 점수를 어떻게 계산하는지 적어 뒀어요.",
  }),
};

export default function AboutPage() {
  // 도구 4축 가중치가 전부 같은지. 같으면 "똑같이 반영해요"라고 말하고,
  // 누가 나중에 가중치를 바꾸면 그 숫자를 그대로 보여준다.
  const weights = TOOL_AXES.map((a) => TOOL_AXIS_WEIGHT[a]);
  const equalWeights = weights.every((w) => w === weights[0]);

  return (
    <article className="space-y-10 py-8 text-sm leading-relaxed text-[var(--color-text-dim)]">
      <header className="space-y-2">
        <Link href="/" className="text-xs text-[var(--color-text-mute)] hover:underline">
          ← 도구 목록
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">점수는 이렇게 매겨요</h1>
        <p>
          Tiera의 점수는 두 가지예요.{" "}
          <strong className="text-[var(--color-text)]">도구 점수</strong>는 실제로 써본 사람들이
          남긴 후기로 매기고, <strong className="text-[var(--color-text)]">모델 점수</strong>는
          벤치마크와 커뮤니티 평가를 나란히 놓고 봐요. 도구 목록에서 보시는 건 앞쪽이에요.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">도구 점수</h2>
        <p>후기를 남길 때 네 가지를 각각 1~5점으로 매겨요. 안 써본 항목은 건너뛰어도 돼요.</p>
        <dl className="grid gap-2 sm:grid-cols-2">
          {TOOL_AXES.map((a) => (
            <div
              key={a}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3"
            >
              <dt className="text-xs font-semibold text-[var(--color-text)]">{TOOL_AXIS_LABEL[a]}</dt>
              <dd className="mt-0.5 text-xs text-[var(--color-text-mute)]">{TOOL_AXIS_QUESTION[a]}</dd>
            </div>
          ))}
        </dl>
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>항목별 평균을 100점으로 바꿔요 (1점 = 20점, 5점 = 100점).</li>
          <li>
            후기가 적은 도구는 점수를 전체 평균 쪽으로 조금 당겨요 —{" "}
            <code className="rounded bg-[var(--color-surface-2)] px-1 text-xs">
              S = (v·R + {TOOL_CONFIDENCE_M}·C) / (v + {TOOL_CONFIDENCE_M})
            </code>
            . 한두 명이 5점을 줬다고 바로 1등이 되지 않게 하려는 거예요.
          </li>
          <li>
            {equalWeights
              ? "네 항목을 똑같은 비중으로 합쳐 종합 점수를 내요. 쉬운 게 중요한 사람도, 한국어가 중요한 사람도 있어서 어느 쪽에 더 무게를 두지 않았어요."
              : `네 항목을 이 비중으로 합쳐 종합 점수를 내요 — ${TOOL_AXES.map((a) => `${TOOL_AXIS_LABEL[a]} ${TOOL_AXIS_WEIGHT[a]}`).join(" · ")}`}{" "}
            건너뛴 항목은 계산에서 통째로 빠져서, 한국어를 안 써본 사람이 많다고 종합이 깎이지는 않아요.
          </li>
        </ol>
        <p className="text-xs text-[var(--color-text-mute)]">
          후기가 <strong>{TOOL_MIN_REVIEWS_FOR_TIER}개</strong> 쌓이기 전에는 티어와 종합 점수를
          카드에 띄우지 않아요. 후기 한두 개로는 &ldquo;이 도구는 골드&rdquo;가 아니라 &ldquo;한
          사람이 그렇게 말했다&rdquo;에 가깝기 때문이에요.
        </p>
      </section>

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
          도구와 모델 모두 같은 컷을 써요. 상위 몇 %를 잘라 주는 방식이 아니라 점수 기준이라서,
          전반적으로 좋아지면 프리즘이 늘어나요.
        </p>
      </section>

      <div className="border-t border-[var(--color-line-soft)] pt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-mute)]">
          모델 점수 — 개발자용
        </p>
        <p className="mt-2 text-xs text-[var(--color-text-mute)]">
          <Link href="/models" className="underline hover:text-[var(--color-text-dim)]">
            모델 순위
          </Link>
          에서 쓰는 점수예요. 도구를 고르는 데는 몰라도 괜찮아요.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">커뮤니티 점수</h2>
        <p>
          카테고리마다 5점 척도로 평가해요. 안 써본 카테고리는 건너뛸 수 있고, 건너뛴 항목은
          계산에서 통째로 빠져요.
        </p>
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>카테고리별 평균을 100점으로 바꿔요 (1점 = 20점, 5점 = 100점).</li>
          <li>
            평가 수가 적은 모델은 전체 평균 쪽으로 당겨요 —{" "}
            <code className="rounded bg-[var(--color-surface-2)] px-1 text-xs">
              S = (v·R + {CONFIDENCE_M}·C) / (v + {CONFIDENCE_M})
            </code>
            . 리뷰 세 개짜리 신규 모델이 평균 5.0으로 1위를 차지하는 일을 막으려는 거예요.
          </li>
          <li>
            카테고리 점수를 가중 평균해 종합을 내요 —{" "}
            {Object.entries(CATEGORY_WEIGHT)
              .map(([c, w]) => `${CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL]} ${w}`)
              .join(" · ")}
          </li>
        </ol>
        <p className="text-xs text-[var(--color-text-mute)]">
          리뷰가 {CONFIDENCE_M}개 미만이면 <strong>평가 중</strong>으로 표시하고 점수 링을 점선으로
          그려요. 점수가 아직 크게 움직일 수 있다는 뜻이에요.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">벤치마크 점수</h2>
        <p>
          MMLU(%)와 LMArena(Elo)처럼 단위가 전혀 다른 지표를 한 축에 올리려고, 벤치마크마다 등록된
          모델 안에서 {BENCH_FLOOR}~100으로 정규화한 다음 가중 평균해요. 결과가{" "}
          {MIN_MODELS_FOR_NORMALIZATION}개 모델 미만인 벤치마크는 뺐어요.
        </p>
        <p className="text-xs text-[var(--color-text-mute)]">
          바닥을 0이 아니라 {BENCH_FLOOR}으로 둔 건, 5점 척도를 바꾼 커뮤니티 점수의 바닥이
          20점이라서예요. 두 점수를 나란히 놓고 보는 곳이라 축의 바닥을 맞췄어요.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">괴리 배지</h2>
        <p>
          두 점수의 <strong className="text-[var(--color-text)]">순위</strong>가{" "}
          {GAP_RANK_THRESHOLD}계단 이상 벌어지면 배지를 붙여요.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong className="text-sky-300">체감 우위</strong> — 벤치마크 순위보다 커뮤니티 평가가 높은 모델</li>
          <li><strong className="text-fuchsia-300">스펙 우위</strong> — 벤치마크 순위는 높은데 체감 평가는 아쉬운 모델</li>
        </ul>
        <p className="text-xs text-[var(--color-text-mute)]">
          점수 차가 아니라 순위 차로 봐요. 벤치마크 점수는 정규화한 값이라 사실상 상대 순위이고,
          커뮤니티 점수는 절대 평점이에요. 둘을 그냥 빼면 &ldquo;평가가 엇갈렸다&rdquo;가 아니라
          &ldquo;두 척도의 분포가 다르다&rdquo;를 재게 돼요.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">데이터 출처</h2>
        <p>
          벤치마크 점수는{" "}
          <a
            className="underline hover:text-[var(--color-text)]"
            href="https://artificialanalysis.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            Artificial Analysis
          </a>
          의 공개 데이터를 하루 한 번 받아와요. 모델 상세 페이지의 벤치마크 표에서 지표별 원점수와
          출처 링크를 볼 수 있어요.
        </p>
        <p className="text-xs text-[var(--color-text-mute)]">
          이 데이터에 없는 항목(글쓰기·멀티모달)은 <strong>비워 둬요.</strong> 없는 값을 0으로
          채우면 &ldquo;진짜 0점&rdquo;과 구분이 안 되니까요. 그 카테고리는 종합 점수 계산에서도
          빠져요.
        </p>
        <p className="text-xs text-[var(--color-text-mute)]">
          싣는 범위는 개발사 국적 기준 미국·중국·한국이에요. 어떤 개발사를 실을지는 저희가 고르고,
          숫자는 위 출처에서 그대로 가져와요.
        </p>
        <p className="text-xs text-[var(--color-text-mute)]">
          출처는 같은 모델을 추론 강도별로 나눠 실어요(Max / High / Medium / Low). Tiera는 이걸{" "}
          <strong>모델 하나로 묶고 가장 높은 설정의 값</strong>을 써요 — 그 모델이 낼 수 있는
          성능을 보는 게 목적이라서요. 같은 모델이 설정만 바꿔 순위를 여러 칸 차지하는 것도 막아요.
        </p>
      </section>

      <p className="text-xs text-[var(--color-text-mute)]">
        점수는 고르는 데 참고하시라고 매긴 거예요. 마음에 드는 게 보이면 직접 한 번 써보시는 게
        제일 정확해요.
      </p>
    </article>
  );
}
/* Footer: app/about/page.tsx */
