/* ---------------------------------------------------------------------------
 * Header: 공유 미리보기(OG 이미지)에 들어가는 문구.
 *
 * 따로 떼어 둔 이유: OG 이미지는 브라우저가 아니라 서버(next/og)가 그리는데,
 * 기본 글꼴에 한글이 없어서 **한글이 전부 네모(□)로 나왔다.** 카톡에 링크를
 * 보내면 "□□ □□ □□□"가 떴던 셈이다.
 *
 * 그래서 Pretendard에서 이 문구에 쓰인 글자만 잘라낸 글꼴(assets/og/)을 넣는다.
 * 문구를 바꾸면 그 글꼴도 다시 잘라야 한다 — 안 그러면 새로 들어간 글자만
 * 다시 네모가 된다. tests/og-font.test.ts가 이걸 잡는다.
 *
 * 다시 자르는 법: python3 scripts/subset-og-font.py <Pretendard OTF 폴더>
 * ------------------------------------------------------------------------- */

export const OG_TITLE = "어떤 AI를 써야 할지 모를 때";
export const OG_SUBTITLE = "쓸 일로 고르고, 돈이 드는지·한국어가 되는지 먼저 확인하세요";
export const OG_CHIPS = ["대화", "자료조사", "발표자료", "이미지", "영상", "코딩"] as const;

/** 굵은 글꼴로 그리는 문자열 전부. */
export const OG_BOLD_TEXT = ["Tiera", OG_TITLE].join("");
/** 보통 굵기로 그리는 문자열 전부. */
export const OG_MEDIUM_TEXT = [OG_SUBTITLE, ...OG_CHIPS].join("");
/* Footer: lib/og-copy.ts */
