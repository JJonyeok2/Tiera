/* ---------------------------------------------------------------------------
 * Header: 순수 점수 계산 함수들 — SPEC 5절
 *
 * 여기 있는 함수는 전부 순수 함수다. DB도, 네트워크도 모른다.
 * 그래서 단위 테스트로 전부 검증할 수 있고, 실제로 그렇게 하고 있다.
 * (tests/scoring.test.ts)
 * ------------------------------------------------------------------------- */

import type { Category, TierName } from "@/db/schema";
import {
  BENCH_FLOOR,
  CATEGORY_WEIGHT,
  CONFIDENCE_M,
  GAP_RANK_THRESHOLD,
  MIN_MODELS_FOR_NORMALIZATION,
  RATING_MAX,
} from "./constants";

// --- 커뮤니티 점수 ---------------------------------------------------------

/** 5점 척도 평균 → 100점 환산. 1점=20, 5점=100. */
export function toHundred(avgRating: number): number {
  return (avgRating / RATING_MAX) * 100;
}

/**
 * 베이지안 보정.
 *   S = (v·R + m·C) / (v + m)
 * v가 커질수록 실제 평균 R에 수렴하고, v가 작으면 전체 평균 C 쪽으로 끌려간다.
 *
 * @param raw          이 모델의 100점 환산 평균 (R)
 * @param sampleCount  평가 수 (v)
 * @param globalMean   전체 모델의 100점 환산 평균 (C)
 */
export function bayesian(raw: number, sampleCount: number, globalMean: number, m = CONFIDENCE_M): number {
  if (sampleCount <= 0) return globalMean;
  return (sampleCount * raw + m * globalMean) / (sampleCount + m);
}

/**
 * 카테고리 점수들 → 종합 점수.
 * 평가가 없는 카테고리(undefined)는 가중치에서 통째로 빠진다.
 * "멀티모달을 안 써본 사람이 많다"는 이유로 종합이 깎이면 안 되기 때문이다.
 */
export function overallFrom(scores: Partial<Record<Category, number>>): number | null {
  let num = 0;
  let den = 0;
  for (const [cat, w] of Object.entries(CATEGORY_WEIGHT) as [Category, number][]) {
    const s = scores[cat];
    if (s === undefined || Number.isNaN(s)) continue;
    num += w * s;
    den += w;
  }
  return den === 0 ? null : num / den;
}

// --- 벤치마크 점수 ---------------------------------------------------------

export interface NormalizationInput {
  /** 이 벤치마크의 모든 모델 값 */
  values: number[];
  higherIsBetter: boolean;
}

/**
 * 벤치마크 값 → BENCH_FLOOR~100 정규화.
 * MMLU(%)와 LMArena(Elo)처럼 스케일이 전혀 다른 지표를 한 축에 올리기 위한 것이다.
 * 커뮤니티 점수와 같은 밴드(20~100)에 맞춘 이유는 constants.ts의 BENCH_FLOOR 참고.
 *
 * 표본이 MIN_MODELS_FOR_NORMALIZATION 미만이거나 모든 값이 같으면 null을 반환한다.
 * (min===max면 0으로 나누게 되고, 표본 2개짜리 정규화는 바닥 아니면 천장이라 무의미하다.)
 */
export function normalize(value: number, { values, higherIsBetter }: NormalizationInput): number | null {
  return normalizeWithRange(value, {
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
    higherIsBetter,
  });
}

export interface RangeInput {
  min: number;
  max: number;
  count: number;
  higherIsBetter: boolean;
}

/**
 * normalize()와 같은 계산이지만 값 배열 대신 min/max/개수만 받는다.
 * SQL에서 이미 집계(MIN/MAX/COUNT)해 온 경우 전체 값을 다시 실어 나를 이유가 없다.
 */
export function normalizeWithRange(
  value: number,
  { min, max, count, higherIsBetter }: RangeInput
): number | null {
  if (count < MIN_MODELS_FOR_NORMALIZATION) return null;
  if (max === min) return null;
  const t = (value - min) / (max - min);
  const unit = higherIsBetter ? t : 1 - t;
  return BENCH_FLOOR + unit * (100 - BENCH_FLOOR);
}

export interface WeightedValue {
  value: number;
  weight: number;
}

/** 가중 평균. 입력이 비면 null. */
export function weightedMean(items: WeightedValue[]): number | null {
  let num = 0;
  let den = 0;
  for (const { value, weight } of items) {
    if (Number.isNaN(value) || weight <= 0) continue;
    num += value * weight;
    den += weight;
  }
  return den === 0 ? null : num / den;
}

// --- 티어 -----------------------------------------------------------------

/** 점수 → DB enum 티어. 컷은 SPEC 4절. */
export function tierOf(score: number): TierName {
  if (score >= 90) return "PRISM";
  if (score >= 80) return "GOLD";
  if (score >= 65) return "SILVER";
  return "BRONZE";
}

// --- 괴리 배지 -------------------------------------------------------------

export type GapVerdict = "FEEL_BETTER" | "SPEC_BETTER" | "ALIGNED";

export interface Gap {
  verdict: GapVerdict;
  /** 벤치마크 순위 - 커뮤니티 순위. 양수면 커뮤니티에서 더 높이 평가받았다는 뜻. */
  rankDiff: number;
  communityRank: number;
  benchmarkRank: number;
  /** 참고용 점수 차이. 판정에는 쓰지 않는다. */
  scoreDiff: number | null;
}

/**
 * Tiera의 시그니처.
 * 벤치마크는 높은데 실제로 써보면 별로인 모델을 드러내는 것이 이 서비스의 존재 이유다.
 *
 * 판정은 순위 차이로 한다 (constants.ts의 GAP_RANK_THRESHOLD 참고).
 * 한쪽 순위가 없으면 비교 자체가 성립하지 않으므로 null.
 */
export function gapOf(
  communityRank: number | null,
  benchmarkRank: number | null,
  scoreDiff: number | null = null
): Gap | null {
  if (communityRank === null || benchmarkRank === null) return null;
  const rankDiff = benchmarkRank - communityRank;
  const base = { rankDiff, communityRank, benchmarkRank, scoreDiff };
  if (rankDiff >= GAP_RANK_THRESHOLD) return { ...base, verdict: "FEEL_BETTER" };
  if (rankDiff <= -GAP_RANK_THRESHOLD) return { ...base, verdict: "SPEC_BETTER" };
  return { ...base, verdict: "ALIGNED" };
}

export const GAP_LABEL: Record<GapVerdict, { label: string; desc: string }> = {
  FEEL_BETTER: { label: "체감 우위", desc: "벤치마크 순위보다 커뮤니티 평가가 높은 모델" },
  SPEC_BETTER: { label: "스펙 우위", desc: "벤치마크 순위는 높지만 체감 평가는 아쉬운 모델" },
  ALIGNED: { label: "일치", desc: "벤치마크 순위와 커뮤니티 순위가 비슷한 모델" },
};

export const round1 = (n: number) => Math.round(n * 10) / 10;
/* Footer: lib/scoring/score.ts */
