/* Header: 로컬 모델 메모리 계산 단위 테스트 — SPEC 25.4 */
import { describe, expect, it } from "vitest";
import {
  GPUS,
  LOCAL_VARIANTS,
  VRAM_CLASSES,
  classForMemory,
  getVramClass,
  gpuClass,
  type LocalVariant,
} from "@/lib/local/data";
import {
  RUNTIME_OVERHEAD_GB,
  capacityGb,
  judge,
  kvCacheGb,
  largestFit,
  minimumClass,
  requiredGb,
  unlockedByNext,
} from "@/lib/local/vram";

const byId = (id: string) => {
  const v = LOCAL_VARIANTS.find((x) => x.id === id);
  if (!v) throw new Error(`no variant ${id}`);
  return v;
};
const cls = (slug: string) => {
  const c = getVramClass(slug);
  if (!c) throw new Error(`no class ${slug}`);
  return c;
};

describe("kvCacheGb", () => {
  it("전체 어텐션 모델은 컨텍스트에 비례한다", () => {
    const v = byId("qwen3-8b"); // 36층 × KV 8헤드 × 128
    // 2(K,V) × 36 × 8 × 128 × 8192 × 2바이트 = 1.208e9
    expect(kvCacheGb(v, 8192)).toBeCloseTo(1.208, 2);
    expect(kvCacheGb(v, 16384)).toBeCloseTo(kvCacheGb(v, 8192) * 2, 6);
  });

  it("슬라이딩 윈도우 레이어는 윈도우 이상 쌓이지 않는다", () => {
    const v = byId("gemma3-12b");
    const sliding = v.attention.find((g) => g.window);
    expect(sliding).toBeDefined();
    // 윈도우 밖으로 늘어나는 건 전체 어텐션 레이어 몫뿐이다
    const full = v.attention.filter((g) => !g.window);
    const perToken = full.reduce((s, g) => s + 2 * g.layers * g.kvHeads * g.headDim * 2, 0) / 1e9;
    expect(kvCacheGb(v, 65536) - kvCacheGb(v, 32768)).toBeCloseTo(perToken * 32768, 6);
  });

  it("같은 컨텍스트에서 윈도우 구조가 전체 어텐션보다 훨씬 작다", () => {
    // 레이어를 전부 전체 어텐션으로 계산하면 긴 컨텍스트에서 몇 배로 부풀려진다.
    // 이 차이를 무시하면 Gemma가 실제로는 되는 카드에서 "어려워요"로 나온다.
    const v = byId("gemma3-12b");
    const naive: LocalVariant = {
      ...v,
      attention: [{ layers: 48, kvHeads: 8, headDim: 256 }],
    };
    expect(kvCacheGb(naive, 65536)).toBeGreaterThan(kvCacheGb(v, 65536) * 4);
  });
});

describe("requiredGb", () => {
  it("가중치 + KV + 오버헤드", () => {
    const v = byId("qwen3-8b");
    expect(requiredGb(v, 8192)).toBeCloseTo(v.sizeGb + kvCacheGb(v, 8192) + RUNTIME_OVERHEAD_GB, 6);
  });

  it("MoE는 활성 파라미터가 아니라 전체 파일 크기로 계산한다", () => {
    // 30B-A3B를 3B급으로 보면 8GB 카드에 들어간다는 거짓말이 된다.
    const moe = byId("qwen3-30b-a3b");
    expect(moe.activeParamsB).toBe(3);
    expect(requiredGb(moe, 8192)).toBeGreaterThan(moe.sizeGb);
    expect(judge(moe, cls("8gb"), 8192).verdict).toBe("no");
  });
});

describe("capacityGb", () => {
  it("그래픽카드는 GiB 표기를 10^9 바이트로 바꾸고 90%만 쓴다", () => {
    expect(capacityGb({ memoryGb: 8, kind: "DEDICATED" })).toBeCloseTo(8 * 1.073741824 * 0.9, 6);
  });
  it("맥 통합 메모리는 70%만 GPU 몫으로 본다", () => {
    expect(capacityGb({ memoryGb: 16, kind: "UNIFIED" })).toBeCloseTo(16 * 1.073741824 * 0.7, 6);
  });
});

