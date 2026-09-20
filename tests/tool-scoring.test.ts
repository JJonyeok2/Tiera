/* ---------------------------------------------------------------------------
 * Header: 도구 점수 규칙 테스트.
 *
 * recomputeToolScores는 DB를 쓰므로 여기서는 그 안에서 쓰는 **순수 규칙**을
 * 고정한다. 값이 틀려도 에러가 안 나는 종류라 테스트가 유일한 방어선이다.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from "vitest";
import {
  TOOL_AXES,
  TOOL_AXIS_WEIGHT,
  TOOL_CONFIDENCE_M,
  TOOL_MIN_REVIEWS_FOR_TIER,
  CONFIDENCE_M,
} from "@/lib/scoring/constants";
import { bayesian, toHundred, tierOf } from "@/lib/scoring/score";
import { TOOL_AXIS_VALUES, toolReviewInputSchema } from "@/lib/validation";
import { TOOL_AXIS_LABEL, TOOL_AXIS_QUESTION } from "@/lib/labels";

describe("도구 4축", () => {
  it("상수·검증·라벨이 같은 축 집합을 쓴다", () => {
    // 세 곳이 갈라지면 폼에는 있는데 저장이 거부되는 축이 생긴다.
    expect([...TOOL_AXES].sort()).toEqual([...TOOL_AXIS_VALUES].sort());
    for (const a of TOOL_AXES) {
      expect(TOOL_AXIS_LABEL[a], a).toBeTruthy();
      expect(TOOL_AXIS_QUESTION[a], a).toBeTruthy();
      expect(TOOL_AXIS_WEIGHT[a], a).toBeGreaterThan(0);
    }
  });

  it("가중치가 전부 같다 — 근거 없는 편집자 취향을 점수에 섞지 않는다", () => {
    const ws = TOOL_AXES.map((a) => TOOL_AXIS_WEIGHT[a]);
    expect(new Set(ws).size).toBe(1);
  });

  it("가중치 합이 1이다", () => {
    const sum = TOOL_AXES.reduce((n, a) => n + TOOL_AXIS_WEIGHT[a], 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("도구 베이지안 보정", () => {
  it("도구 임계값이 모델보다 낮다", () => {
    // 도구는 37개, 모델은 302개다. 같은 m이면 도구 점수가 전부 전체 평균에
    // 붙어버려 순위가 아무것도 구분하지 못한다.
    expect(TOOL_CONFIDENCE_M).toBeLessThan(CONFIDENCE_M);
    expect(TOOL_CONFIDENCE_M).toBeGreaterThan(0);
  });

  it("후기 3개짜리 만점은 1위를 먹지 못한다", () => {
    // 이 보정이 존재하는 이유 그 자체다.
    const globalMean = 60;
    const newbie = bayesian(toHundred(5), 3, globalMean, TOOL_CONFIDENCE_M);
    const established = bayesian(toHundred(4.3), 80, globalMean, TOOL_CONFIDENCE_M);
    expect(newbie).toBeLessThan(established);
  });

  it("표본이 커지면 실제 평균에 수렴한다", () => {
    const raw = toHundred(4.5);
    const far = bayesian(raw, 5, 60, TOOL_CONFIDENCE_M);
    const near = bayesian(raw, 500, 60, TOOL_CONFIDENCE_M);
    expect(Math.abs(near - raw)).toBeLessThan(Math.abs(far - raw));
  });

  it("표본이 0이면 전체 평균을 그대로 쓴다", () => {
    expect(bayesian(100, 0, 62, TOOL_CONFIDENCE_M)).toBe(62);
  });

  it("후기가 사이트에 하나뿐이면 보정이 아무것도 못 한다 — 그래서 표시 임계가 따로 필요하다", () => {
    // 전체 평균 C가 그 한 명으로 만들어지므로 보정 후 값이 원점수와 같아진다.
    // 수식은 맞는데 결과가 의미가 없다. 실제로 화면에서 이걸 보고 잡았다.
    const only = toHundred(4);
    expect(bayesian(only, 1, only, TOOL_CONFIDENCE_M)).toBeCloseTo(only, 10);
    expect(TOOL_MIN_REVIEWS_FOR_TIER).toBeGreaterThan(1);
  });

  it("5점 만점 환산 밴드가 모델과 같다 (1점=20, 5점=100)", () => {
    // 두 점수를 같은 티어 기준으로 재려면 밴드가 같아야 한다.
    expect(toHundred(1)).toBe(20);
    expect(toHundred(5)).toBe(100);
    expect(tierOf(toHundred(5))).toBe("PRISM");
  });
});

describe("도구 후기 입력 검증", () => {
  it("빈 평가는 거부한다", () => {
    expect(toolReviewInputSchema.safeParse({ ratings: [] }).success).toBe(false);
  });

  it("같은 축을 두 번 보내면 거부한다", () => {
    const r = toolReviewInputSchema.safeParse({
      ratings: [
        { axis: "EASE", score: 5 },
        { axis: "EASE", score: 1 },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("모델 축(CODING)은 도구 후기로 들어오지 못한다", () => {
    // 두 스키마를 합치지 않은 이유가 이것이다.
    const r = toolReviewInputSchema.safeParse({ ratings: [{ axis: "CODING", score: 5 }] });
    expect(r.success).toBe(false);
  });

  it("범위를 벗어난 점수는 거부한다", () => {
    expect(toolReviewInputSchema.safeParse({ ratings: [{ axis: "EASE", score: 0 }] }).success).toBe(false);
    expect(toolReviewInputSchema.safeParse({ ratings: [{ axis: "EASE", score: 6 }] }).success).toBe(false);
    expect(toolReviewInputSchema.safeParse({ ratings: [{ axis: "EASE", score: 3.5 }] }).success).toBe(false);
  });

  it("한 축만 평가해도 통과한다 — 안 써본 축을 억지로 매기게 하지 않는다", () => {
    const r = toolReviewInputSchema.safeParse({ ratings: [{ axis: "KOREAN", score: 4 }] });
    expect(r.success).toBe(true);
  });

  it("빈 한줄평은 null로 정규화된다", () => {
    const r = toolReviewInputSchema.parse({ ratings: [{ axis: "EASE", score: 4 }], comment: "   " });
    expect(r.comment).toBeNull();
  });

  it("500자를 넘는 한줄평은 거부한다", () => {
    const r = toolReviewInputSchema.safeParse({
      ratings: [{ axis: "EASE", score: 4 }],
      comment: "가".repeat(501),
    });
    expect(r.success).toBe(false);
  });
});
/* Footer: tests/tool-scoring.test.ts */
