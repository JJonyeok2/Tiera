/* ---------------------------------------------------------------------------
 * Header: 사용량 대시보드의 "브랜드" 단위. SPEC 26.3.
 *
 * 세 잣대가 세는 대상이 다르다 — 앱(ChatGPT 앱), 사이트(chatgpt.com),
 * API 개발사(openai). 한 줄로 묶는 단위를 브랜드로 두고, 매핑은 이 파일에서만 한다.
 * ------------------------------------------------------------------------- */

export interface Brand {
  key: string;
  /** 화면 표기 */
  name: string;
  /** 만든 회사. 화면 보조 표기 */
  company: string;
  /** 3강(ChatGPT·Gemini·Claude) — 어느 잣대에서든 항상 보여준다 */
  big3?: boolean;
  /** Tiera 도구 slug. 있으면 도구 상세로 연결한다 */
  toolSlug?: string;
  /** OpenRouter model_permaslug의 앞부분(개발사) */
  openrouterAuthors?: string[];
}

export const BRANDS: Brand[] = [
  { key: "chatgpt", name: "ChatGPT", company: "OpenAI", big3: true, toolSlug: "chatgpt", openrouterAuthors: ["openai"] },
  { key: "gemini", name: "Gemini", company: "Google", big3: true, toolSlug: "gemini", openrouterAuthors: ["google"] },
  { key: "claude", name: "Claude", company: "Anthropic", big3: true, toolSlug: "claude", openrouterAuthors: ["anthropic"] },
  { key: "deepseek", name: "DeepSeek", company: "DeepSeek", openrouterAuthors: ["deepseek"] },
  { key: "grok", name: "Grok", company: "xAI", openrouterAuthors: ["x-ai"] },
  { key: "copilot", name: "Copilot", company: "Microsoft", openrouterAuthors: ["microsoft"] },
  { key: "perplexity", name: "Perplexity", company: "Perplexity", toolSlug: "perplexity", openrouterAuthors: ["perplexity"] },
  { key: "qwen", name: "Qwen", company: "Alibaba", openrouterAuthors: ["qwen"] },
  { key: "glm", name: "GLM", company: "Z.ai", openrouterAuthors: ["z-ai"] },
  { key: "kimi", name: "Kimi", company: "Moonshot AI", openrouterAuthors: ["moonshotai"] },
  { key: "hunyuan", name: "Hunyuan", company: "Tencent", openrouterAuthors: ["tencent"] },
  { key: "llama", name: "Llama", company: "Meta", openrouterAuthors: ["meta-llama", "meta"] },
  { key: "mistral", name: "Mistral", company: "Mistral AI", openrouterAuthors: ["mistralai"] },
  { key: "minimax", name: "MiniMax", company: "MiniMax", openrouterAuthors: ["minimax"] },
];

export function getBrand(key: string): Brand | undefined {
  return BRANDS.find((b) => b.key === key);
}

/**
 * OpenRouter 개발사 이름 → 브랜드 key.
 * 표에 없는 개발사는 원래 이름을 그대로 쓴다. 모르는 개발사를 "기타"에 묻어 버리면
 * 새로 치고 올라온 회사가 화면에서 사라진다 — 그게 이 화면에서 제일 궁금한 정보다.
 */
export function brandKeyForAuthor(author: string): string {
  const a = author.toLowerCase();
  const b = BRANDS.find((x) => x.openrouterAuthors?.includes(a));
  return b ? b.key : a;
}

/** 브랜드 key → 화면 이름. 표에 없으면 받은 그대로 */
export function brandName(key: string): string {
  return getBrand(key)?.name ?? key;
}
/* Footer: lib/usage/brands.ts */
