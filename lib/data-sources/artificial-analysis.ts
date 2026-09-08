/* ---------------------------------------------------------------------------
 * Header: Artificial Analysis 데이터 소스
 *
 * 무료 티어 기준 하루 1,000회. x-api-key 헤더로 인증한다.
 * 이용 약관상 **artificialanalysis.ai 출처 표기가 필수**이므로,
 * 모든 벤치마크 정의에 sourceName/sourceUrl을 박아 화면에 노출한다.
 *
 * 카테고리 매핑에 관한 솔직한 한계:
 *   CODING / REASONING 은 실측 지표가 있다.
 *   WRITING / MULTIMODAL 은 이 API가 주지 않는다 → 그냥 비운다.
 *   스코어링은 값이 없는 카테고리를 가중치에서 통째로 빼므로(SPEC 5.1),
 *   없는 항목을 0으로 채우거나 추정하지 않는다. 없는 건 없는 채로 둔다.
 *
 * 문서: https://artificialanalysis.ai/api-reference
 * ------------------------------------------------------------------------- */

import type { BenchmarkDefinition, BenchmarkSource, RawBenchmarkResult } from "./types";
import { lookupCreator, type CuratedCreator } from "./creator-country";

const API_BASE = "https://artificialanalysis.ai/api/v2";
export const SOURCE_NAME = "Artificial Analysis";
export const SOURCE_URL = "https://artificialanalysis.ai";

/** 응답에서 우리가 쓰는 부분만 좁게 선언한다. 나머지 필드는 무시. */
interface AAModel {
  id: string;
  name: string;
  slug: string;
  model_creator?: { id?: string; name?: string; slug?: string };
  evaluations?: Record<string, number | null | undefined>;
  pricing?: {
    price_1m_input_tokens?: number | null;
    price_1m_output_tokens?: number | null;
  };
}

interface AAResponse {
  status?: number;
  data?: AAModel[];
}

/**
 * AA의 평가 지표 → Tiera 벤치마크 정의.
 * key는 evaluations 객체의 필드명이다.
 */
export const AA_BENCHMARKS: (BenchmarkDefinition & { key: string })[] = [
  {
    key: "artificial_analysis_intelligence_index",
    slug: "aa-intelligence-index",
    name: "AA Intelligence Index",
    category: null, // 특정 카테고리가 아니라 종합에만 반영
    unit: "점",
    higherIsBetter: true,
    weight: 1.4,
    sourceName: SOURCE_NAME,
    sourceUrl: `${SOURCE_URL}/methodology/intelligence-benchmarking`,
  },
  {
    key: "artificial_analysis_coding_index",
    slug: "aa-coding-index",
    name: "AA Coding Index",
    category: "CODING",
    unit: "점",
    higherIsBetter: true,
    weight: 1.3,
    sourceName: SOURCE_NAME,
    sourceUrl: `${SOURCE_URL}/methodology/intelligence-benchmarking`,
  },
  {
    key: "livecodebench",
    slug: "livecodebench",
    name: "LiveCodeBench",
    category: "CODING",
    unit: "%",
    higherIsBetter: true,
    weight: 1.0,
    sourceName: SOURCE_NAME,
    sourceUrl: `${SOURCE_URL}/methodology/intelligence-benchmarking`,
  },
  {
    key: "scicode",
    slug: "scicode",
    name: "SciCode",
    category: "CODING",
    unit: "%",
    higherIsBetter: true,
    weight: 0.8,
    sourceName: SOURCE_NAME,
    sourceUrl: `${SOURCE_URL}/methodology/intelligence-benchmarking`,
  },
  {
    key: "gpqa",
    slug: "gpqa-diamond",
    name: "GPQA Diamond",
    category: "REASONING",
    unit: "%",
    higherIsBetter: true,
    weight: 1.1,
    sourceName: SOURCE_NAME,
    sourceUrl: `${SOURCE_URL}/methodology/intelligence-benchmarking`,
  },
  {
    key: "mmlu_pro",
    slug: "mmlu-pro",
    name: "MMLU-Pro",
    category: "REASONING",
    unit: "%",
    higherIsBetter: true,
    weight: 1.0,
    sourceName: SOURCE_NAME,
    sourceUrl: `${SOURCE_URL}/methodology/intelligence-benchmarking`,
  },
  {
    key: "hle",
    slug: "hle",
    name: "Humanity's Last Exam",
    category: "REASONING",
    unit: "%",
    higherIsBetter: true,
    weight: 1.0,
    sourceName: SOURCE_NAME,
    sourceUrl: `${SOURCE_URL}/methodology/intelligence-benchmarking`,
  },
  {
    key: "artificial_analysis_math_index",
    slug: "aa-math-index",
    name: "AA Math Index",
    category: "REASONING",
    unit: "점",
    higherIsBetter: true,
    weight: 0.9,
    sourceName: SOURCE_NAME,
    sourceUrl: `${SOURCE_URL}/methodology/intelligence-benchmarking`,
  },
  {
    key: "aime",
    slug: "aime",
    name: "AIME",
    category: "REASONING",
    unit: "%",
    higherIsBetter: true,
    weight: 0.8,
    sourceName: SOURCE_NAME,
    sourceUrl: `${SOURCE_URL}/methodology/intelligence-benchmarking`,
  },
];

