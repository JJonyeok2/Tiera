/* ---------------------------------------------------------------------------
 * Header: 로컬 모델 데이터 — 그래픽카드 등급, 카드 목록, 로컬 실행 변형. SPEC 25.
 *
 * DB가 아니라 코드에 둔다(/dev 섹션과 같은 이유). 손으로 고른 수십 줄짜리 목록이고,
 * 계산은 순수 함수라 요청마다 해도 싸다. DB에 넣으면 시드가 배포에 안 들어가는
 * 공백(SPEC 23.10)이 그대로 생기고, 그날은 /local이 빈 화면이 된다.
 *
 * 작성 규칙 — 도구 시드(db/seed-tools-data.ts)와 같다.
 *
 * 1. **확인한 값만 넣는다.** 파일 크기는 Ollama 라이브러리 태그 페이지,
 *    레이어·KV 헤드·헤드 차원은 HuggingFace의 config.json에서 그대로 옮겼다.
 *    각 항목의 sources가 그 페이지다. 조사일 2026-11-24.
 * 2. **크기는 태그와 짝이 맞아야 한다.** 기본 태그가 플랫폼에 따라 다른 파일을 받는
 *    모델(qwen3.5, gemma4 — 맥에서는 MLX 파일을 받는다)은 q4_K_M 태그를 명시했다.
 *    그래야 화면의 "필요 메모리"와 사용자가 실제로 받는 파일이 같은 것이 된다.
 * 3. **KV 캐시를 결정하는 구조를 레이어 묶음으로 적는다.** 요즘 모델은 모든 레이어가
 *    같은 어텐션을 쓰지 않는다. Gemma는 6층마다 한 층만 전체 어텐션이고 나머지는
 *    1024토큰 슬라이딩 윈도우, gpt-oss는 128토큰 윈도우와 번갈아 쓰고, Qwen3.5는
 *    4층마다 한 층만 KV 캐시를 쓰는 어텐션이다(나머지는 선형 어텐션이라 고정 크기 상태).
 *    전부 같은 식으로 계산하면 긴 컨텍스트에서 몇 배씩 부풀려진다.
 * ------------------------------------------------------------------------- */

import type { Country } from "@/db/schema";

// --- 그래픽카드 등급 ---------------------------------------------------------

export type MemoryKind = "DEDICATED" | "UNIFIED";

export interface VramClass {
  slug: string;
  /** 화면 표기. "8GB급" */
  label: string;
  /** 판정에 쓰는 용량(GiB). 제조사 표기 그대로 — 8GB 카드는 8 GiB다 */
  memoryGb: number;
  kind: MemoryKind;
  /** 이 등급이 "이상"을 뜻하는지(맨 위 등급) */
  orMore?: boolean;
}

/**
 * 결과는 이 단위로만 갈린다. v1은 메모리만 계산하므로 VRAM이 같은 카드는 결과가 같다.
 * 카드마다 페이지를 만들면 내용이 같은 문서가 여러 개 생겨 중복 문서가 된다(SPEC 17.3).
 */
export const VRAM_CLASSES: VramClass[] = [
  { slug: "6gb", label: "6GB급", memoryGb: 6, kind: "DEDICATED" },
  { slug: "8gb", label: "8GB급", memoryGb: 8, kind: "DEDICATED" },
  { slug: "12gb", label: "12GB급", memoryGb: 12, kind: "DEDICATED" },
  { slug: "16gb", label: "16GB급", memoryGb: 16, kind: "DEDICATED" },
  { slug: "24gb", label: "24GB급", memoryGb: 24, kind: "DEDICATED" },
  { slug: "32gb", label: "32GB 이상", memoryGb: 32, kind: "DEDICATED", orMore: true },
  { slug: "mac-16gb", label: "Mac 16GB", memoryGb: 16, kind: "UNIFIED" },
  { slug: "mac-24gb", label: "Mac 24GB", memoryGb: 24, kind: "UNIFIED" },
  { slug: "mac-32gb", label: "Mac 32GB", memoryGb: 32, kind: "UNIFIED" },
  { slug: "mac-48gb", label: "Mac 48GB", memoryGb: 48, kind: "UNIFIED" },
  { slug: "mac-64gb", label: "Mac 64GB 이상", memoryGb: 64, kind: "UNIFIED", orMore: true },
];

