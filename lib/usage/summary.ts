/* ---------------------------------------------------------------------------
 * Header: 도구 상세의 "얼마나 많이 쓰나요" 한 줄 — 코드 데이터(잣대 A·B)만. SPEC 26.4.
 * 잣대 C는 DB를 읽어야 해서 여기 넣지 않는다. 도구 상세의 DB 호출을 늘리지 않는다.
 * ------------------------------------------------------------------------- */
import { BRANDS } from "./brands";
import { APP_USERS, latestFullWebMonth } from "./monthly";

export function toolUsageLine(toolSlug: string): string | undefined {
  const brand = BRANDS.find((b) => b.toolSlug === toolSlug);
  if (!brand) return undefined;
  const parts: string[] = [];
  const app = APP_USERS.find((a) => a.brand === brand.key);
  if (app) {
    parts.push(`국내 앱 사용자 ${app.manUsers.toLocaleString("ko-KR")}만 명(${app.month.replace("-", ".")})`);
  }
  const web = latestFullWebMonth();
  const share = web.share[brand.key];
  if (share !== undefined) {
    parts.push(`세계 생성형 AI 웹 방문의 ${share}%(${web.month.replace("-", ".")})`);
  }
  return parts.length ? parts.join(", ") : undefined;
}
/* Footer: lib/usage/summary.ts */
