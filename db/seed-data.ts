/* ---------------------------------------------------------------------------
 * Header: 시드 데이터셋
 *
 * ⚠️ 여기 있는 벤치마크 수치는 UI와 스코어링을 검증하기 위한 **예시 값**이다.
 *    실제 측정치가 아니며, 런칭 전에 반드시 공개 리더보드의 실측치로 교체해야 한다.
 *    그래서 sourceName을 "시드 데이터(예시)"로 박아 두었다 —
 *    가짜 숫자에 진짜 출처 링크를 달아 실측치처럼 보이게 만들지 않기 위해서다.
 *
 * 모델 목록과 스펙(출시일/컨텍스트/가격/모달리티/오픈웨이트)은 2026년 9월 기준
 * 각 개발사 공식 문서와 공개 자료를 확인해 채웠다. 확인하지 못한 항목은
 * 지어내지 않고 null로 두었다 — UI에서 "–"로 표시된다.
 * 수록 범위: 개발사 국적 기준 미국·중국·한국. SPEC 13절 #7.
 * ------------------------------------------------------------------------- */

import type { BenchmarkDefinition, RawBenchmarkResult } from "@/lib/data-sources/types";
import type { Category, Country } from "@/db/schema";

export const SEED_SOURCE_NAME = "시드 데이터(예시)";

export interface SeedDeveloper {
  slug: string;
  name: string;
  country: Country;
  siteUrl: string;
}

export const DEVELOPERS: SeedDeveloper[] = [
  { slug: "anthropic", name: "Anthropic", country: "US", siteUrl: "https://www.anthropic.com" },
  { slug: "openai", name: "OpenAI", country: "US", siteUrl: "https://openai.com" },
  { slug: "google", name: "Google", country: "US", siteUrl: "https://deepmind.google" },
  { slug: "spacexai", name: "SpaceXAI", country: "US", siteUrl: "https://x.ai" },
  { slug: "meta", name: "Meta", country: "US", siteUrl: "https://ai.meta.com" },
  { slug: "deepseek", name: "DeepSeek", country: "CN", siteUrl: "https://www.deepseek.com" },
  { slug: "moonshot", name: "Moonshot AI", country: "CN", siteUrl: "https://www.moonshot.cn" },
  { slug: "alibaba", name: "Alibaba", country: "CN", siteUrl: "https://qwen.ai" },
  { slug: "zai", name: "Z.ai", country: "CN", siteUrl: "https://z.ai" },
  { slug: "upstage", name: "Upstage", country: "KR", siteUrl: "https://www.upstage.ai" },
  { slug: "lg-ai", name: "LG AI Research", country: "KR", siteUrl: "https://www.lgresearch.ai" },
  { slug: "naver", name: "Naver Cloud", country: "KR", siteUrl: "https://clova.ai" },
];

export interface SeedModel {
  slug: string;
  name: string;
  developerSlug: string;
  description: string;
  releasedAt: string;
  /** 확인하지 못한 값은 지어내지 않고 null로 둔다. UI에서 "–"로 표시된다. */
  contextWindow: number | null;
  inputPricePerM: string | null;
  outputPricePerM: string | null;
  modalities: ("TEXT" | "IMAGE" | "AUDIO" | "VIDEO")[];
  isOpenWeight: boolean;
}

