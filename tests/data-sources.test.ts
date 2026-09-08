/* Header: Artificial Analysis 응답 → Tiera 형태 변환 테스트.
   네트워크 없이 순수 변환 로직만 검증한다. */
import { describe, expect, it } from "vitest";
import { transform, AA_BENCHMARKS } from "@/lib/data-sources/artificial-analysis";
import { lookupCreator } from "@/lib/data-sources/creator-country";

const AT = new Date("2026-09-08");

const raw = {
  status: 200,
  data: [
    {
      id: "1", name: "Claude Fable 5.1", slug: "claude-fable-5-1",
      model_creator: { id: "a", name: "Anthropic", slug: "anthropic" },
      evaluations: {
        artificial_analysis_intelligence_index: 57,
        artificial_analysis_coding_index: 61,
        gpqa: 91.2,
        mmlu_pro: null,          // 측정 안 됨
        livecodebench: undefined // 측정 안 됨
      },
      pricing: { price_1m_input_tokens: 10, price_1m_output_tokens: 50 },
    },
    {
      id: "2", name: "Mistral Large 3", slug: "mistral-large-3",
      model_creator: { id: "m", name: "Mistral", slug: "mistral" }, // 유럽 → 제외
      evaluations: { artificial_analysis_intelligence_index: 40 },
      pricing: { price_1m_input_tokens: 2, price_1m_output_tokens: 6 },
    },
    {
      id: "3", name: "Solar Pro 4", slug: "solar-pro-4",
      model_creator: { id: "u", name: "Upstage", slug: "upstage" },
      evaluations: { artificial_analysis_intelligence_index: 42 },
      pricing: { price_1m_input_tokens: 0.3, price_1m_output_tokens: 1.2 },
    },
  ],
};

describe("transform", () => {
  const out = transform(raw, AT);

  it("미국·중국·한국 개발사만 남긴다", () => {
    expect(out.models.map((m) => m.slug)).toEqual(["claude-fable-5-1", "solar-pro-4"]);
  });

  it("수록 대상이 아닌 개발사는 보고해 준다 (큐레이션 목록 확장용)", () => {
    expect(out.skippedCreators).toContain("Mistral");
  });

  it("국가를 큐레이션 목록에서 가져온다", () => {
    expect(out.models[0].creator.country).toBe("US");
    expect(out.models[1].creator.country).toBe("KR");
  });

  it("가격을 소수 4자리 문자열로 정규화한다", () => {
    expect(out.models[1].inputPricePerM).toBe("0.3000");
    expect(out.models[1].outputPricePerM).toBe("1.2000");
  });

  it("측정되지 않은 지표는 0으로 채우지 않고 아예 뺀다", () => {
    // null/undefined를 0으로 넣으면 "실제로 0점"과 구분이 안 된다.
    const claudeSlugs = out.results
      .filter((r) => r.modelSlug === "claude-fable-5-1")
      .map((r) => r.benchmarkSlug)
      .sort();
    expect(claudeSlugs).toEqual(["aa-coding-index", "aa-intelligence-index", "gpqa-diamond"]);
    expect(claudeSlugs).not.toContain("mmlu-pro");
    expect(claudeSlugs).not.toContain("livecodebench");
  });

  it("측정값에 출처 링크를 붙인다 (AA 약관상 출처 표기 필수)", () => {
    expect(out.results[0].sourceUrl).toContain("artificialanalysis.ai");
  });

  it("빈 응답에도 터지지 않는다", () => {
    expect(transform({}, AT).models).toEqual([]);
    expect(transform({ data: [] }, AT).results).toEqual([]);
  });
});

describe("lookupCreator", () => {
  it("슬러그로 찾는다", () => {
    expect(lookupCreator("deepseek", "DeepSeek")?.country).toBe("CN");
  });
  it("슬러그가 달라도 이름으로 보조 매칭한다", () => {
    expect(lookupCreator("unknown-slug", "LG AI Research")?.country).toBe("KR");
    expect(lookupCreator("google-deepmind-2", "Google DeepMind")?.country).toBe("US");
  });
  it("목록에 없으면 undefined", () => {
    expect(lookupCreator("cohere", "Cohere")).toBeUndefined();
  });
});

describe("AA_BENCHMARKS", () => {
  it("슬러그가 중복되지 않는다", () => {
    const slugs = AA_BENCHMARKS.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("전부 출처가 표기돼 있다", () => {
    for (const b of AA_BENCHMARKS) {
      expect(b.sourceName).toBe("Artificial Analysis");
      expect(b.sourceUrl).toContain("artificialanalysis.ai");
    }
  });
});

describe("변형 통합", () => {
  it("추론 강도 변형을 모델 하나로 접고, 가장 높은 설정을 대표로 쓴다", () => {
    const variants = {
      data: [
        { id:"a", name:"Claude Fable 5.1 (Adaptive Reasoning, Low Effort)", slug:"cf-low",
          model_creator:{name:"Anthropic",slug:"anthropic"},
          evaluations:{artificial_analysis_intelligence_index:48, gpqa:80} },
        { id:"b", name:"Claude Fable 5.1 (Adaptive Reasoning, Max Effort)", slug:"cf-max",
          model_creator:{name:"Anthropic",slug:"anthropic"},
          evaluations:{artificial_analysis_intelligence_index:57, gpqa:91} },
        { id:"c", name:"Claude Fable 5.1 (Adaptive Reasoning, High Effort)", slug:"cf-high",
          model_creator:{name:"Anthropic",slug:"anthropic"},
          evaluations:{artificial_analysis_intelligence_index:54, gpqa:87} },
      ],
    };
    const out = transform(variants, AT);
    expect(out.models).toHaveLength(1);
    expect(out.models[0].name).toBe("Claude Fable 5.1"); // 괄호가 떨어진 깔끔한 이름
    expect(out.models[0].slug).toBe("claude-fable-5-1");
    expect(out.models[0].variantLabel).toContain("Max Effort");
    // 채택된 설정의 값만 들어간다
    expect(out.results.find((r) => r.benchmarkSlug === "gpqa-diamond")?.value).toBe(91);
  });

  it("같은 이름이라도 개발사가 다르면 따로 센다", () => {
    const out = transform({ data: [
      { id:"1", name:"Nova (max)", slug:"n1", model_creator:{name:"OpenAI",slug:"openai"},
        evaluations:{artificial_analysis_intelligence_index:50} },
      { id:"2", name:"Nova (max)", slug:"n2", model_creator:{name:"Upstage",slug:"upstage"},
        evaluations:{artificial_analysis_intelligence_index:40} },
    ]}, AT);
    expect(out.models).toHaveLength(2);
  });

  it("괄호가 없는 이름은 그대로 둔다", () => {
    const out = transform({ data: [
      { id:"1", name:"Solar Pro 4", slug:"sp4", model_creator:{name:"Upstage",slug:"upstage"},
        evaluations:{artificial_analysis_intelligence_index:42} },
    ]}, AT);
    expect(out.models[0].name).toBe("Solar Pro 4");
    expect(out.models[0].variantLabel).toBeNull();
  });
});
/* Footer: tests/data-sources.test.ts */
