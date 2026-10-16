/* ---------------------------------------------------------------------------
 * Header: 도구 검색 — 이름뿐 아니라 "하려는 일"로도 찾게 한다. SPEC 23.22.
 *
 * 처음 온 사람은 도구 이름을 모른다. 그래서 검색창에 "PPT", "영상편집",
 * "회의록"처럼 하려는 일을 친다. 예전 검색은 이름·제작사·한 줄 설명만 봐서
 * "영상편집"은 0개, "ppt"는 2개(감마·젠스파크)만 나왔다 — 미리캔버스·캔바는
 * 설명에 "ppt"라는 글자가 없다는 이유로 빠졌다.
 *
 * 그래서 검색어가 어떤 용도를 가리키는지 먼저 알아내고, 그 용도의 도구를
 * 이름 검색 결과와 합친다. 키워드는 사람들이 실제로 치는 말이다(한글·영문·줄임말).
 * ------------------------------------------------------------------------- */
import { sql, type SQL } from "drizzle-orm";
import type { ToolPurpose } from "@/db/schema";

/**
 * 용도별 검색 키워드. 탭 이름·힌트에 없는 일상어를 담는다.
 * 너무 넓은 말("AI", "만들기")은 넣지 않는다 — 전부 걸려서 검색이 무의미해진다.
 */
export const PURPOSE_KEYWORDS: Record<ToolPurpose, string[]> = {
  CHAT: ["대화", "챗봇", "챗지피티", "질문", "물어보기", "비서"],
  RESEARCH: [
    "자료조사",
    "조사",
    "리서치",
    "논문",
    "과제",
    "레포트",
    "리포트",
    "검색",
    "공부",
  ],
  TRANSLATE: [
    "번역",
    "영어",
    "글쓰기",
    "맞춤법",
    "교정",
    "작문",
    "이메일",
    "메일",
  ],
  SLIDES: [
    "발표",
    "발표자료",
    "ppt",
    "피피티",
    "프레젠테이션",
    "슬라이드",
    "카드뉴스",
    "포스터",
    "디자인",
  ],
  NOTE: [
    "기록",
    "회의록",
    "녹음",
    "받아쓰기",
    "속기",
    "강의녹음",
    "요약",
    "메모",
    "노트",
  ],
  IMAGE: ["이미지", "그림", "사진", "일러스트", "로고", "배경제거"],
  VIDEO: ["영상", "동영상", "영상편집", "쇼츠", "릴스", "유튜브", "자막"],
  AVATAR: ["아바타", "가상인간", "디지털휴먼", "말하는영상"],
  AUDIO: ["음악", "노래", "작곡", "목소리", "음성", "tts", "더빙", "내레이션"],
  WEBSITE: ["웹사이트", "홈페이지", "포트폴리오", "랜딩페이지", "사이트"],
  CODE: ["코딩", "코드", "개발", "프로그래밍", "앱만들기", "앱", "바이브코딩"],
};

/** 공백을 빼고 소문자로. "영상 편집"과 "영상편집"을 같은 말로 본다. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

/**
 * 검색어가 가리키는 용도들.
 * - 검색어가 키워드를 품으면("영상편집" ⊃ "영상") 그 용도다.
 * - 키워드가 검색어를 품으면("프레젠" ⊂ "프레젠테이션") 그 용도다. 단, 한 글자
 *   검색어는 거의 모든 키워드에 걸려서 이 방향은 두 글자부터만 본다.
 */
export function purposesForQuery(q: string | undefined): ToolPurpose[] {
  if (!q) return [];
  const n = normalize(q);
  if (!n) return [];
  const out: ToolPurpose[] = [];
  for (const [purpose, words] of Object.entries(PURPOSE_KEYWORDS) as [
    ToolPurpose,
    string[],
  ][]) {
    const hit = words.some(
      (w) => n.includes(w) || (n.length >= 2 && w.includes(n)),
    );
    if (hit) out.push(purpose);
  }
  return out;
}

/**
 * 도구 검색 WHERE 조각(앞에 AND를 붙여 쓴다). 검색어가 없으면 빈 조각.
 * 이름·제작사·설명·별칭 부분 일치 **또는** 검색어가 가리키는 용도(대표·겸업 모두).
 */
export function toolSearchCondition(q: string | undefined): SQL {
  const raw = q?.trim();
  if (!raw) return sql``;
  const like = `%${raw.toLowerCase()}%`;
  const purposes = purposesForQuery(raw);
  const byText = sql`(LOWER(t.name) LIKE ${like} OR LOWER(t.maker) LIKE ${like} OR LOWER(t.summary) LIKE ${like} OR LOWER(array_to_string(t.aliases, ' ')) LIKE ${like})`;
  if (purposes.length === 0) return sql`AND ${byText}`;
  // 배열 파라미터는 text[]로 받아 enum으로 바꾼다. 드라이버가 enum 배열 타입을 모른다.
  const list = sql`${`{${purposes.join(",")}}`}::text[]::tool_purpose[]`;
  return sql`AND (${byText} OR t.purpose = ANY(${list}) OR t.also_for && ${list})`;
}
/**
 * 검색 결과 정렬 앞머리(뒤에 쉼표까지 붙여 준다). 검색어가 없으면 빈 조각.
 * 이름·별칭이 직접 맞은 도구를 용도로 걸려 온 도구보다 위에 둔다 —
 * "감마"를 쳤는데 발표자료 도구 여섯 개 사이에 감마가 섞여 있으면 안 된다.
 */
export function toolSearchRank(q: string | undefined): SQL {
  const raw = q?.trim();
  if (!raw) return sql``;
  const like = `%${raw.toLowerCase()}%`;
  const nameHit = sql`(LOWER(t.name) LIKE ${like} OR LOWER(array_to_string(t.aliases, ' ')) LIKE ${like}) DESC,`;
  const purposes = purposesForQuery(raw);
  if (purposes.length === 0) return nameHit;
  // 용도로 걸려 온 것 중에서는 그 일이 **본업**인 도구를 먼저. "ppt"에 마누스(겸업)가
  // 미리캔버스(본업)보다 위에 오면 안 된다.
  const list = sql`${`{${purposes.join(",")}}`}::text[]::tool_purpose[]`;
  return sql`${nameHit} (t.purpose = ANY(${list})) DESC,`;
}
/* Footer: lib/search.ts */
