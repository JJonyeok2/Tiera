/* ---------------------------------------------------------------------------
 * Header: 벤치마크 수집 어댑터 인터페이스 — SPEC 10절
 *
 * 지금은 시드 파일 하나뿐이지만, 인터페이스를 먼저 파두는 이유는
 * 수집(collect) / 정규화(normalize) / 집계(aggregate) / 표시(present)를
 * 파일 단위로 갈라놓기 위해서다. 나중에 외부 리더보드를 붙일 때
 * 새 소스는 RawBenchmarkResult[]만 뱉으면 되고, 뒷단은 손대지 않는다.
 * ------------------------------------------------------------------------- */

import type { Category } from "@/db/schema";

export interface RawBenchmarkResult {
  modelSlug: string;
  benchmarkSlug: string;
  value: number;
  measuredAt: Date;
  sourceUrl?: string;
}

export interface BenchmarkDefinition {
  slug: string;
  name: string;
  category: Category | null;
  unit: string;
  higherIsBetter: boolean;
  weight: number;
  sourceName: string;
  sourceUrl: string;
}

export interface BenchmarkSource {
  readonly id: string;
  definitions(): Promise<BenchmarkDefinition[]>;
  fetchResults(): Promise<RawBenchmarkResult[]>;
}
/* Footer: lib/data-sources/types.ts */
