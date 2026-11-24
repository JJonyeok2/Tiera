/* ---------------------------------------------------------------------------
 * Header: 잣대 C 점유율 계산 — 순수 함수. SPEC 26.
 *
 * 저장된 일별 개발사 토큰 합계에서 "최근 7일"과 "그 전 7일"의 점유율을 낸다.
 * 7일 단위인 이유: 요일 효과(주말에 개발자 트래픽이 빠진다)가 상쇄된다.
 *
 * 분모에는 "other"(상위 50 밖 합계)를 포함한다. 빼면 상위 모델의 몫이 부풀려진다.
 * "other"는 개발사가 아니라 화면의 순위에는 넣지 않는다.
 * ------------------------------------------------------------------------- */
import type { AuthorDay } from "@/lib/data-sources/openrouter";
import { OTHER } from "@/lib/data-sources/openrouter";
import { brandKeyForAuthor } from "./brands";

export interface BrandShare {
  brand: string;
  /** 0~100 */
  share: number;
  /** 직전 7일 대비 점유율 변화(%p). 직전 데이터가 없으면 undefined */
  deltaPt?: number;
}

export interface ApiShareWindow {
  /** 포함한 첫날·마지막 날(UTC) */
  start: string;
  end: string;
  /** 점유율 높은 순. "other"는 제외 */
  shares: BrandShare[];
  /** 상위 50 밖 합계의 점유율 */
  otherShare: number;
}

function addDays(d: string, n: number): string {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

function sharesIn(days: AuthorDay[], start: string, end: string) {
  const sum = new Map<string, number>();
  let total = 0;
  for (const d of days) {
    if (d.date < start || d.date > end) continue;
    total += d.tokens;
    const key = d.author === OTHER ? OTHER : brandKeyForAuthor(d.author);
    sum.set(key, (sum.get(key) ?? 0) + d.tokens);
  }
  return { sum, total };
}

/**
 * 가장 최근 날짜에서 거꾸로 7일. 그 7일이 다 차 있지 않으면 undefined —
 * 3일치로 낸 점유율을 "최근 7일"이라고 부르면 거짓말이다.
 */
export function apiShareWindow(days: AuthorDay[], windowDays = 7): ApiShareWindow | undefined {
  if (days.length === 0) return undefined;
  const end = days.reduce((m, d) => (d.date > m ? d.date : m), days[0].date);
  const start = addDays(end, -(windowDays - 1));
  const dates = new Set(days.filter((d) => d.date >= start && d.date <= end).map((d) => d.date));
  if (dates.size < windowDays) return undefined;

  const cur = sharesIn(days, start, end);
  if (cur.total <= 0) return undefined;

  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(windowDays - 1));
  const prevDates = new Set(days.filter((d) => d.date >= prevStart && d.date <= prevEnd).map((d) => d.date));
  const prev = prevDates.size === windowDays ? sharesIn(days, prevStart, prevEnd) : undefined;

  const shares: BrandShare[] = [];
  for (const [brand, tokens] of cur.sum) {
    if (brand === OTHER) continue;
    const share = (tokens / cur.total) * 100;
    let deltaPt: number | undefined;
    if (prev && prev.total > 0) {
      deltaPt = share - ((prev.sum.get(brand) ?? 0) / prev.total) * 100;
    }
    shares.push({ brand, share, deltaPt });
  }
  shares.sort((a, b) => b.share - a.share);
  return {
    start,
    end,
    shares,
    otherShare: ((cur.sum.get(OTHER) ?? 0) / cur.total) * 100,
  };
}
/* Footer: lib/usage/share.ts */
