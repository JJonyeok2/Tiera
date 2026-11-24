/* ---------------------------------------------------------------------------
 * Header: 로컬 모델 메모리 계산 — 순수 함수. SPEC 25.4.
 *
 *   필요 메모리 = 가중치(파일 크기) + KV 캐시 + 실행 오버헤드
 *
 * 화면에는 전부 "계산 추정치"로 나간다. 실측이 아니다. 근거 없는 숫자(속도 tok/s)는
 * 내지 않는다 — 그건 실측 데이터가 붙는 v2의 일이다.
 *
 * 단위: 파일 크기는 Ollama 표기(GB = 10^9 바이트), 그래픽카드 용량은 제조사 표기인데
 * 실제로는 GiB다(8GB 카드 = 8 × 2^30 바이트). 둘을 그대로 비교하면 카드를 7% 작게
 * 보게 되므로 카드 쪽을 10^9 바이트 단위로 바꿔서 비교한다(capacityGb).
 * ------------------------------------------------------------------------- */

import type { LocalVariant, VramClass } from "./data";
import { LOCAL_VARIANTS, VRAM_CLASSES, nextClass } from "./data";

/** 실행기(llama.cpp·CUDA 등)가 모델과 별도로 잡는 메모리. 0.5~1GB 범위의 중간값 */
export const RUNTIME_OVERHEAD_GB = 0.8;
/** KV 캐시 한 값의 바이트. Ollama 기본은 f16 */
export const KV_BYTES = 2;
/** 그래픽카드를 다 쓰지 않는다. 화면 출력·드라이버가 일부를 쓴다 */
export const VRAM_USABLE = 0.9;
/** 맥 통합 메모리 중 GPU 몫으로 보는 비율. 운영체제와 나눠 쓰므로 보수적으로 잡았다 */
export const UNIFIED_USABLE = 0.7;
/** CPU로 넘길 때 운영체제 몫으로 남겨 두는 시스템 RAM */
export const OS_RESERVED_GB = 4;
const GIB = 1024 ** 3 / 1e9;

export type UseCase = "chat" | "docs" | "agent";

export const USE_CASES: { id: UseCase; label: string; context: number; desc: string }[] = [
  { id: "chat", label: "대화", context: 8192, desc: "질문하고 답 받기" },
  { id: "docs", label: "긴 문서", context: 32768, desc: "문서·코드를 넣고 요약·분석" },
  { id: "agent", label: "에이전트", context: 65536, desc: "Hermes Agent처럼 도구를 쓰며 오래 일하기" },
];

export function pickUseCase(id: string | undefined): (typeof USE_CASES)[number] {
  return USE_CASES.find((u) => u.id === id) ?? USE_CASES[0];
}

/** KV 캐시(GB). 슬라이딩 윈도우 레이어는 window 토큰까지만 쌓인다 */
export function kvCacheGb(v: LocalVariant, context: number): number {
  let bytes = 0;
  for (const g of v.attention) {
    const tokens = g.window ? Math.min(context, g.window) : context;
    bytes += 2 * g.layers * g.kvHeads * g.headDim * tokens * KV_BYTES; // K와 V
  }
  return bytes / 1e9;
}

export function requiredGb(v: LocalVariant, context: number): number {
  return v.sizeGb + kvCacheGb(v, context) + RUNTIME_OVERHEAD_GB;
}

/** 그래픽카드(또는 맥 GPU 몫)에 올릴 수 있는 용량, 10^9 바이트 단위 */
export function capacityGb(c: Pick<VramClass, "memoryGb" | "kind">): number {
  const ratio = c.kind === "UNIFIED" ? UNIFIED_USABLE : VRAM_USABLE;
  return c.memoryGb * GIB * ratio;
}

export type Verdict =
  /** 그래픽카드에 다 들어간다 */
  | "fit"
  /** 일부를 CPU(시스템 RAM)로 넘겨서 돌아간다. 많이 느리다 */
  | "offload"
  /** 이 컴퓨터로는 어렵다 */
  | "no"
  /** 메모리 문제가 아니라 모델이 이 길이의 컨텍스트를 못 받는다 */
  | "short";

export interface Judgement {
  verdict: Verdict;
  requiredGb: number;
  capacityGb: number;
}

/**
 * 판정.
 *
 * ramGb(시스템 RAM)를 모르면 "offload"를 내지 않는다. 넘길 곳이 얼마나 있는지 모르는데
 * "느리지만 돌아가요"라고 하면 그건 추측이다. 맥은 통합 메모리라 넘길 곳이 따로 없다.
 */
export function judge(
  v: LocalVariant,
  c: Pick<VramClass, "memoryGb" | "kind">,
  context: number,
  ramGb?: number,
): Judgement {
  const need = requiredGb(v, context);
  const cap = capacityGb(c);
  if (context > v.maxContext) return { verdict: "short", requiredGb: need, capacityGb: cap };
  if (need <= cap) return { verdict: "fit", requiredGb: need, capacityGb: cap };
  if (c.kind === "DEDICATED" && ramGb && ramGb > OS_RESERVED_GB) {
    if (need <= cap + (ramGb - OS_RESERVED_GB)) {
      return { verdict: "offload", requiredGb: need, capacityGb: cap };
    }
  }
  return { verdict: "no", requiredGb: need, capacityGb: cap };
}

/** 이 등급에서 이 쓰임새로 쾌적하게 도는 가장 큰 모델(파라미터 기준). 없으면 undefined */
export function largestFit(
  c: VramClass,
  context: number,
  variants: LocalVariant[] = LOCAL_VARIANTS,
): LocalVariant | undefined {
  return variants
    .filter((v) => judge(v, c, context).verdict === "fit")
    .sort((a, b) => b.paramsB - a.paramsB)[0];
}

/**
 * 한 단계 위 등급에서 **새로** 쾌적해지는 모델.
 * 업그레이드를 고민하는 사람에게 "위로 가면 뭐가 되나"만 보여준다.
 */
export function unlockedByNext(
  c: VramClass,
  context: number,
  variants: LocalVariant[] = LOCAL_VARIANTS,
): { next: VramClass; models: LocalVariant[] } | undefined {
  const next = nextClass(c);
  if (!next) return undefined;
  const models = variants.filter(
    (v) =>
      judge(v, c, context).verdict !== "fit" && judge(v, next, context).verdict === "fit",
  );
  return { next, models };
}

/**
 * 이 모델을 이 쓰임새로 쾌적하게 돌리는 가장 작은 등급(같은 종류 안에서).
 * 맨 위 등급에도 안 들어가거나 컨텍스트가 짧으면 undefined.
 */
export function minimumClass(
  v: LocalVariant,
  context: number,
  kind: VramClass["kind"],
): VramClass | undefined {
  return VRAM_CLASSES.filter((c) => c.kind === kind).find(
    (c) => judge(v, c, context).verdict === "fit",
  );
}

/** 소수 첫째 자리까지. 화면 표기용 */
export function formatGb(gb: number): string {
  return `${gb.toFixed(1)}GB`;
}

export function formatParams(v: LocalVariant): string {
  const total = `${v.paramsB}B`;
  return v.activeParamsB ? `${total} (한 번에 ${v.activeParamsB}B)` : total;
}

export function formatContext(tokens: number): string {
  return tokens >= 1024 ? `${Math.round(tokens / 1024)}K` : String(tokens);
}
/* Footer: lib/local/vram.ts */
