/* Header: 스코어링 엔진 단위 테스트 — SPEC 5절의 각 단계를 하나씩 검증한다. */
import { describe, expect, it } from "vitest";
import {
  bayesian,
  gapOf,
  normalize,
  normalizeWithRange,
  overallFrom,
  tierOf,
  toHundred,
  weightedMean,
} from "@/lib/scoring/score";
import { BENCH_FLOOR, CONFIDENCE_M } from "@/lib/scoring/constants";

describe("toHundred", () => {
  it("5점 만점을 100점으로, 1점을 20점으로 환산한다", () => {
    expect(toHundred(5)).toBe(100);
    expect(toHundred(1)).toBe(20);
    expect(toHundred(4.4)).toBeCloseTo(88);
  });
});

describe("bayesian", () => {
  it("평가가 없으면 전체 평균을 그대로 준다", () => {
    expect(bayesian(100, 0, 72)).toBe(72);
  });

  it("리뷰 3개짜리 만점 모델이 1위를 먹지 못하게 끌어내린다", () => {
    const newcomer = bayesian(100, 3, 72);
    const established = bayesian(88, 2000, 72);
    expect(newcomer).toBeLessThan(established);
  });

  it("평가 수가 m과 같으면 원점수와 전체 평균의 정확한 중간이 된다", () => {
    expect(bayesian(90, CONFIDENCE_M, 70)).toBeCloseTo(80);
  });

  it("평가가 많이 쌓이면 원점수에 수렴한다", () => {
    expect(bayesian(88, 100000, 50)).toBeCloseTo(88, 1);
  });
});

describe("overallFrom", () => {
  it("가중치대로 섞는다 (코딩·추론 0.3 / 글쓰기·멀티모달 0.2)", () => {
    const v = overallFrom({ CODING: 90, REASONING: 90, WRITING: 80, MULTIMODAL: 80 });
    // 0.3·90 + 0.3·90 + 0.2·80 + 0.2·80 = 86
    expect(v).toBeCloseTo(86);
  });

  it("평가가 없는 카테고리는 가중치에서 통째로 빠진다 — 종합이 깎이면 안 된다", () => {
    // 멀티모달을 아무도 평가하지 않았다고 종합이 내려가면 안 된다.
    expect(overallFrom({ CODING: 90, REASONING: 90, WRITING: 90 })).toBeCloseTo(90);
  });

  it("아무 카테고리도 없으면 null", () => {
    expect(overallFrom({})).toBeNull();
  });
});

describe("normalize", () => {
  const values = [40, 60, 80, 100];

  it("커뮤니티 점수와 같은 20~100 밴드에 올린다", () => {
    // 두 점수를 나란히 비교하는 게 이 서비스의 핵심이라 축의 바닥을 맞춰야 한다.
    expect(normalize(40, { values, higherIsBetter: true })).toBe(BENCH_FLOOR);
    expect(normalize(100, { values, higherIsBetter: true })).toBe(100);
    expect(normalize(70, { values, higherIsBetter: true })).toBe(60);
  });

  it("낮을수록 좋은 지표는 뒤집는다", () => {
    expect(normalize(40, { values, higherIsBetter: false })).toBe(100);
    expect(normalize(100, { values, higherIsBetter: false })).toBe(BENCH_FLOOR);
  });

  it("표본이 3개 미만이면 정규화하지 않는다", () => {
    expect(normalize(1, { values: [1, 2], higherIsBetter: true })).toBeNull();
  });

  it("모든 값이 같으면 0으로 나누게 되므로 null", () => {
    expect(normalize(5, { values: [5, 5, 5], higherIsBetter: true })).toBeNull();
  });
});

describe("weightedMean", () => {
  it("가중 평균을 낸다", () => {
    expect(weightedMean([{ value: 100, weight: 3 }, { value: 50, weight: 1 }])).toBeCloseTo(87.5);
  });
  it("비어 있으면 null", () => {
    expect(weightedMean([])).toBeNull();
  });
});

describe("tierOf", () => {
  it("SPEC 4절 컷을 그대로 따른다", () => {
    expect(tierOf(94)).toBe("PRISM");
    expect(tierOf(90)).toBe("PRISM");
    expect(tierOf(89.9)).toBe("GOLD");
    expect(tierOf(80)).toBe("GOLD");
    expect(tierOf(79.9)).toBe("SILVER");
    expect(tierOf(65)).toBe("SILVER");
    expect(tierOf(64.9)).toBe("BRONZE");
    expect(tierOf(0)).toBe("BRONZE");
  });
});

describe("gapOf", () => {
  // 인자는 (커뮤니티 순위, 벤치마크 순위). 순위는 1이 가장 높다.
  it("벤치마크 순위보다 커뮤니티 순위가 3계단 이상 높으면 체감 우위", () => {
    expect(gapOf(4, 9)?.verdict).toBe("FEEL_BETTER");
  });
  it("커뮤니티 순위가 3계단 이상 낮으면 스펙 우위", () => {
    expect(gapOf(9, 4)?.verdict).toBe("SPEC_BETTER");
  });
  it("경계값 3계단은 괴리로 본다", () => {
    expect(gapOf(1, 4)?.verdict).toBe("FEEL_BETTER");
    expect(gapOf(4, 1)?.verdict).toBe("SPEC_BETTER");
  });
  it("순위가 비슷하면 일치", () => {
    expect(gapOf(3, 5)?.verdict).toBe("ALIGNED");
  });
  it("한쪽 순위가 없으면 비교 자체가 성립하지 않는다", () => {
    expect(gapOf(3, null)).toBeNull();
    expect(gapOf(null, 3)).toBeNull();
  });
  it("점수 척도가 달라도 판정이 흔들리지 않는다", () => {
    // 예전 설계(점수 차 판정)에서는 min-max 때문에 하위권 모델이 항상 큰 괴리로 잡혔다.
    // 순위 기준이면 그런 착시가 생기지 않는다.
    expect(gapOf(15, 15)?.verdict).toBe("ALIGNED");
  });
});

describe("normalizeWithRange", () => {
  it("normalize와 같은 결과를 낸다 (SQL 집계값을 그대로 받는 경로)", () => {
    const values = [40, 60, 80, 100];
    expect(normalizeWithRange(70, { min: 40, max: 100, count: 4, higherIsBetter: true })).toBe(
      normalize(70, { values, higherIsBetter: true })
    );
  });
  it("표본이 부족하면 null", () => {
    expect(normalizeWithRange(70, { min: 40, max: 100, count: 2, higherIsBetter: true })).toBeNull();
  });
});
/* Footer: tests/scoring.test.ts */