export interface CuratedModel {
  slug: string;
  name: string;
  creator: CuratedCreator;
  inputPricePerM: string | null;
  outputPricePerM: string | null;
}

export interface AASyncPayload {
  models: CuratedModel[];
  results: RawBenchmarkResult[];
  /** 국가 매핑에 없어서 건너뛴 개발사 — 큐레이션 목록을 늘릴 때 참고용 */
  skippedCreators: string[];
}

/** 원시 응답 → Tiera가 쓰는 형태. 네트워크를 모르는 순수 함수라 테스트가 쉽다. */
export function transform(raw: AAResponse, measuredAt: Date): AASyncPayload {
  const models: CuratedModel[] = [];
  const results: RawBenchmarkResult[] = [];
  const skipped = new Set<string>();

  for (const m of raw.data ?? []) {
    const creatorSlug = m.model_creator?.slug ?? "";
    const creatorName = m.model_creator?.name ?? "";
    const creator = lookupCreator(creatorSlug, creatorName);

    if (!creator) {
      if (creatorName || creatorSlug) skipped.add(creatorName || creatorSlug);
      continue; // 미국·중국·한국 외 개발사는 수집하지 않는다
    }
    if (!m.slug || !m.name) continue;

    const price = (v: number | null | undefined) =>
      typeof v === "number" && Number.isFinite(v) ? v.toFixed(4) : null;

    models.push({
      slug: m.slug,
      name: m.name,
      creator,
      inputPricePerM: price(m.pricing?.price_1m_input_tokens),
      outputPricePerM: price(m.pricing?.price_1m_output_tokens),
    });

    for (const b of AA_BENCHMARKS) {
      const value = m.evaluations?.[b.key];
      // null·undefined·NaN은 "측정 안 됨"이다. 0으로 채우면 실제로 0점 받은 것과 구분이 안 된다.
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      results.push({
        modelSlug: m.slug,
        benchmarkSlug: b.slug,
        value,
        measuredAt,
        sourceUrl: `${SOURCE_URL}/models/${m.slug}`,
      });
    }
  }

  return { models, results, skippedCreators: [...skipped].sort() };
}

export class ArtificialAnalysisSource implements BenchmarkSource {
  readonly id = "artificial-analysis";

  constructor(private readonly apiKey: string) {}

  async definitions(): Promise<BenchmarkDefinition[]> {
    // key는 내부용이라 떼고 넘긴다
    return AA_BENCHMARKS.map(({ key: _key, ...rest }) => rest);
  }

  async fetchAll(): Promise<AASyncPayload> {
    const res = await fetch(`${API_BASE}/data/llms/models`, {
      headers: { "x-api-key": this.apiKey },
      // 서버에서만 호출한다. 키가 클라이언트로 나가면 안 된다.
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Artificial Analysis API 오류 ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`
      );
    }

    return transform((await res.json()) as AAResponse, new Date());
  }

  async fetchResults(): Promise<RawBenchmarkResult[]> {
    return (await this.fetchAll()).results;
  }
}
/* Footer: lib/data-sources/artificial-analysis.ts */