export function getVramClass(slug: string): VramClass | undefined {
  return VRAM_CLASSES.find((c) => c.slug === slug);
}

/** 같은 종류(그래픽카드/맥) 안에서 한 단계 위 등급. 맨 위면 undefined. */
export function nextClass(c: VramClass): VramClass | undefined {
  const same = VRAM_CLASSES.filter((x) => x.kind === c.kind);
  const i = same.findIndex((x) => x.slug === c.slug);
  return i >= 0 ? same[i + 1] : undefined;
}

/**
 * 용량(GB)을 받아 들어갈 등급을 고른다 — 그 용량 이하 중 가장 큰 등급.
 * 경계에 걸리는 카드(10GB, 11GB)는 아래 등급으로 간다. 판정이 보수적이 되는 쪽이다.
 * 가장 작은 등급보다 작으면 undefined.
 */
export function classForMemory(gb: number, kind: MemoryKind): VramClass | undefined {
  const same = VRAM_CLASSES.filter((x) => x.kind === kind && x.memoryGb <= gb);
  return same[same.length - 1];
}

// --- 그래픽카드 ---------------------------------------------------------------

export interface Gpu {
  slug: string;
  name: string;
  vendor: "NVIDIA" | "AMD";
  /** 제조사 공식 사양의 VRAM(GB) */
  memoryGb: number;
  /** 검색용 다른 표기. 화면에는 안 나온다 */
  aliases?: string[];
}

/**
 * 최근 세대 소비자용 카드. VRAM은 제조사 공식 사양 기준이다.
 * 같은 이름에 용량이 둘인 카드(4060 Ti 8/16GB 등)는 따로 적는다 —
 * 하나로 합치면 8GB 산 사람이 16GB 결과를 보게 된다.
 */