describe("judge", () => {
  it("8GB 카드에서 Qwen3 8B 대화는 쾌적하다", () => {
    expect(judge(byId("qwen3-8b"), cls("8gb"), 8192).verdict).toBe("fit");
  });

  it("모델이 받을 수 있는 컨텍스트보다 길면 메모리와 상관없이 short", () => {
    // qwen3:8b 태그는 최대 40K라 에이전트용(64K)은 32GB 카드여도 안 된다
    expect(judge(byId("qwen3-8b"), cls("32gb"), 65536).verdict).toBe("short");
  });

  it("시스템 RAM을 모르면 offload를 내지 않는다", () => {
    const v = byId("qwen3-14b");
    expect(judge(v, cls("8gb"), 8192).verdict).toBe("no");
  });

  it("시스템 RAM이 넉넉하면 offload", () => {
    expect(judge(byId("qwen3-14b"), cls("8gb"), 8192, 32).verdict).toBe("offload");
  });

  it("시스템 RAM이 운영체제 몫 이하면 offload가 아니다", () => {
    expect(judge(byId("qwen3-14b"), cls("8gb"), 8192, 4).verdict).toBe("no");
  });

  it("맥은 넘길 곳이 따로 없어 offload가 없다", () => {
    expect(judge(byId("gpt-oss-120b"), cls("mac-16gb"), 8192, 64).verdict).toBe("no");
  });
});

describe("등급", () => {
  it("경계에 걸리는 용량은 아래 등급으로 간다", () => {
    expect(classForMemory(10, "DEDICATED")?.slug).toBe("8gb");
    expect(classForMemory(11, "DEDICATED")?.slug).toBe("8gb");
    expect(classForMemory(20, "DEDICATED")?.slug).toBe("16gb");
    expect(classForMemory(48, "DEDICATED")?.slug).toBe("32gb");
  });

  it("가장 작은 등급보다 작으면 등급이 없다", () => {
    expect(classForMemory(4, "DEDICATED")).toBeUndefined();
  });

  it("모든 카드가 어떤 등급에든 들어간다", () => {
    for (const g of GPUS) expect(gpuClass(g), g.name).toBeDefined();
  });

  it("카드 slug와 등급 slug가 겹치지 않는다", () => {
    const slugs = new Set(VRAM_CLASSES.map((c) => c.slug));
    for (const g of GPUS) expect(slugs.has(g.slug)).toBe(false);
  });
});

describe("등급 요약", () => {
  it("위 등급일수록 대화용 가장 큰 모델이 같거나 커진다", () => {
    const dedicated = VRAM_CLASSES.filter((c) => c.kind === "DEDICATED");
    let prev = 0;
    for (const c of dedicated) {
      const p = largestFit(c, 8192)?.paramsB ?? 0;
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it("한 단계 위 안내에는 이 등급에서 이미 되는 모델이 없다", () => {
    const c = cls("8gb");
    const up = unlockedByNext(c, 8192);
    expect(up?.next.slug).toBe("12gb");
    for (const v of up?.models ?? []) {
      expect(judge(v, c, 8192).verdict).not.toBe("fit");
      expect(judge(v, up!.next, 8192).verdict).toBe("fit");
    }
  });

  it("맨 위 등급에는 한 단계 위가 없다", () => {
    expect(unlockedByNext(cls("32gb"), 8192)).toBeUndefined();
  });

  it("minimumClass는 쾌적하게 도는 가장 작은 등급", () => {
    const v = byId("qwen3-8b");
    expect(minimumClass(v, 8192, "DEDICATED")?.slug).toBe("8gb");
    expect(minimumClass(v, 65536, "DEDICATED")).toBeUndefined(); // 컨텍스트가 짧다
  });
});

describe("데이터 무결성", () => {
  it("id와 태그가 겹치지 않는다", () => {
    const ids = LOCAL_VARIANTS.map((v) => v.id);
    const tags = LOCAL_VARIANTS.map((v) => v.ollamaTag);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it("모든 변형에 출처가 있고 구조 값이 양수다", () => {
    for (const v of LOCAL_VARIANTS) {
      expect(v.sources.length, v.id).toBeGreaterThan(0);
      expect(v.sizeGb, v.id).toBeGreaterThan(0);
      expect(v.attention.length, v.id).toBeGreaterThan(0);
      for (const g of v.attention) {
        expect(g.layers * g.kvHeads * g.headDim, v.id).toBeGreaterThan(0);
      }
    }
  });

  it("MoE의 활성 파라미터는 전체보다 작다", () => {
    for (const v of LOCAL_VARIANTS) {
      if (v.activeParamsB) expect(v.activeParamsB, v.id).toBeLessThan(v.paramsB);
    }
  });
});
/* Footer: tests/local-vram.test.ts */