export const MODELS: SeedModel[] = [
  // --- 미국 ---
  { slug: "claude-fable-5-1", name: "Claude Fable 5.1", developerSlug: "anthropic", description: "긴 호흡의 추론과 에이전트 작업을 겨냥한 최상위 모델.", releasedAt: "2026-09-01", contextWindow: 1000000, inputPricePerM: "10.0000", outputPricePerM: "50.0000", modalities: ["TEXT", "IMAGE"], isOpenWeight: false },
  { slug: "claude-opus-5", name: "Claude Opus 5", developerSlug: "anthropic", description: "복잡한 에이전트 코딩과 기업용 작업에 쓰는 모델.", releasedAt: "2026-05-01", contextWindow: 1000000, inputPricePerM: "5.0000", outputPricePerM: "25.0000", modalities: ["TEXT", "IMAGE"], isOpenWeight: false },
  { slug: "claude-sonnet-5", name: "Claude Sonnet 5", developerSlug: "anthropic", description: "속도와 지능의 균형을 노린 범용 모델.", releasedAt: "2026-01-15", contextWindow: 1000000, inputPricePerM: "2.0000", outputPricePerM: "10.0000", modalities: ["TEXT", "IMAGE"], isOpenWeight: false },
  { slug: "claude-haiku-4-5", name: "Claude Haiku 4.5", developerSlug: "anthropic", description: "저지연 경량 모델.", releasedAt: "2025-10-01", contextWindow: 200000, inputPricePerM: "1.0000", outputPricePerM: "5.0000", modalities: ["TEXT", "IMAGE"], isOpenWeight: false },
  { slug: "gpt-6-astra", name: "GPT-6 Astra", developerSlug: "openai", description: "OpenAI의 플래그십 모델.", releasedAt: "2026-09-03", contextWindow: 1050000, inputPricePerM: "10.0000", outputPricePerM: "50.0000", modalities: ["TEXT", "IMAGE", "AUDIO"], isOpenWeight: false },
  { slug: "gpt-5-6-sol", name: "GPT-5.6 Sol", developerSlug: "openai", description: "직전 세대의 상위 범용 모델.", releasedAt: "2026-07-09", contextWindow: 1050000, inputPricePerM: "4.0000", outputPricePerM: "20.0000", modalities: ["TEXT", "IMAGE", "AUDIO"], isOpenWeight: false },
  { slug: "gpt-5-6-terra", name: "GPT-5.6 Terra", developerSlug: "openai", description: "비용을 낮춘 중간 등급 모델.", releasedAt: "2026-07-09", contextWindow: 1050000, inputPricePerM: "2.0000", outputPricePerM: "12.0000", modalities: ["TEXT", "IMAGE"], isOpenWeight: false },
  { slug: "gpt-5-6-luna", name: "GPT-5.6 Luna", developerSlug: "openai", description: "대량 처리용 초저가 경량 모델.", releasedAt: "2026-07-09", contextWindow: 1050000, inputPricePerM: "0.2000", outputPricePerM: "1.2000", modalities: ["TEXT", "IMAGE"], isOpenWeight: false },
  { slug: "gemini-3-1-pro", name: "Gemini 3.1 Pro", developerSlug: "google", description: "Gemini 계열의 상위 추론 모델.", releasedAt: "2026-06-01", contextWindow: 1000000, inputPricePerM: "2.0000", outputPricePerM: "12.0000", modalities: ["TEXT", "IMAGE", "AUDIO", "VIDEO"], isOpenWeight: false },
  { slug: "gemini-3-8-flash", name: "Gemini 3.8 Flash", developerSlug: "google", description: "장기 소프트웨어 작업을 겨냥한 Flash 계열 최상위.", releasedAt: "2026-09-02", contextWindow: 1000000, inputPricePerM: "0.7500", outputPricePerM: "3.7500", modalities: ["TEXT", "IMAGE", "AUDIO", "VIDEO"], isOpenWeight: false },
  { slug: "grok-4-6", name: "Grok 4.6", developerSlug: "spacexai", description: "실시간 정보 연동을 강조한 모델.", releasedAt: "2026-08-12", contextWindow: 500000, inputPricePerM: "2.0000", outputPricePerM: "6.0000", modalities: ["TEXT", "IMAGE"], isOpenWeight: false },
  { slug: "muse-spark-1-3", name: "Muse Spark 1.3", developerSlug: "meta", description: "Meta의 최신 범용 모델.", releasedAt: "2026-09-02", contextWindow: 1000000, inputPricePerM: "1.2500", outputPricePerM: "4.2500", modalities: ["TEXT", "IMAGE"], isOpenWeight: false },

  // --- 중국 ---
  { slug: "deepseek-v4-pro", name: "DeepSeek-V4-Pro", developerSlug: "deepseek", description: "MIT 라이선스로 공개된 대형 오픈 웨이트 모델.", releasedAt: "2026-08-13", contextWindow: 1000000, inputPricePerM: "0.6600", outputPricePerM: "1.9800", modalities: ["TEXT"], isOpenWeight: true },
  { slug: "kimi-k3", name: "Kimi K3", developerSlug: "moonshot", description: "에이전트 작업에 초점을 둔 대형 오픈 웨이트 MoE.", releasedAt: "2026-07-27", contextWindow: 256000, inputPricePerM: "3.0000", outputPricePerM: "15.0000", modalities: ["TEXT"], isOpenWeight: true },
  { slug: "qwen3-8-max", name: "Qwen3.8-Max", developerSlug: "alibaba", description: "Qwen 계열의 상위 폐쇄형 모델.", releasedAt: "2026-08-03", contextWindow: 1000000, inputPricePerM: "2.0000", outputPricePerM: "6.0000", modalities: ["TEXT", "IMAGE"], isOpenWeight: false },
  { slug: "glm-5-3", name: "GLM-5.3", developerSlug: "zai", description: "코딩 에이전트에 강점을 둔 오픈 웨이트 모델.", releasedAt: "2026-08-14", contextWindow: 200000, inputPricePerM: null, outputPricePerM: null, modalities: ["TEXT"], isOpenWeight: true },

  // --- 한국 ---
  { slug: "solar-pro-4", name: "Solar Pro 4", developerSlug: "upstage", description: "에이전트 작업의 신뢰성과 가격 대비 성능을 노린 한국어 특화 모델.", releasedAt: "2026-08-12", contextWindow: 384000, inputPricePerM: "0.3000", outputPricePerM: "1.2000", modalities: ["TEXT"], isOpenWeight: false },
  { slug: "k-exaone-2-0", name: "K-EXAONE 2.0", developerSlug: "lg-ai", description: "국가 독자 AI 파운데이션 모델 사업으로 개발된 750B(활성 37B) MoE 오픈 웨이트 모델. Apache-2.0.", releasedAt: "2026-07-31", contextWindow: 262144, inputPricePerM: null, outputPricePerM: null, modalities: ["TEXT"], isOpenWeight: true },
  { slug: "hyperclova-x-seed-think", name: "HyperCLOVA X SEED Think", developerSlug: "naver", description: "네이버가 오픈 웨이트로 공개한 32B 추론 특화 한국어 모델.", releasedAt: "2026-08-20", contextWindow: 128000, inputPricePerM: null, outputPricePerM: null, modalities: ["TEXT"], isOpenWeight: true },
];

