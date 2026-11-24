/* ---------------------------------------------------------------------------
 * Header: OpenRouter rankings-daily 어댑터 — 잣대 C(개발자 API 사용량). SPEC 26.
 *
 * GET https://openrouter.ai/api/v1/datasets/rankings-daily?start_date=&end_date=
 *   - OpenRouter API 키 필요(Bearer). 분당 30회, 하루 500회.
 *   - 응답: { data: [{ date, model_permaslug, total_tokens(string) }], meta: { as_of, ... } }
 *   - 날마다 상위 50개 모델 + 나머지 합계 한 줄(model_permaslug = "other").
 *   - CC BY 4.0. 재게시할 때 "Source: OpenRouter (openrouter.ai/rankings), as of <as_of>." 표기.
 *
 * 수집 / 집계 / 표시를 나눈다(SPEC 10 원칙).
 *   fetchRankingsDaily  — 수집. 응답을 검증만 하고 그대로 돌려준다
 *   aggregateByAuthor   — 집계. 모델 줄을 개발사 단위 일별 합계로 접는다(순수 함수)
 *   lib/usage/*         — 표시용 점유율 계산
 *
 * 한계(화면에 반드시 적는다): OpenRouter를 거친 요청만 센다. 시장 전체도, 각 회사
 * 자체 API 사용량도 아니다. 토큰 수는 채택도이지 품질 순위가 아니다.
 * ------------------------------------------------------------------------- */

const ENDPOINT = "https://openrouter.ai/api/v1/datasets/rankings-daily";
const FETCH_TIMEOUT_MS = 20_000;

export interface RankingRow {
  date: string;
  modelPermaslug: string;
  tokens: number;
}

export interface RankingsResponse {
  rows: RankingRow[];
  asOf: string;
}

export const OTHER = "other";

/** "openai/gpt-6-luna-20261001" → "openai". "other"는 그대로 */
export function authorOf(permaslug: string): string {
  if (permaslug === OTHER) return OTHER;
  const i = permaslug.indexOf("/");
  return (i > 0 ? permaslug.slice(0, i) : permaslug).toLowerCase();
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 응답 검증. 모양이 다르면 던진다 — 반쯤 맞는 데이터를 저장하면 점유율이 조용히
 * 틀어지고, 틀어진 걸 아무도 모른다. 실패하면 크론이 아무것도 쓰지 않는다.
 */
export function parseRankings(json: unknown): RankingsResponse {
  if (!json || typeof json !== "object") throw new Error("openrouter: 응답이 객체가 아님");
  const { data, meta } = json as { data?: unknown; meta?: { as_of?: unknown } };
  if (!Array.isArray(data)) throw new Error("openrouter: data 배열 없음");
  const asOf = typeof meta?.as_of === "string" ? meta.as_of : "";
  const rows: RankingRow[] = data.map((r, i) => {
    const row = r as { date?: unknown; model_permaslug?: unknown; total_tokens?: unknown };
    if (typeof row.date !== "string" || !DATE_RE.test(row.date)) {
      throw new Error(`openrouter: ${i}번째 줄 date 형식 오류`);
    }
    if (typeof row.model_permaslug !== "string" || !row.model_permaslug) {
      throw new Error(`openrouter: ${i}번째 줄 model_permaslug 없음`);
    }
    // total_tokens는 64비트 값이 잘리지 않게 문자열로 온다. 개발사·날짜 합계는
    // Number.MAX_SAFE_INTEGER(약 9천조) 안에 들어온다.
    const tokens = Number(row.total_tokens);
    if (!Number.isFinite(tokens) || tokens < 0) {
      throw new Error(`openrouter: ${i}번째 줄 total_tokens 오류`);
    }
    return { date: row.date, modelPermaslug: row.model_permaslug, tokens };
  });
  return { rows, asOf };
}

export async function fetchRankingsDaily(
  apiKey: string,
  range: { start: string; end?: string },
): Promise<RankingsResponse> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("start_date", range.start);
  if (range.end) url.searchParams.set("end_date", range.end);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    // 본문은 로그에만. 키가 섞여 나올 일은 없지만 화면·응답으로 내보낼 이유도 없다.
    throw new Error(`openrouter: HTTP ${res.status}`);
  }
  return parseRankings(await res.json());
}

export interface AuthorDay {
  date: string;
  author: string;
  tokens: number;
}

/** 모델 줄을 (날짜, 개발사) 합계로 접는다 */
export function aggregateByAuthor(rows: RankingRow[]): AuthorDay[] {
  const acc = new Map<string, AuthorDay>();
  for (const r of rows) {
    const author = authorOf(r.modelPermaslug);
    const k = `${r.date}\u0000${author}`;
    const cur = acc.get(k);
    if (cur) cur.tokens += r.tokens;
    else acc.set(k, { date: r.date, author, tokens: r.tokens });
  }
  return [...acc.values()].sort((a, b) =>
    a.date === b.date ? b.tokens - a.tokens : a.date.localeCompare(b.date),
  );
}
/* Footer: lib/data-sources/openrouter.ts */