export const GPUS: Gpu[] = [
  // NVIDIA GeForce RTX 50
  { slug: "rtx-5090", name: "RTX 5090", vendor: "NVIDIA", memoryGb: 32 },
  { slug: "rtx-5080", name: "RTX 5080", vendor: "NVIDIA", memoryGb: 16 },
  { slug: "rtx-5070-ti", name: "RTX 5070 Ti", vendor: "NVIDIA", memoryGb: 16 },
  { slug: "rtx-5070", name: "RTX 5070", vendor: "NVIDIA", memoryGb: 12 },
  { slug: "rtx-5060-ti-16gb", name: "RTX 5060 Ti 16GB", vendor: "NVIDIA", memoryGb: 16 },
  { slug: "rtx-5060-ti-8gb", name: "RTX 5060 Ti 8GB", vendor: "NVIDIA", memoryGb: 8 },
  { slug: "rtx-5060", name: "RTX 5060", vendor: "NVIDIA", memoryGb: 8 },
  // NVIDIA GeForce RTX 40
  { slug: "rtx-4090", name: "RTX 4090", vendor: "NVIDIA", memoryGb: 24 },
  { slug: "rtx-4080-super", name: "RTX 4080 SUPER", vendor: "NVIDIA", memoryGb: 16 },
  { slug: "rtx-4080", name: "RTX 4080", vendor: "NVIDIA", memoryGb: 16 },
  { slug: "rtx-4070-ti-super", name: "RTX 4070 Ti SUPER", vendor: "NVIDIA", memoryGb: 16 },
  { slug: "rtx-4070-ti", name: "RTX 4070 Ti", vendor: "NVIDIA", memoryGb: 12 },
  { slug: "rtx-4070-super", name: "RTX 4070 SUPER", vendor: "NVIDIA", memoryGb: 12 },
  { slug: "rtx-4070", name: "RTX 4070", vendor: "NVIDIA", memoryGb: 12 },
  { slug: "rtx-4060-ti-16gb", name: "RTX 4060 Ti 16GB", vendor: "NVIDIA", memoryGb: 16 },
  { slug: "rtx-4060-ti-8gb", name: "RTX 4060 Ti 8GB", vendor: "NVIDIA", memoryGb: 8 },
  { slug: "rtx-4060", name: "RTX 4060", vendor: "NVIDIA", memoryGb: 8 },
  // NVIDIA GeForce RTX 30
  { slug: "rtx-3090-ti", name: "RTX 3090 Ti", vendor: "NVIDIA", memoryGb: 24 },
  { slug: "rtx-3090", name: "RTX 3090", vendor: "NVIDIA", memoryGb: 24 },
  { slug: "rtx-3080-12gb", name: "RTX 3080 12GB", vendor: "NVIDIA", memoryGb: 12 },
  { slug: "rtx-3080-10gb", name: "RTX 3080 10GB", vendor: "NVIDIA", memoryGb: 10 },
  { slug: "rtx-3070-ti", name: "RTX 3070 Ti", vendor: "NVIDIA", memoryGb: 8 },
  { slug: "rtx-3070", name: "RTX 3070", vendor: "NVIDIA", memoryGb: 8 },
  { slug: "rtx-3060-ti", name: "RTX 3060 Ti", vendor: "NVIDIA", memoryGb: 8 },
  { slug: "rtx-3060-12gb", name: "RTX 3060 12GB", vendor: "NVIDIA", memoryGb: 12 },
  { slug: "rtx-3050", name: "RTX 3050", vendor: "NVIDIA", memoryGb: 8 },
  // NVIDIA 이전 세대 — 아직 많이 남아 있는 카드
  { slug: "rtx-2080-ti", name: "RTX 2080 Ti", vendor: "NVIDIA", memoryGb: 11 },
  { slug: "rtx-2070-super", name: "RTX 2070 SUPER", vendor: "NVIDIA", memoryGb: 8 },
  { slug: "rtx-2060-super", name: "RTX 2060 SUPER", vendor: "NVIDIA", memoryGb: 8 },
  { slug: "rtx-2060", name: "RTX 2060", vendor: "NVIDIA", memoryGb: 6 },
  { slug: "gtx-1660-super", name: "GTX 1660 SUPER", vendor: "NVIDIA", memoryGb: 6 },
  { slug: "gtx-1080-ti", name: "GTX 1080 Ti", vendor: "NVIDIA", memoryGb: 11 },
  // AMD Radeon
  { slug: "rx-9070-xt", name: "RX 9070 XT", vendor: "AMD", memoryGb: 16 },
  { slug: "rx-9070", name: "RX 9070", vendor: "AMD", memoryGb: 16 },
  { slug: "rx-9060-xt-16gb", name: "RX 9060 XT 16GB", vendor: "AMD", memoryGb: 16 },
  { slug: "rx-9060-xt-8gb", name: "RX 9060 XT 8GB", vendor: "AMD", memoryGb: 8 },
  { slug: "rx-7900-xtx", name: "RX 7900 XTX", vendor: "AMD", memoryGb: 24 },
  { slug: "rx-7900-xt", name: "RX 7900 XT", vendor: "AMD", memoryGb: 20 },
  { slug: "rx-7800-xt", name: "RX 7800 XT", vendor: "AMD", memoryGb: 16 },
  { slug: "rx-7700-xt", name: "RX 7700 XT", vendor: "AMD", memoryGb: 12 },
  { slug: "rx-7600", name: "RX 7600", vendor: "AMD", memoryGb: 8 },
  { slug: "rx-6700-xt", name: "RX 6700 XT", vendor: "AMD", memoryGb: 12 },
  { slug: "rx-6600", name: "RX 6600", vendor: "AMD", memoryGb: 8 },
];

export function gpuClass(g: Gpu): VramClass | undefined {
  return classForMemory(g.memoryGb, "DEDICATED");
}

export function gpusInClass(c: VramClass): Gpu[] {
  if (c.kind !== "DEDICATED") return [];
  return GPUS.filter((g) => gpuClass(g)?.slug === c.slug);
}

export function getGpu(slug: string): Gpu | undefined {
  return GPUS.find((g) => g.slug === slug);
}