export const BENCHMARKS: BenchmarkDefinition[] = [
  { slug: "swe-bench-verified", name: "SWE-bench Verified", category: "CODING", unit: "%", higherIsBetter: true, weight: 1.2, sourceName: SEED_SOURCE_NAME, sourceUrl: "https://www.swebench.com" },
  { slug: "livecodebench", name: "LiveCodeBench", category: "CODING", unit: "%", higherIsBetter: true, weight: 1.0, sourceName: SEED_SOURCE_NAME, sourceUrl: "https://livecodebench.github.io" },
  { slug: "gpqa-diamond", name: "GPQA Diamond", category: "REASONING", unit: "%", higherIsBetter: true, weight: 1.1, sourceName: SEED_SOURCE_NAME, sourceUrl: "https://github.com/idavidrein/gpqa" },
  { slug: "mmlu-pro", name: "MMLU-Pro", category: "REASONING", unit: "%", higherIsBetter: true, weight: 1.0, sourceName: SEED_SOURCE_NAME, sourceUrl: "https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro" },
  { slug: "creative-writing", name: "Creative Writing v3", category: "WRITING", unit: "점", higherIsBetter: true, weight: 1.0, sourceName: SEED_SOURCE_NAME, sourceUrl: "https://eqbench.com" },
  { slug: "mmmu", name: "MMMU", category: "MULTIMODAL", unit: "%", higherIsBetter: true, weight: 1.0, sourceName: SEED_SOURCE_NAME, sourceUrl: "https://mmmu-benchmark.github.io" },
  { slug: "arena-elo", name: "LMArena Elo", category: null, unit: "Elo", higherIsBetter: true, weight: 1.3, sourceName: SEED_SOURCE_NAME, sourceUrl: "https://lmarena.ai" },
];

