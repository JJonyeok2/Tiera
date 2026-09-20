/* ---------------------------------------------------------------------------
 * Header: 도구 시드 데이터 — SPEC 23.7 2단계.
 *
 * 여기가 제품의 출발점이다. 모델 시드(seed-data.ts)와 성격이 완전히 다르다:
 * 저기 벤치마크 수치는 UI 검증용 예시 값이지만, **여기는 전부 실제 정보다.**
 * 잘 모르는 사람이 이 카드를 읽고 실제로 가입하고 결제한다.
 *
 * 작성 규칙 네 가지 — 어기면 정보방이 아니라 블로그가 된다.
 *
 * 1. **모르면 UNKNOWN을 쓴다.** 확인 못한 걸 그럴듯하게 채우지 않는다.
 *    koreanLevel: "UNKNOWN"이 화면에 "확인 중"으로 나가는 게, 틀린 "보통"보다 낫다.
 *
 * 2. **가격 숫자를 박지 않는다.** 2026년 3~9월 여섯 달 동안만 해도 ChatGPT Pro
 *    2단계 신설, Google AI Ultra 인하, v0 $90→$30, Copilot 학생 모델 축소가 있었다.
 *    정가를 적으면 적는 순간부터 틀리기 시작한다. priceNote에는 "무료가 갱신되는가"
 *    처럼 잘 안 변하는 사실을 쓴다.
 *
 * 3. **siteUrl은 실제로 열어본 1차 URL만.** "Seedance", "Grok Imagine"을 한국어로
 *    검색하면 상위가 대부분 제휴·래퍼 사이트다(seedance.kr, grokvideo.ai 등).
 *    공식이 아니면서 자체 과금을 한다. 비전문가 대상 사이트라 이건 치명적이다.
 *
 * 4. **도구와 모델을 섞지 않는다.** Seedance는 도구가 아니라 Dreamina 안의 모델이고,
 *    나노 바나나 2는 Gemini 안의 모델이다. 사람이 여는 것만 여기 들어온다.
 *
 * 조사일 2026-09-20. 모든 항목 웹 검색으로 확인.
 * ------------------------------------------------------------------------- */

import type {
  KoreanLevel,
  Platform,
  PricingKind,
  ToolOrigin,
  ToolPurpose,
} from "@/db/schema";

export interface SeedTool {
  slug: string;
  name: string;
  /** 표시용 제작사 이름. developer 테이블에 없어도 된다. */
  maker: string;
  /**
   * 우리 developer 테이블의 slug. 모델을 가진 제작사일 때만 채운다.
   * 이 값이 있으면 23.4의 "개발사 → 기본 도구" 자동 매핑이 여기로 붙는다.
   */
  developerSlug?: string;
  purpose: ToolPurpose;
  alsoFor?: ToolPurpose[];
  origin: ToolOrigin;
  summary: string;
  howToStart: string;
  pricingKind: PricingKind;
  priceNote: string;
  studentFree?: boolean;
  koreanLevel: KoreanLevel;
  koreanNote?: string;
  siteUrl: string;
  platforms: Platform[];
  /** 카드에 눈에 띄게 띄울 주의사항. 무료로 오해하기 쉬운 것 위주. */
  caution?: string;
}

