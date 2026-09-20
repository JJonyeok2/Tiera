/* ---------------------------------------------------------------------------
 * Header: LMArena 리더보드 수집 어댑터 — 사람 평가 축의 데이터 소스.
 *
 * LMArena(구 Chatbot Arena)는 사람이 두 모델의 응답을 블라인드로 비교해 고른
 * 결과를 Bradley-Terry 레이팅으로 집계한다. 시드 더미와 달리 실제 사람의 판단이고,
 * 표본이 모델당 수만 표라 우리 베이지안 보정식의 v로 그대로 쓸 수 있다.
 *
 * 데이터는 HuggingFace가 변환해둔 파케이 파일 하나로 받는다(약 570KB).
 * datasets-server의 /rows는 한 번에 100행씩이라 1만 행을 받으려면 100번 넘게
 * 호출해야 하고, /filter는 응답이 느려 타임아웃이 잦다. 파일 하나를 통째로
 * 받아 메모리에서 거르는 편이 요청 1회로 끝나고 훨씬 안정적이다.
 *
 * 라이선스: CC BY 4.0 — 출처 표기 필수. 화면의 표기를 지우면 안 된다.
 * ------------------------------------------------------------------------- */

import type { ScoreScope } from "@/db/schema";

const PARQUET_BASE =
  "https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/refs%2Fconvert%2Fparquet";

/** 우리 스코프별로 어떤 설정(config)의 어떤 카테고리를 쓸지. */
export const ARENA_SOURCES: { scope: ScoreScope; config: string; category: string }[] = [
  { scope: "OVERALL", config: "text", category: "overall" },
  { scope: "CODING", config: "text", category: "coding" },
  { scope: "WRITING", config: "text", category: "creative_writing" },
  // 추론은 math가 가장 근접하다. hard_prompts는 "어려운 질문"이라 성격이 섞인다.
  { scope: "REASONING", config: "text", category: "math" },
  { scope: "MULTIMODAL", config: "vision", category: "overall" },
];

/** 한국어 성능은 우리 스코프에 없지만 한국 사용자에게는 가장 쓸모 있는 축이다. */
export const KOREAN_SOURCE = { config: "text", category: "korean" } as const;

export function parquetUrl(config: string, split = "latest"): string {
  return `${PARQUET_BASE}/${config}/${split}/0000.parquet`;
}

/** 파케이 한 행. 필드명은 데이터셋 스키마 그대로다. */
export interface ArenaRow {
  model_name: string;
  organization: string;
  license: string | null;
  rating: number;
  vote_count: number;
  rank: number;
  category: string;
}

/** 스코프별로 정리된 결과. */
export interface ArenaEntry {
  scope: ScoreScope;
  /** 매칭용 정규화 키 */
  key: string;
  /** 원본 이름 — 매칭 실패를 사람이 읽고 고칠 때 필요하다 */
  rawName: string;
  organization: string;
  rating: number;
  voteCount: number;
  arenaRank: number;
}

/**
 * 같은 모델의 추론 강도·날짜 변형을 하나로 모으기 위한 접미사 목록.
 *
 * LMArena는 claude-opus-5-max / claude-opus-5-high 처럼 설정별로 따로 올린다.
 * 우리 모델 목록은 설정 단위가 아니라 모델 단위라 이걸 떼야 이름이 맞는다.
 * (Artificial Analysis 수집에서 괄호 변형을 통합한 것과 같은 이유다.)
 */
const VARIANT_SUFFIXES = [
  "max",
  "high",
  "medium",
  "low",
  "minimal",
  "thinking",
  "nothinking",
  "no-thinking",
  "reasoning",
  "preview",
  "latest",
  "exp",
  "experimental",
  "chat",
];

/**
 * 매칭용 키를 만든다.
 *
 * 이름 규칙이 서로 다른 두 출처를 붙이는 지점이라, 여기서 과하게 깎으면
 * 서로 다른 모델이 같은 키가 되고(오매칭), 덜 깎으면 같은 모델을 놓친다.
 * 그래서 "설정을 나타내는 접미사"와 "날짜"만 떼고 나머지는 건드리지 않는다.
 */
export function arenaKey(name: string): string {
  let s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // 날짜 접미사: -20250219, -2025-02-19, -0219
  s = s.replace(/-\d{4}-\d{2}-\d{2}$/, "").replace(/-\d{6,8}$/, "");

  // 설정 접미사는 여러 개가 붙기도 한다 (예: -preview-high)
  let changed = true;
  while (changed) {
    changed = false;
    for (const suf of VARIANT_SUFFIXES) {
      if (s.endsWith(`-${suf}`)) {
        s = s.slice(0, -(suf.length + 1));
        changed = true;
      }
    }
    const dated = s.replace(/-\d{4}-\d{2}-\d{2}$/, "").replace(/-\d{6,8}$/, "");
    if (dated !== s) {
      s = dated;
      changed = true;
    }
  }
  return s;
}

/** 구분자까지 지운 느슨한 키. 엄격 키가 실패했을 때만 쓴다. */
export function looseKey(name: string): string {
  return arenaKey(name).replace(/-/g, "");
}

/**
 * 원시 행 → 스코프별 엔트리. 네트워크를 모르는 순수 함수라 테스트가 쉽다.
 *
 * 같은 키로 변형이 여러 개 들어오면 투표 수가 가장 많은 쪽을 남긴다.
 * 레이팅이 가장 높은 쪽을 고르면 표본 10표짜리 실험 변형이 대표가 되어버린다.
 */
export function transformArena(
  rows: ArenaRow[],
  scope: ScoreScope,
  category: string
): ArenaEntry[] {
  const chosen = new Map<string, ArenaEntry>();

  for (const r of rows) {
    if (r.category !== category) continue;
    if (!r.model_name || typeof r.rating !== "number") continue;
    if (!Number.isFinite(r.rating)) continue;

    const votes = Number(r.vote_count) || 0;
    // 표본이 아예 없는 행은 순위를 만들 근거가 없다.
    if (votes <= 0) continue;

    const key = arenaKey(r.model_name);
    if (!key) continue;

    const prev = chosen.get(key);
    if (prev && prev.voteCount >= votes) continue;

    chosen.set(key, {
      scope,
      key,
      rawName: r.model_name,
      organization: (r.organization ?? "").trim(),
      rating: r.rating,
      voteCount: votes,
      arenaRank: Number(r.rank) || 0,
    });
  }

  return [...chosen.values()].sort((a, b) => b.rating - a.rating);
}

/**
 * 파케이 파일을 받아 행 배열로 만든다.
 *
 * hyparquet은 순수 JS라 네이티브 빌드가 없다 — 서버리스에 그대로 올라간다.
 */
export async function fetchArenaRows(config: string): Promise<ArenaRow[]> {
  const { asyncBufferFromUrl, parquetReadObjects } = await import("hyparquet");
  const file = await asyncBufferFromUrl({ url: parquetUrl(config) });
  const rows = (await parquetReadObjects({ file })) as unknown as ArenaRow[];
  return rows;
}
/* Footer: lib/data-sources/lmarena.ts */