/** [modelSlug]: { benchmarkSlug: value } — 예시 값. 실측치 아님. */
const RAW: Record<string, Partial<Record<string, number>>> = {
  // 미국
  "claude-fable-5-1":         { "swe-bench-verified": 84.1, livecodebench: 82.6, "gpqa-diamond": 91.2, "mmlu-pro": 91.8, "creative-writing": 88.0, mmmu: 85.1, "arena-elo": 1512 },
  "claude-opus-5":            { "swe-bench-verified": 81.7, livecodebench: 79.8, "gpqa-diamond": 88.4, "mmlu-pro": 90.1, "creative-writing": 86.5, mmmu: 82.7, "arena-elo": 1494 },
  "claude-sonnet-5":          { "swe-bench-verified": 78.9, livecodebench: 76.2, "gpqa-diamond": 85.0, "mmlu-pro": 88.3, "creative-writing": 84.0, mmmu: 79.5, "arena-elo": 1471 },
  "claude-haiku-4-5":         { "swe-bench-verified": 58.2, livecodebench: 60.4, "gpqa-diamond": 68.9, "mmlu-pro": 77.6, "creative-writing": 71.0, mmmu: 68.2, "arena-elo": 1368 },
  "gpt-6-astra":              { "swe-bench-verified": 83.4, livecodebench: 85.1, "gpqa-diamond": 92.0, "mmlu-pro": 91.5, "creative-writing": 84.5, mmmu: 89.3, "arena-elo": 1518 },
  "gpt-5-6-sol":              { "swe-bench-verified": 79.5, livecodebench: 81.7, "gpqa-diamond": 88.9, "mmlu-pro": 89.4, "creative-writing": 81.0, mmmu: 86.0, "arena-elo": 1489 },
  "gpt-5-6-terra":            { "swe-bench-verified": 71.2, livecodebench: 74.5, "gpqa-diamond": 81.3, "mmlu-pro": 85.0, "creative-writing": 76.5, mmmu: 80.4, "arena-elo": 1441 },
  "gpt-5-6-luna":             { "swe-bench-verified": 52.8, livecodebench: 58.9, "gpqa-diamond": 64.2, "mmlu-pro": 74.1, "creative-writing": 68.0, mmmu: 66.7, "arena-elo": 1339 },
  "gemini-3-1-pro":           { "swe-bench-verified": 77.3, livecodebench: 80.2, "gpqa-diamond": 90.4, "mmlu-pro": 90.2, "creative-writing": 79.5, mmmu: 88.1, "arena-elo": 1503 },
  "gemini-3-8-flash":         { "swe-bench-verified": 74.6, livecodebench: 78.4, "gpqa-diamond": 84.7, "mmlu-pro": 87.0, "creative-writing": 75.0, mmmu: 84.6, "arena-elo": 1466 },
  "grok-4-6":                 { "swe-bench-verified": 76.0, livecodebench: 83.2, "gpqa-diamond": 90.8, "mmlu-pro": 89.1, "creative-writing": 73.0, mmmu: 79.8, "arena-elo": 1476 },
  "muse-spark-1-3":           { "swe-bench-verified": 62.4, livecodebench: 66.8, "gpqa-diamond": 78.5, "mmlu-pro": 84.2, "creative-writing": 72.0, mmmu: 78.9, "arena-elo": 1418 },
  // 중국
  "deepseek-v4-pro":          { "swe-bench-verified": 75.8, livecodebench: 80.9, "gpqa-diamond": 86.2, "mmlu-pro": 88.0, "creative-writing": 76.5, "arena-elo": 1470 },
  "kimi-k3":                  { "swe-bench-verified": 74.1, livecodebench: 78.0, "gpqa-diamond": 82.6, "mmlu-pro": 86.4, "creative-writing": 79.0, "arena-elo": 1458 },
  "qwen3-8-max":              { "swe-bench-verified": 73.2, livecodebench: 79.1, "gpqa-diamond": 85.4, "mmlu-pro": 87.2, "creative-writing": 75.5, mmmu: 81.3, "arena-elo": 1462 },
  "glm-5-3":                  { "swe-bench-verified": 74.9, livecodebench: 77.3, "gpqa-diamond": 80.1, "mmlu-pro": 84.9, "creative-writing": 73.5, "arena-elo": 1447 },
  // 한국
  "solar-pro-4":              { "swe-bench-verified": 49.3, livecodebench: 55.8, "gpqa-diamond": 64.0, "mmlu-pro": 76.2, "creative-writing": 72.5, "arena-elo": 1332 },
  "k-exaone-2-0":             { "swe-bench-verified": 54.6, livecodebench: 62.1, "gpqa-diamond": 70.3, "mmlu-pro": 80.4, "creative-writing": 71.0, "arena-elo": 1361 },
  "hyperclova-x-seed-think":  { "swe-bench-verified": 44.8, livecodebench: 51.2, "gpqa-diamond": 66.5, "mmlu-pro": 75.0, "creative-writing": 70.5, "arena-elo": 1318 },
};