export const SEED_TOOLS: SeedTool[] = [
  // --- 범용 대화 -----------------------------------------------------------
  {
    slug: "chatgpt",
    name: "ChatGPT",
    maker: "OpenAI",
    developerSlug: "openai",
    purpose: "CHAT",
    alsoFor: ["IMAGE", "RESEARCH", "CODE"],
    origin: "GLOBAL",
    summary:
      "가장 많은 사람이 쓰는 AI. 그래서 막혔을 때 검색하면 남들이 써둔 요령이 제일 많이 나온다.",
    howToStart: "chatgpt.com에 들어가 구글 계정으로 로그인하면 바로 대화할 수 있다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로도 대화는 넉넉하다. 유료는 단계가 여러 개고 자주 바뀐다.",
    koreanLevel: "GOOD",
    koreanNote:
      "일상 대화·글쓰기는 무리 없다. 학사일정이나 행정 같은 한국 고유 정보는 약하다. 그림 안에 한글을 넣는 능력은 현재 가장 정확하다.",
    siteUrl: "https://chatgpt.com",
    platforms: ["WEB", "IOS", "ANDROID", "DESKTOP"],
    caution:
      "한국 요금이 미국보다 비싸다. 가장 싼 유료 단계가 미국 $8인데 한국은 15,000원이다.",
  },
  {
    slug: "claude",
    name: "Claude",
    maker: "Anthropic",
    developerSlug: "anthropic",
    purpose: "CHAT",
    alsoFor: ["RESEARCH", "CODE", "TRANSLATE"],
    origin: "GLOBAL",
    summary:
      "긴 글을 통째로 넣고 '여기서 이것만 찾아줘' 할 때 없는 말을 지어내는 일이 가장 적다.",
    howToStart: "claude.com에서 가입하면 바로 쓸 수 있다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 사용량은 몇 시간 단위로 다시 찬다.",
    koreanLevel: "GOOD",
    siteUrl: "https://claude.com",
    platforms: ["WEB", "IOS", "ANDROID", "DESKTOP"],
  },
  {
    slug: "gemini",
    name: "Gemini",
    maker: "Google",
    developerSlug: "google",
    purpose: "CHAT",
    alsoFor: ["IMAGE", "RESEARCH", "CODE"],
    origin: "GLOBAL",
    summary:
      "구글 계정만 있으면 되고, 내 지메일·드라이브에 있는 자료를 그대로 불러다 쓸 수 있다.",
    howToStart: "gemini.google.com에 구글 계정으로 로그인. 안드로이드 폰에는 이미 깔려 있다.",
    pricingKind: "FREEMIUM",
    priceNote:
      "이미지는 무료로 하루 20장까지 되고 매일 다시 찬다. 카드 등록도 필요 없다.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote: "한국어 UI·음성 모두 성숙하고, 구글 검색이 붙어 한국 최신 정보에 강하다.",
    siteUrl: "https://gemini.google.com",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution:
      "국내 대학(원)생은 1년 무료 + 이후 대폭 할인 혜택이 있다. 다만 신청 마감이 정해져 있고 가입 때 결제수단을 등록해야 한다.",
  },
  {
    slug: "naver-ai-tab",
    name: "네이버 AI탭",
    maker: "네이버",
    developerSlug: "naver",
    purpose: "CHAT",
    alsoFor: ["RESEARCH"],
    origin: "KR",
    summary:
      "식당을 찾고 지도를 보고 예약까지 한 번에 끝난다. 네이버 안의 장소·예약 정보는 외국 AI가 못 따라온다.",
    howToStart: "네이버 검색창에서 AI탭을 누르면 된다. 앱 설치도 가입도 따로 필요 없다.",
    pricingKind: "FREE",
    priceNote: "무료.",
    koreanLevel: "NATIVE",
    siteUrl: "https://www.naver.com",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution: "이전의 클로바X는 2026년 4월에 종료됐다. 그 자리를 대신하는 서비스다.",
  },

  // --- 자료조사 · 논문 -----------------------------------------------------
  {
    slug: "gemini-notebook",
    name: "제미나이 노트북",
    maker: "Google",
    developerSlug: "google",
    purpose: "RESEARCH",
    alsoFor: ["NOTE"],
    origin: "GLOBAL",
    summary:
      "내가 올린 강의자료와 PDF만 읽고 답한다. 인터넷을 뒤지지 않으니 엉뚱한 소리를 덜 한다.",
    howToStart:
      "구글 계정으로 로그인하고 새 노트북을 만든 뒤, 강의 PDF를 끌어다 놓으면 끝이다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료만으로도 공부 용도에는 충분하다.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote: "자료를 팟캐스트처럼 읽어주는 오디오 요약도 한국어를 지원한다.",
    siteUrl: "https://notebook.google",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution: "2026년 7월에 이름이 바뀌었다. 예전 이름은 노트북LM(NotebookLM)이다.",
  },
  {
    slug: "perplexity",
    name: "퍼플렉시티",
    maker: "Perplexity AI",
    purpose: "RESEARCH",
    alsoFor: ["CHAT"],
    origin: "GLOBAL",
    summary:
      "답변 문장마다 출처 링크가 붙는다. 과제에 인용할 때 그 말이 어디서 나왔는지 바로 확인된다.",
    howToStart: "perplexity.ai에 들어가면 로그인 없이도 기본 검색이 된다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 기본 검색 위주이고, 깊은 검색은 하루 몇 번으로 제한된다.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote: "한국어로 물어도 되지만 출처가 영어 문서 위주로 잡히는 편이다.",
    siteUrl: "https://www.perplexity.ai",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution:
      "SKT 1년 무료 혜택을 소개하는 글이 아직 많이 남아 있는데 이미 종료된 이벤트다.",
  },
  {
    slug: "liner",
    name: "라이너",
    maker: "라이너",
    purpose: "RESEARCH",
    origin: "KR",
    summary:
      "논문을 찾아서 여러 편을 비교표로 정리해 준다. 긴 PDF를 한 장으로 줄이는 것도 된다.",
    howToStart:
      "구글 계정으로 로그인하면 바로 검색할 수 있다. 크롬 확장을 깔면 웹페이지에 형광펜을 치며 쓸 수 있다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 월 사용량 제한이 있고 광고가 붙는다.",
    studentFree: true,
    koreanLevel: "NATIVE",
    koreanNote: "한국 회사라 UI·고객지원·공지가 전부 한국어다.",
    siteUrl: "https://liner.com/ko",
    platforms: ["WEB", "EXTENSION", "IOS", "ANDROID"],
  },
  {
    slug: "scispace",
    name: "사이스페이스",
    maker: "SciSpace",
    purpose: "RESEARCH",
    origin: "GLOBAL",
    summary:
      "영어 논문에서 모르는 문단을 드래그해 한국어로 물어볼 수 있다. 수식과 표도 설명해 준다.",
    howToStart: "가입 없이도 PDF를 올려 바로 체험해 볼 수 있다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 등급이 있으나 한도가 자료마다 다르게 적혀 있어 직접 확인이 필요하다.",
    koreanLevel: "GOOD",
    koreanNote:
      "한국어 페이지를 따로 운영한다. 영어 논문을 한국어로 물어볼 수 있는 점이 이 카테고리에서 가장 큰 장점이다.",
    siteUrl: "https://scispace.com/ko",
    platforms: ["WEB", "EXTENSION"],
  },
  {
    slug: "consensus",
    name: "컨센서스",
    maker: "Consensus",
    purpose: "RESEARCH",
    origin: "GLOBAL",
    summary:
      "'커피가 건강에 좋나?' 같은 질문을 넣으면 실제 논문들이 찬성인지 반대인지 비율을 그려 준다.",
    howToStart: "구글 계정으로 로그인한 뒤 영어로 질문을 입력한다.",
    pricingKind: "FREEMIUM",
    priceNote: "논문 검색 자체는 무료로 제한 없이 된다.",
    koreanLevel: "NONE",
    koreanNote:
      "화면이 영어 전용이고 한국어 논문은 거의 잡히지 않는다. 영어로 질문해야 결과가 제대로 나온다.",
    siteUrl: "https://consensus.app",
    platforms: ["WEB"],
  },

  // --- 번역 · 글쓰기 -------------------------------------------------------
  {
    slug: "deepl",
    name: "딥엘",
    maker: "DeepL",
    purpose: "TRANSLATE",
    origin: "GLOBAL",
    summary: "논문이나 보고서처럼 딱딱한 글을 가장 자연스럽게 번역한다.",
    howToStart: "deepl.com에 들어가 원문을 붙여넣으면 가입 없이 바로 번역된다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 한 번에 넣을 수 있는 글자 수와 파일 수에 제한이 있다.",
    koreanLevel: "GOOD",
    koreanNote: "문어체·논문체는 최상급이지만 구어체나 속어는 파파고가 더 자연스럽다는 평이 많다.",
    siteUrl: "https://www.deepl.com/ko/",
    platforms: ["WEB", "DESKTOP", "IOS", "ANDROID", "EXTENSION"],
  },
  {
    slug: "papago",
    name: "파파고",
    maker: "네이버",
    developerSlug: "naver",
    purpose: "TRANSLATE",
    origin: "KR",
    summary: "사진을 찍으면 번역되고 말을 하면 통역된다. 한↔영·중·일 일상 표현이 특히 자연스럽다.",
    howToStart: "앱을 설치하면 가입 없이 바로 쓸 수 있다.",
    pricingKind: "FREE",
    priceNote: "개인은 무료.",
    koreanLevel: "NATIVE",
    siteUrl: "https://papago.naver.com",
    platforms: ["IOS", "ANDROID", "WEB"],
    caution:
      "2024년 9월부터 웹페이지 통째 번역 기능이 빠졌다. PC에서 그 기능을 쓰려면 네이버 웨일 브라우저가 필요하다.",
  },
  {
    slug: "wrtn",
    name: "뤼튼",
    maker: "뤼튼테크놀로지스",
    purpose: "TRANSLATE",
    alsoFor: ["CHAT"],
    origin: "KR",
    summary: "여러 회사의 AI를 무료로 골라 쓸 수 있는 한국 서비스. 가입이 쉽고 전부 한국어다.",
    howToStart: "네이버·카카오·구글 계정으로 간편 가입하면 바로 쓸 수 있다.",
    pricingKind: "FREE",
    priceNote: "무료.",
    koreanLevel: "NATIVE",
    siteUrl: "https://wrtn.ai",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution:
      "회사의 중심이 캐릭터 채팅 쪽으로 옮겨가면서 이 어시스턴트 앱 사용자는 크게 줄었다(2026년 7월 기준 월 23만 명, 1년 전보다 85만 명 감소). '한국 1등 AI'라는 소개는 지금은 맞지 않는다.",
  },

  // --- 발표자료 · 디자인 ---------------------------------------------------
  {
    slug: "miricanvas",
    name: "미리캔버스",
    maker: "미리디",
    purpose: "SLIDES",
    alsoFor: ["IMAGE"],
    origin: "KR",
    summary:
      "한국인이 가장 많이 쓰는 디자인 사이트의 AI. 이 카테고리에서 한글이 깨지지 않는 게 가장 확실하다.",
    howToStart: "접속해서 miricle AI → AI 프레젠테이션을 고르고 주제를 입력한다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로도 월 몇 번은 만들 수 있고, 파워포인트 파일로 내려받는 것까지 무료다.",
    koreanLevel: "NATIVE",
    koreanNote: "한국어 전용 폰트가 수백 종이라 자간·행간이 어색해지지 않는다.",
    siteUrl: "https://www.miricanvas.com",
    platforms: ["WEB"],
  },
  {
    slug: "gamma",
    name: "감마",
    maker: "Gamma",
    purpose: "SLIDES",
    origin: "GLOBAL",
    summary: "주제 한 줄만 쓰면 슬라이드 전체를 만들어 준다. AI PPT 중 가장 유명하다.",
    howToStart: "가입 후 새로 만들기 → 생성 → 프레젠테이션을 고르고 주제를 입력한다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 크레딧을 처음 한 번 주는데 다시 채워지지 않는다. 대략 10개 정도 만들 수 있다.",
    koreanLevel: "PARTIAL",
    koreanNote:
      "한국어로 만들어지긴 하지만 자간·행간이 어색하고 긴 문장의 줄바꿈이 부자연스럽다.",
    siteUrl: "https://gamma.app",
    platforms: ["WEB"],
    caution: "파워포인트 파일로 내보내면 한글 폰트가 깨지는 경우가 있다.",
  },
  {
    slug: "snapdeck",
    name: "스냅덱",
    maker: "에스크잇모어",
    purpose: "SLIDES",
    origin: "KR",
    summary:
      "'그래프 바꿔줘', '더 딱딱한 톤으로' 처럼 대화하듯 지시하면 슬라이드를 계속 고쳐 준다.",
    howToStart: "가입 후 프롬프트 한 줄로 만들고, 이후에는 채팅으로 수정을 지시한다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 월 크레딧이 적은 편이다.",
    koreanLevel: "UNKNOWN",
    koreanNote:
      "한국 팀이 만들었고 한글 폰트 서비스도 따로 운영하지만, 실제 한글 슬라이드 품질을 확인한 자료를 찾지 못했다. 사용자 수의 95% 이상이 해외라는 점도 함께 보아야 한다.",
    siteUrl: "https://www.snapdeck.app",
    platforms: ["WEB", "PLUGIN"],
  },
  {
    slug: "canva",
    name: "캔바",
    maker: "Canva",
    purpose: "SLIDES",
    alsoFor: ["IMAGE"],
    origin: "GLOBAL",
    summary:
      "디자인을 못 해도 포스터·발표자료·SNS 이미지를 만들 수 있다. 템플릿이 가장 많다.",
    howToStart: "한국어 사이트에 가입한 뒤 만들고 싶은 것을 검색창에 적으면 템플릿을 추천해 준다.",
    pricingKind: "FREEMIUM",
    priceNote: "AI 기능이 무료 플랜에도 열려 있다. 무료는 AI 사용 횟수에 월 제한이 있다.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote:
      "한국어 화면과 원화 결제를 지원한다. 다만 영문 템플릿을 그대로 쓰면 기본 폰트가 영문이라 한글 폰트로 바꿔줘야 한다.",
    siteUrl: "https://www.canva.com/ko_kr/",
    platforms: ["WEB", "IOS", "ANDROID", "DESKTOP"],
  },

  // --- 기록 · 정리 ---------------------------------------------------------
  {
    slug: "notion-ai",
    name: "노션 AI",
    maker: "Notion",
    purpose: "NOTE",
    alsoFor: ["TRANSLATE"],
    origin: "GLOBAL",
    summary: "노트·과제·일정을 한곳에 모아두고 그 안에서 요약과 번역까지 한다.",
    howToStart: "가입 후 페이지에서 슬래시(/)를 누르고 ai를 입력하면 된다.",
    pricingKind: "FREEMIUM",
    priceNote: "학교 이메일로 인증하면 1인 워크스페이스가 무료다. 매년 다시 인증해야 한다.",
    studentFree: true,
    koreanLevel: "GOOD",
    siteUrl: "https://www.notion.com",
    platforms: ["WEB", "DESKTOP", "IOS", "ANDROID", "EXTENSION"],
    caution: "교육 플랜에 AI 기능이 어디까지 포함되는지는 공식 문서에 명시가 없다.",
  },
  {
    slug: "clova-note",
    name: "클로바노트",
    maker: "네이버",
    developerSlug: "naver",
    purpose: "NOTE",
    origin: "KR",
    summary: "녹음만 켜두면 한국어를 알아서 받아 적고 요약까지 해준다. 강의 녹음에 쓰기 좋다.",
    howToStart: "앱을 깔거나 웹에 들어가 네이버 계정으로 로그인한 뒤 새 노트에서 녹음을 시작한다.",
    pricingKind: "FREE",
    priceNote:
      "개인은 사실상 무료다. 월 무료 시간이 정해져 있고 데이터 제공에 동의하면 두 배가 된다. 개인용 유료 상품 자체가 없다.",
    koreanLevel: "NATIVE",
    siteUrl: "https://clovanote.naver.com",
    platforms: ["WEB", "IOS", "ANDROID"],
  },
  {
    slug: "tiro",
    name: "티로",
    maker: "더플레이토",
    purpose: "NOTE",
    alsoFor: ["TRANSLATE"],
    origin: "KR",
    summary:
      "받아 적으면서 동시에 번역까지 된다. 한국어 인식률을 수치로 공개하는 몇 안 되는 서비스다.",
    howToStart: "앱을 깔거나 웹에 가입하면 체험 시간을 준다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 체험은 기간과 시간이 정해져 있고, 이후에는 월 사용 시간 단위로 결제한다.",
    koreanLevel: "NATIVE",
    siteUrl: "https://tiro.ooo",
    platforms: ["WEB", "DESKTOP", "IOS", "ANDROID"],
  },

  // --- 이미지 --------------------------------------------------------------
  // 나노 바나나 2와 GPT-Image-2는 여기에 없다. 도구가 아니라 각각 Gemini와
  // ChatGPT 안의 **모델**이기 때문이다. 두 도구의 alsoFor에 IMAGE를 넣어 뒀으므로
  // 이미지 탭에서는 같이 보인다.
  {
    slug: "adobe-firefly",
    name: "어도비 파이어플라이",
    maker: "Adobe",
    purpose: "IMAGE",
    alsoFor: ["VIDEO", "AUDIO"],
    origin: "GLOBAL",
    summary:
      "여러 회사의 이미지·영상 모델 수십 개를 한 구독으로 골라 쓰는 곳. 어도비 자체 모델은 저작권이 정리돼 있어 과제나 공모전에 쓰기 안전하다.",
    howToStart: "어도비 계정으로 로그인하면 웹에서 바로 쓸 수 있다. 포토샵이 없어도 된다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 매일 일정 횟수를 생성할 수 있고 매일 다시 찬다.",
    koreanLevel: "GOOD",
    koreanNote: "한국어를 포함해 100개 이상 언어로 지시할 수 있다.",
    siteUrl: "https://firefly.adobe.com",
    platforms: ["WEB", "IOS", "ANDROID", "PLUGIN"],
    caution:
      "'저작권 안전'은 어도비 자체 모델을 쓸 때만 해당한다. 안에 들어 있는 다른 회사 모델은 별개다.",
  },
  {
    slug: "dreamina",
    name: "드림이나",
    maker: "ByteDance",
    purpose: "IMAGE",
    alsoFor: ["VIDEO", "AVATAR"],
    origin: "GLOBAL",
    summary:
      "캡컷을 만든 회사의 형제 서비스. 바이트댄스가 직접 만든 이미지·영상 모델을 가장 먼저 쓸 수 있는 공식 창구다.",
    howToStart: "한국어 사이트에 접속해 가입한다.",
    pricingKind: "FREEMIUM",
    priceNote: "매일 무료 크레딧을 준다. 정확한 수량은 공개돼 있지 않다.",
    koreanLevel: "PARTIAL",
    koreanNote:
      "화면은 한국어지만, 한국어로 지시했을 때의 품질과 결과물에 한글이 들어가는지는 확인하지 못했다.",
    siteUrl: "https://dreamina.capcut.com/ko-kr",
    platforms: ["WEB"],
    caution:
      "'Seedance'로 검색하면 공식이 아닌 제휴 사이트가 잔뜩 나온다. Seedance는 서비스 이름이 아니라 이 안에서 고르는 모델 이름이다.",
  },
  {
    slug: "midjourney",
    name: "미드저니",
    maker: "Midjourney",
    purpose: "IMAGE",
    origin: "GLOBAL",
    summary: "분위기 있고 예술적인 그림에 특화돼 있다. 결과물의 작품성으로는 여전히 기준점이다.",
    howToStart:
      "이제는 디스코드 없이 웹사이트에서 쓴다. 다만 가입하자마자 결제해야 첫 장을 만들 수 있다.",
    pricingKind: "PAID",
    priceNote: "무료로 써볼 수 있는 방법이 없다. 가장 싼 단계도 매달 내야 한다.",
    koreanLevel: "NONE",
    koreanNote: "화면이 영어고 한국어 지시를 잘 못 알아듣는다. 그림 안의 한글도 약하다.",
    siteUrl: "https://www.midjourney.com",
    platforms: ["WEB"],
    caution:
      "무료 체험이 2023년에 없어졌고 환불도 거의 안 된다. 돈을 낼 생각이 없다면 다른 걸 먼저 써보는 게 낫다.",
  },

  // --- 영상 ----------------------------------------------------------------
  {
    slug: "capcut",
    name: "캡컷",
    maker: "ByteDance",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary: "휴대폰으로 숏폼을 만들 때 가장 많이 쓰는 편집 앱. 자동 자막과 AI 목소리가 들어 있다.",
    howToStart: "앱을 설치하거나 웹에서 바로 시작한다. 신용카드가 필요 없다.",
    pricingKind: "FREEMIUM",
    priceNote: "기본 편집은 무료로 충분하다.",
    koreanLevel: "GOOD",
    siteUrl: "https://www.capcut.com/ko-kr/",
    platforms: ["IOS", "ANDROID", "WEB", "DESKTOP"],
  },
  {
    slug: "vrew",
    name: "브루",
    maker: "보이저엑스",
    purpose: "VIDEO",
    origin: "KR",
    summary:
      "영상에 자막을 자동으로 달아준다. 한국어 음성 인식 정확도가 이 프로그램의 핵심이다.",
    howToStart: "공식 사이트에서 프로그램을 내려받아 설치하고 회원가입한다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 월 분석 시간에 제한이 있고 결과물에 워터마크가 붙는다.",
    studentFree: true,
    koreanLevel: "NATIVE",
    siteUrl: "https://vrew.ai/ko/",
    platforms: ["DESKTOP", "WEB"],
    caution: "교육기관 할인이 따로 있다.",
  },
  {
    slug: "google-flow",
    name: "구글 플로우",
    maker: "Google",
    developerSlug: "google",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary: "문장만 쓰면 소리까지 들어간 영상을 만들어 준다. 무료로 매일 몇 편씩 시도해 볼 수 있다.",
    howToStart:
      "구글 계정으로 로그인한다. 만 18세 이상 인증이 필요하고 크롬이나 엣지에서 열어야 한다.",
    pricingKind: "FREEMIUM",
    priceNote:
      "무료로 하루 50크레딧을 주고 매일 다시 찬다. 가벼운 모델 기준 하루 다섯 편 정도다.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote:
      "화면은 한국어를 지원하지만, 구글이 공식적으로 영어로 지시하기를 권하고 다른 언어는 품질이 달라질 수 있다고 안내한다.",
    siteUrl: "https://labs.google/flow",
    platforms: ["WEB"],
    caution:
      "무료 사용 가능 여부를 두고 구글 공식 문서끼리 설명이 엇갈린다(구독 필수라는 문서와 비구독자도 하루 50크레딧이라는 문서). 직접 확인이 필요하다.",
  },
  {
    slug: "kling",
    name: "클링",
    maker: "Kuaishou",
    purpose: "VIDEO",
    alsoFor: ["IMAGE"],
    origin: "GLOBAL",
    summary: "사진 한 장을 움직이는 영상으로 바꾸는 용도로 특히 많이 쓴다.",
    howToStart: "한국어 사이트에서 이메일로 가입한다. 중국 전화번호는 필요 없다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 크레딧이 적어서 맛보기 수준이다.",
    koreanLevel: "GOOD",
    koreanNote: "메뉴와 기능명까지 한국어로 번역돼 있다.",
    siteUrl: "https://kling.ai/ko",
    platforms: ["WEB", "IOS", "ANDROID"],
  },
  {
    slug: "hailuo",
    name: "하이루오",
    maker: "MiniMax",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary:
      "매일 크레딧이 자동으로 충전돼서 돈을 안 내고도 계속 시도해 볼 수 있다. 사람 동작 표현이 좋은 편이다.",
    howToStart: "구글이나 애플 계정으로 가입한다. 템플릿을 골라 누르는 놀이 기능이 있어 처음 쓰기 쉽다.",
    pricingKind: "FREEMIUM",
    priceNote: "가입 시 크레딧을 주고 이후 매일 자동 충전된다. 유료도 이 목록에서 저렴한 축이다.",
    koreanLevel: "PARTIAL",
    koreanNote: "한국어 지시는 잘 알아듣는 편이지만 화면의 한국어 지원은 확인하지 못했다.",
    siteUrl: "https://hailuoai.video",
    platforms: ["WEB", "IOS"],
  },
  {
    slug: "runway",
    name: "런웨이",
    maker: "Runway",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary: "영상 제작자들이 실제 작업에 쓰는 도구. 생성과 편집을 함께 한다.",
    howToStart: "웹에 가입하면 체험용 크레딧을 준다.",
    pricingKind: "TRIAL",
    priceNote: "무료 크레딧은 처음 한 번만 주고 다시 채워지지 않는다.",
    koreanLevel: "NONE",
    siteUrl: "https://runway.com",
    platforms: ["WEB", "IOS"],
    caution:
      "무료 크레딧으로 5초짜리 영상 두 편 정도 만들면 끝난다. 갱신되지 않으니 '무료로 써본다'는 기대는 하지 않는 게 좋다.",
  },
  {
    slug: "higgsfield",
    name: "힉스필드",
    maker: "Higgsfield",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary:
      "여러 회사의 영상 AI를 한 구독으로 쓰면서, '카메라가 이렇게 움직이는 장면' 같은 효과를 골라 누르는 방식으로 만든다.",
    howToStart: "웹에 가입한다. 하루짜리 무료 체험이 있지만 신용카드를 먼저 등록해야 한다.",
    pricingKind: "TRIAL",
    priceNote:
      "무료 플랜으로는 영상을 만들 수 없고, 크레딧은 구독이 있어야 생긴다. 남은 크레딧은 다음 달로 넘어가지 않는다.",
    koreanLevel: "UNKNOWN",
    siteUrl: "https://higgsfield.ai",
    platforms: ["WEB"],
    caution:
      "요금제와 크레딧 소모량이 출처마다 최대 다섯 배까지 다르게 적혀 있다. 결제 전 공식 페이지에서 직접 확인할 것.",
  },

  // --- 아바타 영상 ---------------------------------------------------------
  {
    slug: "ai-studios",
    name: "AI 스튜디오스",
    maker: "딥브레인AI",
    purpose: "AVATAR",
    origin: "KR",
    summary:
      "대본만 넣으면 사람이 말하는 것 같은 영상이 나온다. 무료 상태에서도 내 얼굴로 아바타를 하나 만들 수 있다.",
    howToStart: "한국어 사이트에 가입하고 대본을 입력한다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 매달 짧은 영상 몇 편을 만들 수 있고 매월 다시 찬다.",
    koreanLevel: "NATIVE",
    siteUrl: "https://www.aistudios.com/ko",
    platforms: ["WEB"],
    caution: "같은 일을 하는 해외 서비스 HeyGen은 무료 플랜에서 내 얼굴 아바타를 못 만든다.",
  },
  {
    slug: "heygen",
    name: "헤이젠",
    maker: "HeyGen",
    purpose: "AVATAR",
    origin: "GLOBAL",
    summary: "말하는 아바타 영상을 만드는 서비스 중 이용자가 가장 많다. 지원 언어 수가 압도적이다.",
    howToStart: "웹에 가입하고 대본을 입력한다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 매달 1분 이내 영상 몇 편을 만들 수 있다.",
    koreanLevel: "UNKNOWN",
    koreanNote: "한국어 사용기는 많지만 공식 문서에서 한국어 지원을 확인하지 못했다.",
    siteUrl: "https://www.heygen.com",
    platforms: ["WEB"],
  },

  // --- 음악 · 목소리 -------------------------------------------------------
  {
    slug: "suno",
    name: "수노",
    maker: "Suno",
    purpose: "AUDIO",
    origin: "GLOBAL",
    summary: "한 줄만 쓰면 가사·멜로디·보컬이 다 들어간 완성곡이 나온다.",
    howToStart: "웹에 가입하고 만들고 싶은 노래를 설명하면 된다. 설치할 게 없다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 하루 크레딧을 주고 매일 다시 찬다.",
    koreanLevel: "GOOD",
    koreanNote: "한국어 가사로 노래를 만들 수 있다.",
    siteUrl: "https://suno.com",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution:
      "무료로는 만들어 듣는 것만 되고 파일로 내려받을 수 없다. 상업적 이용도 유료부터다.",
  },
  {
    slug: "elevenlabs",
    name: "일레븐랩스",
    maker: "ElevenLabs",
    purpose: "AUDIO",
    origin: "GLOBAL",
    summary: "글을 넣으면 사람이 읽는 것처럼 자연스러운 목소리로 바꿔 준다. 영상 나레이션에 많이 쓴다.",
    howToStart: "웹에 가입해 문장을 넣고 목소리를 고른다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 매달 10분 분량 정도를 만들 수 있고 매월 다시 찬다.",
    koreanLevel: "GOOD",
    koreanNote:
      "한국어를 지원하고 자연스러운 편이다. 숫자와 영문 약어는 한글로 풀어서 넣어야 제대로 읽는다(예: 2026 → 이천이십육).",
    siteUrl: "https://elevenlabs.io/ko",
    platforms: ["WEB"],
  },
  {
    slug: "supertone-play",
    name: "슈퍼톤 플레이",
    maker: "수퍼톤",
    purpose: "AUDIO",
    origin: "KR",
    summary:
      "글을 음성으로 바꿔 주는 도구인데, 한국 회사가 한국어를 1순위로 두고 만들어 억양이 목적에 맞다.",
    howToStart: "가입 없이 먼저 들어볼 수 있고, 체험은 신용카드 등록이 필요 없다.",
    pricingKind: "FREEMIUM",
    priceNote: "체험 크레딧을 한 번 주고, 이후에는 글자 수 단위로 결제한다.",
    koreanLevel: "NATIVE",
    koreanNote: "지원 언어 20여 개 중 한국어를 기준으로 설계했다.",
    siteUrl: "https://www.supertone.ai/play",
    platforms: ["WEB", "DESKTOP"],
  },

  // --- 코딩 · 앱 만들기 ----------------------------------------------------
  {
    slug: "github-copilot",
    name: "깃허브 코파일럿",
    maker: "GitHub",
    purpose: "CODE",
    origin: "GLOBAL",
    summary: "코드를 짜다 멈칫하면 다음 줄을 회색 글씨로 미리 보여준다. 코딩 입문자에게 부담이 가장 적다.",
    howToStart: "깃허브에 가입해 학생 인증을 받고, VS Code에 확장 프로그램을 설치한다.",
    pricingKind: "FREEMIUM",
    priceNote: "학생 인증을 받으면 무료로 쓸 수 있다.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote: "설명은 한국어로 받을 수 있지만 코드 주석과 변수명은 영어가 낫다.",
    siteUrl: "https://github.com/features/copilot",
    platforms: ["PLUGIN", "DESKTOP"],
    caution:
      "2026년 3월부터 학생 플랜에서는 사용할 AI 모델을 직접 고를 수 없고 자동 선택만 된다.",
  },
  {
    slug: "lovable",
    name: "러버블",
    maker: "Lovable",
    purpose: "CODE",
    origin: "GLOBAL",
    summary:
      "채팅으로 원하는 걸 설명하면 실제로 동작하는 웹사이트가 나오고 주소까지 바로 생긴다. 코딩을 몰라도 된다.",
    howToStart: "가입하고 만들고 싶은 걸 한국어로 설명하면 된다.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 크레딧은 하루·월 단위로 정해져 있고 작은 프로젝트 하나 정도 분량이다.",
    koreanLevel: "GOOD",
    koreanNote: "한국어로 지시할 수 있고 결과물의 화면 글자도 한국어로 나온다.",
    siteUrl: "https://lovable.dev",
    platforms: ["WEB"],
  },
  {
    slug: "claude-code",
    name: "클로드 코드",
    maker: "Anthropic",
    developerSlug: "anthropic",
    purpose: "CODE",
    origin: "GLOBAL",
    summary:
      "터미널에서 '이 버그 고쳐줘'라고 말하면 파일을 직접 읽고 고친다. 자동완성이 아니라 대신 일하는 쪽에 가깝다.",
    howToStart: "터미널에 설치 명령 한 줄을 붙여넣는다. 웹이나 편집기 확장으로도 쓸 수 있다.",
    pricingKind: "FREEMIUM",
    priceNote: "Claude 유료 구독에 포함돼 있어 따로 결제하지 않는다.",
    koreanLevel: "GOOD",
    siteUrl: "https://www.claude.com/product/claude-code",
    platforms: ["DESKTOP", "WEB", "PLUGIN", "IOS", "ANDROID"],
    caution: "터미널을 처음 써보는 사람에게는 진입 장벽이 있다. 코딩을 두세 달쯤 해본 뒤가 좋다.",
  },
];

/**
 * 개발사 → 기본 도구 매핑. SPEC 23.4
 *
 * 모델 302개를 손으로 도구에 붙이지 않는다. 수집(sync) 때 모델의 개발사로
 * 이 표를 찾아 tool_id를 채우고, 규칙에서 벗어나는 것만 예외로 손본다.
 * 여기 없는 개발사의 모델은 tool_id가 null로 남는다 — 도구 없이 API로만
 * 쓰이는 모델이라는 뜻이고, 그건 오류가 아니라 사실이다.
 */
export const DEVELOPER_DEFAULT_TOOL: Record<string, string> = {
  openai: "chatgpt",
  anthropic: "claude",
  google: "gemini",
  naver: "naver-ai-tab",
};
/* Footer: db/seed-tools-data.ts */