// --- 로컬 실행 변형 -----------------------------------------------------------

/**
 * KV 캐시를 쓰는 레이어 묶음.
 * window가 있으면 슬라이딩 윈도우 레이어라 컨텍스트가 아무리 길어도 window 토큰까지만 쌓인다.
 */
export interface AttnGroup {
  layers: number;
  kvHeads: number;
  headDim: number;
  window?: number;
}

export interface LocalVariant {
  /** 내부 id. "qwen3-8b" */
  id: string;
  /** 화면 표기. "Qwen3 8B" */
  name: string;
  developer: string;
  country: Country;
  /** `ollama run` 뒤에 그대로 들어가는 태그 */
  ollamaTag: string;
  /** Ollama 라이브러리 표기 다운로드 크기(GB). 가중치 메모리로 그대로 쓴다 */
  sizeGb: number;
  quant: string;
  /** 전체 파라미터(B). MoE도 전체 — 메모리에는 전부 올라간다 */
  paramsB: number;
  /** MoE일 때 한 번에 쓰는 파라미터(B). 속도에만 영향이 있다 */
  activeParamsB?: number;
  /** 이 태그가 받는 최대 컨텍스트(토큰) */
  maxContext: number;
  attention: AttnGroup[];
  /** 우리 model 테이블의 slug 후보. 앞에서부터 처음 있는 것을 쓴다 */
  modelSlugs: string[];
  /** 한 줄 특징. 해요체 */
  note?: string;
  sources: string[];
}

const OLLAMA = (name: string) => `https://ollama.com/library/${name}/tags`;
const HF = (repo: string) => `https://huggingface.co/${repo}/blob/main/config.json`;

/** Gemma 3: 6층마다 1층이 전체 어텐션, 나머지는 1024토큰 윈도우 */
function gemma3(layers: number, kvHeads: number, headDim: number): AttnGroup[] {
  const full = Math.floor(layers / 6);
  return [
    { layers: full, kvHeads, headDim },
    { layers: layers - full, kvHeads, headDim, window: 1024 },
  ];
}

