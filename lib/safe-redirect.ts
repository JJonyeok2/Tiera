/* ---------------------------------------------------------------------------
 * Header: 로그인 뒤 돌아갈 주소를 같은 사이트 안으로만 제한한다.
 *
 * 예전 검사는 "/로 시작하고 //로 시작하지 않으면 통과"였다. 그런데 브라우저는
 * `/\evil.com`의 역슬래시를 슬래시로 바꿔 읽어서 `//evil.com` — 즉 외부 사이트로
 * 간다. 탭(%09)이나 줄바꿈을 끼워 넣는 변형도 같은 결과가 난다.
 *
 * 문자열 모양으로 막는 방식은 이런 우회가 계속 나온다. 그래서 **실제로 URL을
 * 풀어본 뒤 origin이 우리 것인지** 확인한다. 브라우저가 해석하는 방식과 같은
 * 방식으로 해석해야 브라우저가 가는 곳을 정확히 막을 수 있다.
 * ------------------------------------------------------------------------- */

/** 해석 기준으로만 쓰는 가짜 origin. 실제 도메인과 무관하다. */
const BASE = "http://tiera.internal";

export function safeCallback(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return "/";

  // 제어문자와 역슬래시는 정상적인 내부 경로에 나올 일이 없다.
  // URL 파서가 이걸 조용히 지우거나 바꿔서 검사를 비껴가게 만드는 재료다.
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return "/";
  }
  if (url.origin !== BASE) return "/";

  // 해석된 결과로 다시 조립한다. 원문을 그대로 돌려주면 파서와 브라우저의
  // 해석 차이가 다시 끼어들 틈이 생긴다.
  return `${url.pathname}${url.search}${url.hash}`;
}
/* Footer: lib/safe-redirect.ts */
