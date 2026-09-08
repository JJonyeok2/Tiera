/* ---------------------------------------------------------------------------
 * Header: 개발사 → 국가 매핑 (수동 큐레이션)
 *
 * Artificial Analysis API는 개발사 이름은 주지만 국적은 주지 않는다.
 * Tiera는 미국·중국·한국만 다루므로(SPEC 13절 #7), 여기 등록된 개발사만
 * 수집 대상이 된다. 목록에 없는 개발사는 조용히 건너뛴다.
 *
 * 즉 "어떤 개발사를 실을지"는 우리가 고르고, "그 모델의 숫자"는 API가 준다.
 * 국적은 사람이 판단해야 하는 값이라 자동화하지 않는다.
 *
 * 키는 AA의 model_creator.slug 이며, 표기가 흔들릴 수 있어 이름도 함께 받는다.
 * ------------------------------------------------------------------------- */

import type { Country } from "@/db/schema";

export interface CuratedCreator {
  /** Tiera에서 쓸 표시 이름 */
  name: string;
  country: Country;
  siteUrl?: string;
}

/** AA creator slug(소문자) → 큐레이션 정보 */
export const CREATOR_BY_SLUG: Record<string, CuratedCreator> = {
  // --- 미국 ---
  anthropic: { name: "Anthropic", country: "US", siteUrl: "https://www.anthropic.com" },
  openai: { name: "OpenAI", country: "US", siteUrl: "https://openai.com" },
  google: { name: "Google", country: "US", siteUrl: "https://deepmind.google" },
  "google-deepmind": { name: "Google", country: "US", siteUrl: "https://deepmind.google" },
  xai: { name: "SpaceXAI", country: "US", siteUrl: "https://x.ai" },
  spacexai: { name: "SpaceXAI", country: "US", siteUrl: "https://x.ai" },
  meta: { name: "Meta", country: "US", siteUrl: "https://ai.meta.com" },
  microsoft: { name: "Microsoft", country: "US", siteUrl: "https://azure.microsoft.com" },
  amazon: { name: "Amazon", country: "US", siteUrl: "https://aws.amazon.com/bedrock" },
  nvidia: { name: "NVIDIA", country: "US", siteUrl: "https://www.nvidia.com" },
  "allen-institute-for-ai": { name: "Ai2", country: "US", siteUrl: "https://allenai.org" },
  ai2: { name: "Ai2", country: "US", siteUrl: "https://allenai.org" },
  reka: { name: "Reka AI", country: "US", siteUrl: "https://www.reka.ai" },

  // --- 중국 ---
  deepseek: { name: "DeepSeek", country: "CN", siteUrl: "https://www.deepseek.com" },
  "moonshot-ai": { name: "Moonshot AI", country: "CN", siteUrl: "https://www.moonshot.cn" },
  moonshot: { name: "Moonshot AI", country: "CN", siteUrl: "https://www.moonshot.cn" },
  kimi: { name: "Moonshot AI", country: "CN", siteUrl: "https://www.moonshot.cn" },
  alibaba: { name: "Alibaba", country: "CN", siteUrl: "https://qwen.ai" },
  qwen: { name: "Alibaba", country: "CN", siteUrl: "https://qwen.ai" },
  zhipu: { name: "Z.ai", country: "CN", siteUrl: "https://z.ai" },
  "zhipu-ai": { name: "Z.ai", country: "CN", siteUrl: "https://z.ai" },
  "z-ai": { name: "Z.ai", country: "CN", siteUrl: "https://z.ai" },
  zai: { name: "Z.ai", country: "CN", siteUrl: "https://z.ai" },
  minimax: { name: "MiniMax", country: "CN", siteUrl: "https://www.minimaxi.com" },
  "01-ai": { name: "01.AI", country: "CN", siteUrl: "https://www.01.ai" },
  tencent: { name: "Tencent", country: "CN", siteUrl: "https://hunyuan.tencent.com" },
  baidu: { name: "Baidu", country: "CN", siteUrl: "https://yiyan.baidu.com" },
  bytedance: { name: "ByteDance", country: "CN", siteUrl: "https://www.volcengine.com" },
  stepfun: { name: "StepFun", country: "CN", siteUrl: "https://www.stepfun.com" },

  // --- 한국 ---
  upstage: { name: "Upstage", country: "KR", siteUrl: "https://www.upstage.ai" },
  "lg-ai-research": { name: "LG AI Research", country: "KR", siteUrl: "https://www.lgresearch.ai" },
  lg: { name: "LG AI Research", country: "KR", siteUrl: "https://www.lgresearch.ai" },
  exaone: { name: "LG AI Research", country: "KR", siteUrl: "https://www.lgresearch.ai" },
  naver: { name: "Naver Cloud", country: "KR", siteUrl: "https://clova.ai" },
  "naver-cloud": { name: "Naver Cloud", country: "KR", siteUrl: "https://clova.ai" },
  ncsoft: { name: "NCSOFT", country: "KR", siteUrl: "https://varco.ai" },
  kakao: { name: "Kakao", country: "KR", siteUrl: "https://kakaocorp.com" },
};

/** 슬러그가 안 맞을 때를 대비한 이름 기반 보조 매칭 */
const NAME_FALLBACK: [RegExp, string][] = [
  [/anthropic/i, "anthropic"],
  [/openai/i, "openai"],
  [/google|deepmind/i, "google"],
  [/xai|spacex/i, "xai"],
  [/^meta\b/i, "meta"],
  [/deepseek/i, "deepseek"],
  [/moonshot|kimi/i, "moonshot-ai"],
  [/alibaba|qwen/i, "alibaba"],
  [/zhipu|z\.?ai/i, "zhipu"],
  [/minimax/i, "minimax"],
  [/upstage|solar/i, "upstage"],
  [/lg ai|exaone/i, "lg-ai-research"],
  [/naver|clova/i, "naver"],
];

export function lookupCreator(slug: string, name: string): CuratedCreator | undefined {
  const direct = CREATOR_BY_SLUG[slug.toLowerCase()];
  if (direct) return direct;
  for (const [re, key] of NAME_FALLBACK) {
    if (re.test(name) || re.test(slug)) return CREATOR_BY_SLUG[key];
  }
  return undefined;
}
/* Footer: lib/data-sources/creator-country.ts */