export const LOCAL_VARIANTS: LocalVariant[] = [
  // --- Alibaba Qwen ---------------------------------------------------------
  {
    id: "qwen3-4b", name: "Qwen3 4B", developer: "Alibaba", country: "CN",
    ollamaTag: "qwen3:4b", sizeGb: 2.5, quant: "Q4_K_M", paramsB: 4, maxContext: 262144,
    attention: [{ layers: 36, kvHeads: 8, headDim: 128 }],
    modelSlugs: ["qwen3-4b-2507-instruct", "qwen3-4b-2507", "qwen3-4b"],
    note: "작은 카드에서도 가볍게 돌아가는 2507 개정판이에요.",
    sources: [OLLAMA("qwen3"), HF("Qwen/Qwen3-4B")],
  },
  {
    id: "qwen3-8b", name: "Qwen3 8B", developer: "Alibaba", country: "CN",
    ollamaTag: "qwen3:8b", sizeGb: 5.2, quant: "Q4_K_M", paramsB: 8, maxContext: 40960,
    attention: [{ layers: 36, kvHeads: 8, headDim: 128 }],
    modelSlugs: ["qwen3-8b"],
    sources: [OLLAMA("qwen3"), HF("Qwen/Qwen3-8B")],
  },
  {
    id: "qwen3-14b", name: "Qwen3 14B", developer: "Alibaba", country: "CN",
    ollamaTag: "qwen3:14b", sizeGb: 9.3, quant: "Q4_K_M", paramsB: 14, maxContext: 40960,
    attention: [{ layers: 40, kvHeads: 8, headDim: 128 }],
    modelSlugs: ["qwen3-14b"],
    sources: [OLLAMA("qwen3"), HF("Qwen/Qwen3-14B")],
  },
  {
    id: "qwen3-32b", name: "Qwen3 32B", developer: "Alibaba", country: "CN",
    ollamaTag: "qwen3:32b", sizeGb: 20, quant: "Q4_K_M", paramsB: 32, maxContext: 40960,
    attention: [{ layers: 64, kvHeads: 8, headDim: 128 }],
    modelSlugs: ["qwen3-32b"],
    sources: [OLLAMA("qwen3"), HF("Qwen/Qwen3-32B")],
  },
  {
    id: "qwen3-30b-a3b", name: "Qwen3 30B-A3B", developer: "Alibaba", country: "CN",
    ollamaTag: "qwen3:30b", sizeGb: 19, quant: "Q4_K_M", paramsB: 30, activeParamsB: 3, maxContext: 262144,
    attention: [{ layers: 48, kvHeads: 4, headDim: 128 }],
    modelSlugs: ["qwen3-30b-a3b-2507-instruct", "qwen3-30b-a3b-2507", "qwen3-30b-a3b"],
    note: "한 번에 3B만 쓰는 MoE라 빠르지만, 메모리에는 30B 전체가 올라가요.",
    sources: [OLLAMA("qwen3"), HF("Qwen/Qwen3-30B-A3B")],
  },
  {
    id: "qwen3-5-4b", name: "Qwen3.5 4B", developer: "Alibaba", country: "CN",
    ollamaTag: "qwen3.5:4b-q4_K_M", sizeGb: 3.3, quant: "Q4_K_M", paramsB: 4, maxContext: 262144,
    attention: [{ layers: 8, kvHeads: 4, headDim: 256 }],
    modelSlugs: ["qwen3-5-4b"],
    note: "긴 컨텍스트에서도 메모리가 적게 늘어나는 구조예요.",
    sources: [OLLAMA("qwen3.5"), HF("Qwen/Qwen3.5-4B")],
  },
  {
    id: "qwen3-5-9b", name: "Qwen3.5 9B", developer: "Alibaba", country: "CN",
    ollamaTag: "qwen3.5:9b-q4_K_M", sizeGb: 6.6, quant: "Q4_K_M", paramsB: 9, maxContext: 262144,
    attention: [{ layers: 8, kvHeads: 4, headDim: 256 }],
    modelSlugs: ["qwen3-5-9b"],
    note: "긴 컨텍스트에서도 메모리가 적게 늘어나는 구조예요.",
    sources: [OLLAMA("qwen3.5"), HF("Qwen/Qwen3.5-9B")],
  },
  {
    id: "qwen3-5-27b", name: "Qwen3.5 27B", developer: "Alibaba", country: "CN",
    ollamaTag: "qwen3.5:27b-q4_K_M", sizeGb: 17, quant: "Q4_K_M", paramsB: 27, maxContext: 262144,
    attention: [{ layers: 16, kvHeads: 4, headDim: 256 }],
    modelSlugs: ["qwen3-5-27b"],
    sources: [OLLAMA("qwen3.5"), HF("Qwen/Qwen3.5-27B")],
  },
  {
    id: "qwen3-5-35b-a3b", name: "Qwen3.5 35B-A3B", developer: "Alibaba", country: "CN",
    ollamaTag: "qwen3.5:35b-a3b-q4_K_M", sizeGb: 22, quant: "Q4_K_M", paramsB: 35, activeParamsB: 3, maxContext: 262144,
    attention: [{ layers: 10, kvHeads: 2, headDim: 256 }],
    modelSlugs: ["qwen3-5-35b-a3b"],
    note: "한 번에 3B만 쓰는 MoE라 빠르지만, 메모리에는 35B 전체가 올라가요.",
    sources: [OLLAMA("qwen3.5"), HF("Qwen/Qwen3.5-35B-A3B")],
  },

  // --- Google Gemma ---------------------------------------------------------
  {
    id: "gemma3-4b", name: "Gemma 3 4B", developer: "Google", country: "US",
    ollamaTag: "gemma3:4b", sizeGb: 3.4, quant: "Q4_K_M", paramsB: 4, maxContext: 131072,
    attention: gemma3(34, 4, 256),
    modelSlugs: ["gemma-3-4b-instruct"],
    note: "사진을 넣고 물어볼 수도 있어요.",
    sources: [OLLAMA("gemma3"), HF("unsloth/gemma-3-4b-it")],
  },
  {
    id: "gemma3-12b", name: "Gemma 3 12B", developer: "Google", country: "US",
    ollamaTag: "gemma3:12b", sizeGb: 8.2, quant: "Q4_K_M", paramsB: 12, maxContext: 131072,
    attention: gemma3(48, 8, 256),
    modelSlugs: ["gemma-3-12b-instruct"],
    note: "사진을 넣고 물어볼 수도 있어요.",
    sources: [OLLAMA("gemma3"), HF("unsloth/gemma-3-12b-it")],
  },
  {
    id: "gemma3-27b", name: "Gemma 3 27B", developer: "Google", country: "US",
    ollamaTag: "gemma3:27b", sizeGb: 17, quant: "Q4_K_M", paramsB: 27, maxContext: 131072,
    attention: gemma3(62, 16, 128),
    modelSlugs: ["gemma-3-27b-instruct"],
    note: "사진을 넣고 물어볼 수도 있어요.",
    sources: [OLLAMA("gemma3"), HF("unsloth/gemma-3-27b-it")],
  },
  {
    id: "gemma4-12b", name: "Gemma 4 12B", developer: "Google", country: "US",
    ollamaTag: "gemma4:12b-it-q4_K_M", sizeGb: 8.0, quant: "Q4_K_M", paramsB: 12, maxContext: 262144,
    attention: [
      { layers: 8, kvHeads: 1, headDim: 512 },
      { layers: 40, kvHeads: 8, headDim: 256, window: 1024 },
    ],
    modelSlugs: ["gemma-4-12b"],
    note: "사진을 넣고 물어볼 수도 있어요.",
    sources: [OLLAMA("gemma4"), HF("unsloth/gemma-4-12b-it")],
  },
  {
    id: "gemma4-26b-a4b", name: "Gemma 4 26B-A4B", developer: "Google", country: "US",
    ollamaTag: "gemma4:26b-a4b-it-q4_K_M", sizeGb: 18, quant: "Q4_K_M", paramsB: 26, activeParamsB: 4, maxContext: 262144,
    attention: [
      { layers: 5, kvHeads: 2, headDim: 512 },
      { layers: 25, kvHeads: 8, headDim: 256, window: 1024 },
    ],
    modelSlugs: ["gemma-4-26b-a4b"],
    note: "한 번에 4B만 쓰는 MoE라 빠르지만, 메모리에는 26B 전체가 올라가요.",
    sources: [OLLAMA("gemma4"), HF("unsloth/gemma-4-26b-a4b-it")],
  },
  {
    id: "gemma4-31b", name: "Gemma 4 31B", developer: "Google", country: "US",
    ollamaTag: "gemma4:31b-it-q4_K_M", sizeGb: 20, quant: "Q4_K_M", paramsB: 31, maxContext: 262144,
    attention: [
      { layers: 10, kvHeads: 4, headDim: 512 },
      { layers: 50, kvHeads: 16, headDim: 256, window: 1024 },
    ],
    modelSlugs: ["gemma-4-31b"],
    sources: [OLLAMA("gemma4"), HF("unsloth/gemma-4-31b-it")],
  },

  // --- OpenAI gpt-oss -------------------------------------------------------
  {
    id: "gpt-oss-20b", name: "gpt-oss 20B", developer: "OpenAI", country: "US",
    ollamaTag: "gpt-oss:20b", sizeGb: 14, quant: "MXFP4", paramsB: 21, activeParamsB: 3.6, maxContext: 131072,
    attention: [
      { layers: 12, kvHeads: 8, headDim: 64 },
      { layers: 12, kvHeads: 8, headDim: 64, window: 128 },
    ],
    modelSlugs: ["gpt-oss-20b"],
    note: "OpenAI가 공개한 오픈웨이트 모델이에요. 도구 호출을 잘해서 에이전트에 많이 붙여요.",
    sources: [OLLAMA("gpt-oss"), HF("openai/gpt-oss-20b")],
  },
  {
    id: "gpt-oss-120b", name: "gpt-oss 120B", developer: "OpenAI", country: "US",
    ollamaTag: "gpt-oss:120b", sizeGb: 65, quant: "MXFP4", paramsB: 117, activeParamsB: 5.1, maxContext: 131072,
    attention: [
      { layers: 18, kvHeads: 8, headDim: 64 },
      { layers: 18, kvHeads: 8, headDim: 64, window: 128 },
    ],
    modelSlugs: ["gpt-oss-120b"],
    sources: [OLLAMA("gpt-oss"), HF("openai/gpt-oss-120b")],
  },

  // --- Meta Llama / Nous Hermes ---------------------------------------------
  {
    id: "llama3-1-8b", name: "Llama 3.1 8B", developer: "Meta", country: "US",
    ollamaTag: "llama3.1:8b", sizeGb: 4.9, quant: "Q4_K_M", paramsB: 8, maxContext: 131072,
    attention: [{ layers: 32, kvHeads: 8, headDim: 128 }],
    modelSlugs: ["llama-3-1-instruct-8b"],
    // Meta 원본 저장소는 동의 절차가 있어 config.json을 바로 못 연다. 구조가 같은
    // 파인튜닝(Hermes 3 8B)의 config로 레이어·헤드 값을 확인했다.
    sources: [OLLAMA("llama3.1"), HF("NousResearch/Hermes-3-Llama-3.1-8B")],
  },
  {
    id: "hermes3-8b", name: "Hermes 3 8B", developer: "Nous Research", country: "US",
    ollamaTag: "hermes3:8b-llama3.1-q4_K_M", sizeGb: 4.9, quant: "Q4_K_M", paramsB: 8, maxContext: 131072,
    attention: [{ layers: 32, kvHeads: 8, headDim: 128 }],
    modelSlugs: [],
    note: "Hermes Agent를 만든 Nous Research의 모델이에요. Llama 3.1 8B를 도구 호출용으로 다듬었어요.",
    sources: [OLLAMA("hermes3"), HF("NousResearch/Hermes-3-Llama-3.1-8B")],
  },

  // --- LG AI Research EXAONE ------------------------------------------------
  {
    id: "exaone3-5-2-4b", name: "EXAONE 3.5 2.4B", developer: "LG AI Research", country: "KR",
    ollamaTag: "exaone3.5:2.4b", sizeGb: 1.6, quant: "Q4_K_M", paramsB: 2.4, maxContext: 32768,
    attention: [{ layers: 30, kvHeads: 8, headDim: 80 }],
    modelSlugs: [],
    note: "한국 회사가 만든 모델이라 한국어에 강해요.",
    sources: [OLLAMA("exaone3.5"), HF("LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct")],
  },
  {
    id: "exaone3-5-7-8b", name: "EXAONE 3.5 7.8B", developer: "LG AI Research", country: "KR",
    ollamaTag: "exaone3.5:7.8b", sizeGb: 4.8, quant: "Q4_K_M", paramsB: 7.8, maxContext: 32768,
    attention: [{ layers: 32, kvHeads: 8, headDim: 128 }],
    modelSlugs: [],
    note: "한국 회사가 만든 모델이라 한국어에 강해요.",
    sources: [OLLAMA("exaone3.5"), HF("LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct")],
  },
  {
    id: "exaone3-5-32b", name: "EXAONE 3.5 32B", developer: "LG AI Research", country: "KR",
    ollamaTag: "exaone3.5:32b", sizeGb: 19, quant: "Q4_K_M", paramsB: 32, maxContext: 32768,
    attention: [{ layers: 64, kvHeads: 8, headDim: 128 }],
    modelSlugs: [],
    note: "한국 회사가 만든 모델이라 한국어에 강해요.",
    sources: [OLLAMA("exaone3.5"), HF("LGAI-EXAONE/EXAONE-3.5-32B-Instruct")],
  },
];

/** 모델 상세(/models/[slug])의 역방향 섹션용 */
export function variantsForModel(modelSlug: string): LocalVariant[] {
  return LOCAL_VARIANTS.filter((v) => v.modelSlugs.includes(modelSlug));
}

export const LOCAL_CHECKED_AT = "2026-11-24";
/* Footer: lib/local/data.ts */