export function seedBenchmarkResults(): RawBenchmarkResult[] {
  const measuredAt = new Date("2026-08-01");
  const out: RawBenchmarkResult[] = [];
  for (const [modelSlug, entries] of Object.entries(RAW)) {
    for (const [benchmarkSlug, value] of Object.entries(entries)) {
      if (value === undefined) continue;
      out.push({ modelSlug, benchmarkSlug, value, measuredAt });
    }
  }
  return out;
}

/**
 * 개발용 더미 리뷰의 성향.
 * 모델마다 "커뮤니티가 느끼는 인상"을 벤치마크와 일부러 어긋나게 잡아뒀다 —
 * 괴리 배지(체감 우위 / 스펙 우위)가 실제로 작동하는지 눈으로 보기 위해서다.
 *  bias: 카테고리별 5점 척도 기대 평균 / n: 생성할 리뷰 수
 */
export const REVIEW_PROFILES: Record<
  string,
  { n: number; bias: Partial<Record<Category, number>> }
> = {
  "claude-fable-5-1":        { n: 88,  bias: { CODING: 4.7, WRITING: 4.7, REASONING: 4.6, MULTIMODAL: 4.2 } },
  "claude-opus-5":           { n: 240, bias: { CODING: 4.6, WRITING: 4.5, REASONING: 4.5, MULTIMODAL: 4.1 } },
  "claude-sonnet-5":         { n: 410, bias: { CODING: 4.6, WRITING: 4.4, REASONING: 4.4, MULTIMODAL: 4.0 } },
  "claude-haiku-4-5":        { n: 130, bias: { CODING: 3.9, WRITING: 3.8, REASONING: 3.7, MULTIMODAL: 3.6 } },
  "gpt-6-astra":             { n: 195, bias: { CODING: 4.5, WRITING: 4.4, REASONING: 4.7, MULTIMODAL: 4.6 } },
  "gpt-5-6-sol":             { n: 320, bias: { CODING: 4.3, WRITING: 4.3, REASONING: 4.5, MULTIMODAL: 4.4 } },
  "gpt-5-6-terra":           { n: 150, bias: { CODING: 4.0, WRITING: 4.1, REASONING: 4.1, MULTIMODAL: 4.0 } },
  "gpt-5-6-luna":            { n: 112, bias: { CODING: 3.7, WRITING: 3.8, REASONING: 3.6, MULTIMODAL: 3.6 } },
  "gemini-3-1-pro":          { n: 205, bias: { CODING: 4.0, WRITING: 4.0, REASONING: 4.4, MULTIMODAL: 4.7 } },
  "gemini-3-8-flash":        { n: 168, bias: { CODING: 4.2, WRITING: 3.9, REASONING: 4.1, MULTIMODAL: 4.4 } },
  // 스펙 우위 표본: 벤치마크는 최상위권인데 체감 평이 낮다
  "grok-4-6":                { n: 96,  bias: { CODING: 3.8, WRITING: 3.3, REASONING: 4.0, MULTIMODAL: 3.6 } },
  "muse-spark-1-3":          { n: 44,  bias: { CODING: 3.4, WRITING: 3.7, REASONING: 3.6, MULTIMODAL: 3.7 } },
  // 체감 우위 표본: 벤치마크 대비 실사용 만족도가 높다
  "deepseek-v4-pro":         { n: 260, bias: { CODING: 4.6, WRITING: 4.2, REASONING: 4.4 } },
  "kimi-k3":                 { n: 118, bias: { CODING: 4.5, WRITING: 4.4, REASONING: 4.2 } },
  "qwen3-8-max":             { n: 140, bias: { CODING: 4.1, WRITING: 4.0, REASONING: 4.2, MULTIMODAL: 4.0 } },
  "glm-5-3":                 { n: 26,  bias: { CODING: 4.5, WRITING: 4.0, REASONING: 4.1 } }, // 평가 중 표본
  "solar-pro-4":             { n: 72,  bias: { CODING: 3.6, WRITING: 4.2, REASONING: 3.7 } },
  "k-exaone-2-0":            { n: 58,  bias: { CODING: 3.6, WRITING: 4.1, REASONING: 3.9 } },
  "hyperclova-x-seed-think": { n: 47,  bias: { CODING: 3.2, WRITING: 4.0, REASONING: 3.6 } },
};
/* Footer: db/seed-data.ts */
