/* ---------------------------------------------------------------------------
 * Header: 도구 시드 데이터 — SPEC 23.7 2단계.
 *
 * 여기가 제품의 출발점이다. 모델 시드(seed-data.ts)와 성격이 완전히 다르다:
 * 저기 벤치마크 수치는 UI 검증용 예시 값이지만, **여기는 전부 실제 정보다.**
 * 잘 모르는 사람이 이 카드를 읽고 실제로 가입하고 결제한다.
 *
 * 작성 규칙 다섯 가지 — 어기면 정보방이 아니라 블로그가 된다.
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
 *    TypeSafe AI의 Jev(2026-09-15 공개)도 같은 이유로 빠져 있다. 글을 쓰지 않고
 *    YES/NO·점수·선택지만 돌려주는 판단 모델이라 개발자가 API로 붙이는 부품이지,
 *    일반인이 열어서 쓰는 화면이 없다. 우리 층으로는 model 쪽이다.
 *
 * 5. **말투는 해요체다.** 이 사이트는 잘 모르는 사람에게 알려주는 곳인데
 *    "~한다"로 끝내면 교과서가 된다. 사람이 옆에서 말해주는 톤을 유지한다.
 *    (주석은 예외다. 주석을 읽는 건 개발자지 사용자가 아니다.)
 *
 * 조사일 2026-09-20, 코딩 도구 3종 추가 2026-09-25, 웹사이트·앱 빌더 8종 추가 2026-10-05.
 * 모든 항목 웹 검색으로 확인.
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
  /**
   * public 기준 로고 경로(예: "/logos/chatgpt.png"). 없으면 첫 글자 타일.
   * scripts/fetch-logos.ts로 각 서비스 파비콘을 받아 채운다 — 직접 그리지 않는다.
   */
  logoUrl?: string;
  platforms: Platform[];
  /** 카드에 눈에 띄게 띄울 주의사항. 무료로 오해하기 쉬운 것 위주. */
  caution?: string;
  /**
   * 검색용 다른 이름.
   *
   * 이게 없으면 목록이 사람을 놓친다. "노트북LM"으로 검색하는 사람이 제일 많은데
   * 우리 name은 "제미나이 노트북"이라 한 건도 안 나온다 — 있는데 없는 것처럼
   * 보이는 게 제일 나쁜 결과다. 한글 표기·영문 표기·옛 이름·흔한 오타를 넣는다.
   * 화면에는 안 나온다. 검색에만 쓴다.
   */
  aliases?: string[];
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
      "가장 많은 사람이 쓰는 AI예요. 그래서 막혔을 때 검색하면 남들이 써둔 요령이 제일 많이 나와요.",
    howToStart: "chatgpt.com에 들어가서 구글 계정으로 로그인하면 바로 대화할 수 있어요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로도 대화는 넉넉해요. 유료는 단계가 여러 개고 자주 바뀌어요.",
    koreanLevel: "GOOD",
    koreanNote:
      "일상 대화나 글쓰기는 무리 없어요. 학사일정이나 행정 같은 한국 고유 정보는 약한 편이에요. 그림 안에 한글을 넣는 건 지금 여기가 제일 정확해요.",
    siteUrl: "https://chatgpt.com",
    logoUrl: "/logos/chatgpt.png",
    platforms: ["WEB", "IOS", "ANDROID", "DESKTOP"],
    caution:
      "한국 요금이 미국보다 비싸요. 가장 싼 유료 단계가 미국은 $8인데 한국은 15,000원이에요.",
    aliases: ["챗지피티", "챗GPT", "지피티", "gpt", "오픈AI", "openai"],
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
      "긴 글을 통째로 넣고 '여기서 이것만 찾아줘' 할 때 없는 말을 지어내는 일이 제일 적어요.",
    howToStart: "claude.com에서 가입하면 바로 쓸 수 있어요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 사용량은 몇 시간 단위로 다시 차요.",
    koreanLevel: "GOOD",
    siteUrl: "https://claude.com",
    logoUrl: "/logos/claude.png",
    platforms: ["WEB", "IOS", "ANDROID", "DESKTOP"],
    aliases: ["클로드", "앤트로픽", "anthropic"],
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
      "구글 계정만 있으면 되고, 내 지메일이나 드라이브에 있는 자료를 그대로 불러다 쓸 수 있어요.",
    howToStart:
      "gemini.google.com에 구글 계정으로 로그인하면 돼요. 안드로이드 폰에는 이미 깔려 있어요.",
    pricingKind: "FREEMIUM",
    priceNote: "이미지는 무료로 하루 20장까지 되고 매일 다시 차요. 카드 등록도 필요 없어요.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote:
      "한국어 화면과 음성이 둘 다 자연스럽고, 구글 검색이 붙어 있어서 한국 최신 정보에 강해요.",
    siteUrl: "https://gemini.google.com",
    logoUrl: "/logos/gemini.png",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution:
      "국내 대학(원)생은 1년 무료에 이후 할인까지 받을 수 있어요. 다만 신청 마감이 정해져 있고 가입할 때 결제수단을 등록해야 해요.",
    aliases: ["제미나이", "제미니", "바드", "bard", "구글"],
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
      "식당을 찾고 지도를 보고 예약까지 한 번에 끝나요. 네이버 안의 장소·예약 정보는 외국 AI가 못 따라와요.",
    howToStart: "네이버 검색창에서 AI탭을 누르면 돼요. 앱 설치도 가입도 따로 필요 없어요.",
    pricingKind: "FREE",
    priceNote: "무료예요.",
    koreanLevel: "NATIVE",
    siteUrl: "https://www.naver.com",
    logoUrl: "/logos/naver-ai-tab.png",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution: "예전의 클로바X는 2026년 4월에 문을 닫았어요. 그 자리를 대신하는 서비스예요.",
    aliases: ["네이버", "클로바", "클로바X", "하이퍼클로바", "naver"],
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
      "내가 올린 강의자료랑 PDF만 읽고 답해요. 인터넷을 뒤지지 않으니까 엉뚱한 소리를 덜 해요.",
    howToStart:
      "구글 계정으로 로그인하고 새 노트북을 만든 다음, 강의 PDF를 끌어다 놓으면 끝이에요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료만으로도 공부 용도에는 충분해요.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote: "자료를 팟캐스트처럼 읽어주는 오디오 요약도 한국어를 지원해요.",
    siteUrl: "https://notebook.google",
    logoUrl: "/logos/gemini-notebook.png",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution: "2026년 7월에 이름이 바뀌었어요. 예전 이름은 노트북LM(NotebookLM)이에요.",
    aliases: ["노트북LM", "notebooklm", "노트북엘엠", "구글 노트북", "notebook lm"],
  },
  {
    slug: "perplexity",
    name: "퍼플렉시티",
    maker: "Perplexity AI",
    purpose: "RESEARCH",
    alsoFor: ["CHAT"],
    origin: "GLOBAL",
    summary:
      "답변 문장마다 출처 링크가 붙어요. 과제에 인용할 때 그 말이 어디서 나왔는지 바로 확인돼요.",
    howToStart: "perplexity.ai에 들어가면 로그인 없이도 기본 검색이 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 기본 검색 위주고, 깊은 검색은 하루 몇 번으로 제한돼요.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote: "한국어로 물어도 되지만 출처가 영어 문서 위주로 잡히는 편이에요.",
    siteUrl: "https://www.perplexity.ai",
    logoUrl: "/logos/perplexity.png",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution:
      "SKT 1년 무료 혜택을 소개하는 글이 아직 많이 남아 있는데, 이미 끝난 이벤트예요.",
    aliases: ["퍼플렉서티", "perplexity", "펄플렉시티"],
  },
  {
    slug: "liner",
    name: "라이너",
    maker: "라이너",
    purpose: "RESEARCH",
    origin: "KR",
    summary:
      "논문을 찾아서 여러 편을 비교표로 정리해 줘요. 긴 PDF를 한 장으로 줄이는 것도 돼요.",
    howToStart:
      "구글 계정으로 로그인하면 바로 검색할 수 있어요. 크롬 확장을 깔면 웹페이지에 형광펜을 치면서 쓸 수 있어요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 월 사용량 제한이 있고 광고가 붙어요.",
    studentFree: true,
    koreanLevel: "NATIVE",
    koreanNote: "한국 회사라 화면도 고객지원도 공지도 전부 한국어예요.",
    siteUrl: "https://liner.com/ko",
    logoUrl: "/logos/liner.png",
    platforms: ["WEB", "EXTENSION", "IOS", "ANDROID"],
    aliases: ["liner", "라이너AI"],
  },
  {
    slug: "scispace",
    name: "사이스페이스",
    maker: "SciSpace",
    purpose: "RESEARCH",
    origin: "GLOBAL",
    summary:
      "영어 논문에서 모르는 문단을 드래그해서 한국어로 물어볼 수 있어요. 수식이랑 표도 설명해 줘요.",
    howToStart: "가입 없이도 PDF를 올려서 바로 체험해 볼 수 있어요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 등급이 있는데 한도가 자료마다 다르게 적혀 있어서 직접 확인해 보셔야 해요.",
    koreanLevel: "GOOD",
    koreanNote:
      "한국어 페이지를 따로 운영해요. 영어 논문을 한국어로 물어볼 수 있다는 게 이 분야에서 제일 큰 장점이에요.",
    siteUrl: "https://scispace.com/ko",
    logoUrl: "/logos/scispace.png",
    platforms: ["WEB", "EXTENSION"],
    aliases: ["scispace", "타이프셋", "typeset"],
  },
  {
    slug: "consensus",
    name: "컨센서스",
    maker: "Consensus",
    purpose: "RESEARCH",
    origin: "GLOBAL",
    summary:
      "'커피가 건강에 좋나?' 같은 질문을 넣으면 실제 논문들이 찬성인지 반대인지 비율을 그려 줘요.",
    howToStart: "구글 계정으로 로그인한 다음 영어로 질문을 입력하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "논문 검색 자체는 무료로 제한 없이 돼요.",
    koreanLevel: "NONE",
    koreanNote:
      "화면이 영어 전용이고 한국어 논문은 거의 안 잡혀요. 영어로 질문해야 결과가 제대로 나와요.",
    siteUrl: "https://consensus.app",
    logoUrl: "/logos/consensus.png",
    platforms: ["WEB"],
    aliases: ["consensus"],
  },

  // --- 번역 · 글쓰기 -------------------------------------------------------
  {
    slug: "deepl",
    name: "딥엘",
    maker: "DeepL",
    purpose: "TRANSLATE",
    origin: "GLOBAL",
    summary: "논문이나 보고서처럼 딱딱한 글을 제일 자연스럽게 번역해 줘요.",
    howToStart: "deepl.com에 들어가서 원문을 붙여넣으면 가입 없이 바로 번역돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 한 번에 넣을 수 있는 글자 수랑 파일 수에 제한이 있어요.",
    koreanLevel: "GOOD",
    koreanNote:
      "문어체나 논문체는 최상급인데, 구어체나 속어는 파파고가 더 자연스럽다는 평이 많아요.",
    siteUrl: "https://www.deepl.com/ko/",
    logoUrl: "/logos/deepl.png",
    platforms: ["WEB", "DESKTOP", "IOS", "ANDROID", "EXTENSION"],
    aliases: ["deepl", "디플", "딥엘번역"],
  },
  {
    slug: "papago",
    name: "파파고",
    maker: "네이버",
    developerSlug: "naver",
    purpose: "TRANSLATE",
    origin: "KR",
    summary:
      "사진을 찍으면 번역되고 말을 하면 통역돼요. 한↔영·중·일 일상 표현이 특히 자연스러워요.",
    howToStart: "앱을 설치하면 가입 없이 바로 쓸 수 있어요.",
    pricingKind: "FREE",
    priceNote: "개인은 무료예요.",
    koreanLevel: "NATIVE",
    siteUrl: "https://papago.naver.com",
    logoUrl: "/logos/papago.png",
    platforms: ["IOS", "ANDROID", "WEB"],
    caution:
      "2024년 9월부터 웹페이지를 통째로 번역하는 기능이 빠졌어요. PC에서 그 기능을 쓰려면 네이버 웨일 브라우저가 필요해요.",
    aliases: ["papago", "네이버 번역", "파파고번역"],
  },
  {
    slug: "wrtn",
    name: "뤼튼",
    maker: "뤼튼테크놀로지스",
    purpose: "TRANSLATE",
    alsoFor: ["CHAT"],
    origin: "KR",
    summary: "여러 회사의 AI를 무료로 골라 쓸 수 있는 한국 서비스예요. 가입이 쉽고 전부 한국어예요.",
    howToStart: "네이버·카카오·구글 계정으로 간편 가입하면 바로 쓸 수 있어요.",
    pricingKind: "FREE",
    priceNote: "무료예요.",
    koreanLevel: "NATIVE",
    siteUrl: "https://wrtn.ai",
    logoUrl: "/logos/wrtn.png",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution:
      "회사의 중심이 캐릭터 채팅 쪽으로 옮겨가면서 이 어시스턴트 앱 사용자는 많이 줄었어요(2026년 7월 기준 월 23만 명, 1년 전보다 85만 명 감소). '한국 1등 AI'라는 소개는 지금은 맞지 않아요.",
    aliases: ["wrtn", "뤼튼AI", "리튼"],
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
      "한국인이 제일 많이 쓰는 디자인 사이트의 AI예요. 이 분야에서 한글이 안 깨지는 게 제일 확실해요.",
    howToStart: "접속해서 miricle AI → AI 프레젠테이션을 고르고 주제를 입력하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로도 월 몇 번은 만들 수 있고, 파워포인트 파일로 내려받는 것까지 무료예요.",
    koreanLevel: "NATIVE",
    koreanNote: "한국어 전용 폰트가 수백 종이라 자간이나 행간이 어색해지지 않아요.",
    siteUrl: "https://www.miricanvas.com",
    logoUrl: "/logos/miricanvas.png",
    platforms: ["WEB"],
    aliases: ["미리디", "miricanvas", "미리 캔버스"],
  },
  {
    slug: "gamma",
    name: "감마",
    maker: "Gamma",
    purpose: "SLIDES",
    alsoFor: ["WEBSITE"],
    origin: "GLOBAL",
    summary: "주제 한 줄만 쓰면 슬라이드 전체를 만들어 줘요. AI PPT 중에 제일 유명해요.",
    howToStart: "가입하고 새로 만들기 → 생성 → 프레젠테이션을 고른 다음 주제를 입력하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote:
      "무료 크레딧을 처음 한 번 주는데 다시 채워지지 않아요. 대략 10개 정도 만들 수 있어요.",
    koreanLevel: "PARTIAL",
    koreanNote:
      "한국어로 만들어지긴 하는데 자간이랑 행간이 어색하고, 긴 문장은 줄바꿈이 부자연스러워요.",
    siteUrl: "https://gamma.app",
    logoUrl: "/logos/gamma.png",
    platforms: ["WEB"],
    caution: "파워포인트 파일로 내보내면 한글 폰트가 깨지는 경우가 있어요.",
    aliases: ["gamma", "감마앱", "gamma app"],
  },
  {
    slug: "snapdeck",
    name: "스냅덱",
    maker: "에스크잇모어",
    purpose: "SLIDES",
    origin: "KR",
    summary:
      "'그래프 바꿔줘', '더 딱딱한 톤으로'처럼 대화하듯 말하면 슬라이드를 계속 고쳐 줘요.",
    howToStart: "가입하고 프롬프트 한 줄로 만든 다음, 이후에는 채팅으로 수정을 시키면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 월 크레딧이 적은 편이에요.",
    koreanLevel: "UNKNOWN",
    koreanNote:
      "한국 팀이 만들었고 한글 폰트 서비스도 따로 운영하는데, 실제 한글 슬라이드 품질을 확인할 자료를 찾지 못했어요. 사용자의 95% 이상이 해외라는 점도 같이 보셔야 해요.",
    siteUrl: "https://www.snapdeck.app",
    logoUrl: "/logos/snapdeck.png",
    platforms: ["WEB", "PLUGIN"],
    aliases: ["snapdeck", "스냅 덱"],
  },
  {
    slug: "canva",
    name: "캔바",
    maker: "Canva",
    purpose: "SLIDES",
    alsoFor: ["IMAGE", "WEBSITE"],
    origin: "GLOBAL",
    summary:
      "디자인을 못 해도 포스터나 발표자료, SNS 이미지를 만들 수 있어요. 템플릿이 제일 많아요.",
    howToStart:
      "한국어 사이트에 가입한 다음 만들고 싶은 걸 검색창에 적으면 템플릿을 추천해 줘요.",
    pricingKind: "FREEMIUM",
    priceNote: "AI 기능이 무료 플랜에도 열려 있어요. 무료는 AI 사용 횟수에 월 제한이 있어요.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote:
      "한국어 화면이랑 원화 결제를 지원해요. 다만 영문 템플릿을 그대로 쓰면 기본 폰트가 영문이라 한글 폰트로 바꿔주셔야 해요.",
    siteUrl: "https://www.canva.com/ko_kr/",
    logoUrl: "/logos/canva.png",
    platforms: ["WEB", "IOS", "ANDROID", "DESKTOP"],
    aliases: ["canva", "칸바", "캠바"],
  },

  // --- 기록 · 정리 ---------------------------------------------------------
  {
    slug: "notion-ai",
    name: "노션 AI",
    maker: "Notion",
    purpose: "NOTE",
    alsoFor: ["TRANSLATE", "WEBSITE"],
    origin: "GLOBAL",
    summary: "노트랑 과제, 일정을 한곳에 모아두고 그 안에서 요약이랑 번역까지 해요.",
    howToStart: "가입하고 페이지에서 슬래시(/)를 누른 다음 ai를 입력하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "학교 이메일로 인증하면 1인 워크스페이스가 무료예요. 매년 다시 인증해야 해요.",
    studentFree: true,
    koreanLevel: "GOOD",
    siteUrl: "https://www.notion.com",
    logoUrl: "/logos/notion-ai.png",
    platforms: ["WEB", "DESKTOP", "IOS", "ANDROID", "EXTENSION"],
    caution: "교육 플랜에 AI 기능이 어디까지 포함되는지는 공식 문서에 나와 있지 않아요.",
    aliases: ["notion", "노션", "노숀"],
  },
  {
    slug: "clova-note",
    name: "클로바노트",
    maker: "네이버",
    developerSlug: "naver",
    purpose: "NOTE",
    origin: "KR",
    summary: "녹음만 켜두면 한국어를 알아서 받아 적고 요약까지 해줘요. 강의 녹음에 쓰기 좋아요.",
    howToStart:
      "앱을 깔거나 웹에 들어가서 네이버 계정으로 로그인한 다음, 새 노트에서 녹음을 시작하면 돼요.",
    pricingKind: "FREE",
    priceNote:
      "개인은 사실상 무료예요. 월 무료 시간이 정해져 있고 데이터 제공에 동의하면 두 배가 돼요. 개인용 유료 상품 자체가 없어요.",
    koreanLevel: "NATIVE",
    siteUrl: "https://clovanote.naver.com",
    platforms: ["WEB", "IOS", "ANDROID"],
    aliases: ["클로바 노트", "clovanote", "네이버 녹음"],
  },
  {
    slug: "tiro",
    name: "티로",
    maker: "더플레이토",
    purpose: "NOTE",
    alsoFor: ["TRANSLATE"],
    origin: "KR",
    summary:
      "받아 적으면서 동시에 번역까지 돼요. 한국어 인식률을 수치로 공개하는 몇 안 되는 서비스예요.",
    howToStart: "앱을 깔거나 웹에 가입하면 체험 시간을 줘요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 체험은 기간이랑 시간이 정해져 있고, 이후에는 월 사용 시간 단위로 결제해요.",
    koreanLevel: "NATIVE",
    siteUrl: "https://tiro.ooo",
    logoUrl: "/logos/tiro.png",
    platforms: ["WEB", "DESKTOP", "IOS", "ANDROID"],
    aliases: ["tiro", "티로노트"],
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
      "여러 회사의 이미지·영상 모델 수십 개를 한 구독으로 골라 쓰는 곳이에요. 어도비가 직접 만든 모델은 저작권이 정리돼 있어서 과제나 공모전에 쓰기 안전해요.",
    howToStart: "어도비 계정으로 로그인하면 웹에서 바로 쓸 수 있어요. 포토샵이 없어도 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 매일 일정 횟수를 만들 수 있고 매일 다시 차요.",
    koreanLevel: "GOOD",
    koreanNote: "한국어를 포함해서 100개 넘는 언어로 지시할 수 있어요.",
    siteUrl: "https://firefly.adobe.com",
    logoUrl: "/logos/adobe-firefly.png",
    platforms: ["WEB", "IOS", "ANDROID", "PLUGIN"],
    caution:
      "'저작권 안전'은 어도비가 직접 만든 모델을 쓸 때만 해당해요. 안에 들어 있는 다른 회사 모델은 별개예요.",
    aliases: ["firefly", "파이어플라이", "어도비", "adobe"],
  },
  {
    slug: "dreamina",
    name: "드림이나",
    maker: "ByteDance",
    purpose: "IMAGE",
    alsoFor: ["VIDEO", "AVATAR"],
    origin: "GLOBAL",
    summary:
      "캡컷을 만든 회사의 형제 서비스예요. 바이트댄스가 직접 만든 이미지·영상 모델을 제일 먼저 쓸 수 있는 공식 창구예요.",
    howToStart: "한국어 사이트에 접속해서 가입하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "매일 무료 크레딧을 줘요. 정확한 수량은 공개돼 있지 않아요.",
    koreanLevel: "PARTIAL",
    koreanNote:
      "화면은 한국어인데, 한국어로 지시했을 때의 품질이나 결과물에 한글이 들어가는지는 확인하지 못했어요.",
    siteUrl: "https://dreamina.capcut.com/ko-kr",
    logoUrl: "/logos/dreamina.png",
    platforms: ["WEB"],
    caution:
      "'Seedance'로 검색하면 공식이 아닌 제휴 사이트가 잔뜩 나와요. Seedance는 서비스 이름이 아니라 이 안에서 고르는 모델 이름이에요.",
    aliases: ["dreamina", "드리미나", "시드댄스", "seedance", "즉몽"],
  },
  {
    slug: "midjourney",
    name: "미드저니",
    maker: "Midjourney",
    purpose: "IMAGE",
    origin: "GLOBAL",
    summary: "분위기 있고 예술적인 그림에 특화돼 있어요. 결과물의 작품성으로는 여전히 기준점이에요.",
    howToStart:
      "이제는 디스코드 없이 웹사이트에서 써요. 다만 가입하자마자 결제해야 첫 장을 만들 수 있어요.",
    pricingKind: "PAID",
    priceNote: "무료로 써볼 방법이 없어요. 가장 싼 단계도 매달 내야 해요.",
    koreanLevel: "NONE",
    koreanNote: "화면이 영어고 한국어 지시를 잘 못 알아들어요. 그림 안의 한글도 약해요.",
    siteUrl: "https://www.midjourney.com",
    logoUrl: "/logos/midjourney.png",
    platforms: ["WEB"],
    caution:
      "무료 체험이 2023년에 없어졌고 환불도 거의 안 돼요. 돈 낼 생각이 없으시면 다른 걸 먼저 써보시는 게 나아요.",
    aliases: ["midjourney", "미드져니", "MJ"],
  },

  // --- 영상 ----------------------------------------------------------------
  {
    slug: "capcut",
    name: "캡컷",
    maker: "ByteDance",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary: "휴대폰으로 숏폼 만들 때 제일 많이 쓰는 편집 앱이에요. 자동 자막이랑 AI 목소리가 들어 있어요.",
    howToStart: "앱을 설치하거나 웹에서 바로 시작하면 돼요. 신용카드가 필요 없어요.",
    pricingKind: "FREEMIUM",
    priceNote: "기본 편집은 무료로 충분해요.",
    koreanLevel: "GOOD",
    siteUrl: "https://www.capcut.com/ko-kr/",
    logoUrl: "/logos/capcut.png",
    platforms: ["IOS", "ANDROID", "WEB", "DESKTOP"],
    aliases: ["capcut", "캡켓", "캡컷프로"],
  },
  {
    slug: "vrew",
    name: "브루",
    maker: "보이저엑스",
    purpose: "VIDEO",
    origin: "KR",
    summary: "영상에 자막을 자동으로 달아줘요. 한국어 음성 인식 정확도가 이 프로그램의 핵심이에요.",
    howToStart: "공식 사이트에서 프로그램을 내려받아 설치하고 회원가입하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 월 분석 시간에 제한이 있고 결과물에 워터마크가 붙어요.",
    studentFree: true,
    koreanLevel: "NATIVE",
    siteUrl: "https://vrew.ai/ko/",
    logoUrl: "/logos/vrew.png",
    platforms: ["DESKTOP", "WEB"],
    caution: "교육기관 할인이 따로 있어요.",
    aliases: ["vrew", "브루자막", "뷰루"],
  },
  {
    slug: "google-flow",
    name: "구글 플로우",
    maker: "Google",
    developerSlug: "google",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary: "문장만 쓰면 소리까지 들어간 영상을 만들어 줘요. 무료로 매일 몇 편씩 시도해 볼 수 있어요.",
    howToStart:
      "구글 계정으로 로그인하면 돼요. 만 18세 이상 인증이 필요하고 크롬이나 엣지에서 열어야 해요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 하루 50크레딧을 주고 매일 다시 차요. 가벼운 모델 기준 하루 다섯 편 정도예요.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote:
      "화면은 한국어를 지원하는데, 구글이 공식적으로는 영어로 지시하길 권하고 다른 언어는 품질이 달라질 수 있다고 안내해요.",
    siteUrl: "https://flow.google.com",
    logoUrl: "/logos/google-flow.png",
    platforms: ["WEB"],
    caution:
      "무료로 쓸 수 있는지를 두고 구글 공식 문서끼리 설명이 엇갈려요(구독 필수라는 문서와 비구독자도 하루 50크레딧이라는 문서). 직접 확인해 보셔야 해요.",
    aliases: ["flow", "플로우", "veo", "비오", "구글 veo"],
  },
  {
    slug: "kling",
    name: "클링",
    maker: "Kuaishou",
    purpose: "VIDEO",
    alsoFor: ["IMAGE"],
    origin: "GLOBAL",
    summary: "사진 한 장을 움직이는 영상으로 바꾸는 용도로 특히 많이 써요.",
    howToStart: "한국어 사이트에서 이메일로 가입하면 돼요. 중국 전화번호는 필요 없어요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 크레딧이 적어서 맛보기 수준이에요.",
    koreanLevel: "GOOD",
    koreanNote: "메뉴랑 기능 이름까지 한국어로 번역돼 있어요.",
    siteUrl: "https://kling.ai/ko",
    logoUrl: "/logos/kling.png",
    platforms: ["WEB", "IOS", "ANDROID"],
    aliases: ["kling", "클링AI", "커링"],
  },
  {
    slug: "hailuo",
    name: "하이루오",
    maker: "MiniMax",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary:
      "매일 크레딧이 자동으로 충전돼서 돈을 안 내고도 계속 시도해 볼 수 있어요. 사람 동작 표현이 좋은 편이에요.",
    howToStart:
      "구글이나 애플 계정으로 가입하면 돼요. 템플릿을 골라서 누르는 놀이 기능이 있어서 처음 쓰기 쉬워요.",
    pricingKind: "FREEMIUM",
    priceNote: "가입할 때 크레딧을 주고 이후에는 매일 자동으로 충전돼요. 유료도 이 목록에서 저렴한 축이에요.",
    koreanLevel: "PARTIAL",
    koreanNote: "한국어 지시는 잘 알아듣는 편인데, 화면의 한국어 지원은 확인하지 못했어요.",
    siteUrl: "https://hailuoai.video",
    logoUrl: "/logos/hailuo.png",
    platforms: ["WEB", "IOS"],
    aliases: ["hailuo", "하이루", "미니맥스", "minimax"],
  },
  {
    slug: "runway",
    name: "런웨이",
    maker: "Runway",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary: "영상 제작자들이 실제 작업에 쓰는 도구예요. 생성이랑 편집을 같이 해요.",
    howToStart: "웹에 가입하면 체험용 크레딧을 줘요.",
    pricingKind: "TRIAL",
    priceNote: "무료 크레딧은 처음 한 번만 주고 다시 채워지지 않아요.",
    koreanLevel: "NONE",
    siteUrl: "https://runway.com",
    logoUrl: "/logos/runway.png",
    platforms: ["WEB", "IOS"],
    caution:
      "무료 크레딧으로 5초짜리 영상 두 편 정도 만들면 끝나요. 갱신되지 않으니까 '무료로 써본다'는 기대는 안 하시는 게 좋아요.",
    aliases: ["runway", "런웨이ML", "runwayml", "gen-3"],
  },
  {
    slug: "higgsfield",
    name: "힉스필드",
    maker: "Higgsfield",
    purpose: "VIDEO",
    origin: "GLOBAL",
    summary:
      "여러 회사의 영상 AI를 한 구독으로 쓰면서, '카메라가 이렇게 움직이는 장면' 같은 효과를 골라 누르는 방식으로 만들어요.",
    howToStart: "웹에 가입하면 돼요. 하루짜리 무료 체험이 있는데 신용카드를 먼저 등록해야 해요.",
    pricingKind: "TRIAL",
    priceNote:
      "무료 플랜으로는 영상을 만들 수 없고, 크레딧은 구독이 있어야 생겨요. 남은 크레딧은 다음 달로 넘어가지 않아요.",
    koreanLevel: "UNKNOWN",
    koreanNote:
      "화면이 영어인 건 확인했는데, 한국어로 지시했을 때 결과가 어떤지는 확인하지 못했어요. 무료로 만들어 볼 수가 없어서 직접 시험해 보지 못했어요.",
    siteUrl: "https://higgsfield.ai",
    logoUrl: "/logos/higgsfield.png",
    platforms: ["WEB"],
    caution:
      "요금제랑 크레딧 소모량이 출처마다 최대 다섯 배까지 다르게 적혀 있어요. 결제 전에 공식 페이지에서 직접 확인해 보세요.",
    aliases: ["higgsfield", "힉스 필드", "힉시필드"],
  },

  // --- 아바타 영상 ---------------------------------------------------------
  {
    slug: "ai-studios",
    name: "AI 스튜디오스",
    maker: "딥브레인AI",
    purpose: "AVATAR",
    origin: "KR",
    summary:
      "대본만 넣으면 사람이 말하는 것 같은 영상이 나와요. 무료 상태에서도 내 얼굴로 아바타를 하나 만들 수 있어요.",
    howToStart: "한국어 사이트에 가입하고 대본을 입력하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 매달 짧은 영상 몇 편을 만들 수 있고 매월 다시 차요.",
    koreanLevel: "NATIVE",
    siteUrl: "https://www.aistudios.com/ko",
    logoUrl: "/logos/ai-studios.png",
    platforms: ["WEB"],
    caution: "같은 일을 하는 해외 서비스 HeyGen은 무료 플랜에서 내 얼굴 아바타를 못 만들어요.",
    aliases: ["aistudios", "딥브레인", "deepbrain", "AI스튜디오"],
  },
  {
    slug: "heygen",
    name: "헤이젠",
    maker: "HeyGen",
    purpose: "AVATAR",
    origin: "GLOBAL",
    summary: "말하는 아바타 영상을 만드는 서비스 중에 사용자가 제일 많아요. 지원 언어 수가 압도적이에요.",
    howToStart: "웹에 가입하고 대본을 입력하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 매달 1분 이내 영상 몇 편을 만들 수 있어요.",
    koreanLevel: "UNKNOWN",
    koreanNote: "한국어 사용기는 많은데 공식 문서에서 한국어 지원을 확인하지는 못했어요.",
    siteUrl: "https://www.heygen.com",
    logoUrl: "/logos/heygen.png",
    platforms: ["WEB"],
    aliases: ["heygen", "헤이겐", "히이젠"],
  },

  // --- 음악 · 목소리 -------------------------------------------------------
  {
    slug: "suno",
    name: "수노",
    maker: "Suno",
    purpose: "AUDIO",
    origin: "GLOBAL",
    summary: "한 줄만 쓰면 가사랑 멜로디, 보컬이 다 들어간 완성곡이 나와요.",
    howToStart: "웹에 가입하고 만들고 싶은 노래를 설명하면 돼요. 설치할 게 없어요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 하루 크레딧을 주고 매일 다시 차요.",
    koreanLevel: "GOOD",
    koreanNote: "한국어 가사로 노래를 만들 수 있어요.",
    siteUrl: "https://suno.com",
    logoUrl: "/logos/suno.png",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution:
      "무료로는 만들어서 듣는 것만 되고 파일로 내려받을 수 없어요. 상업적으로 쓰는 것도 유료부터예요.",
    aliases: ["suno", "수노AI", "쑤노"],
  },
  {
    slug: "elevenlabs",
    name: "일레븐랩스",
    maker: "ElevenLabs",
    purpose: "AUDIO",
    origin: "GLOBAL",
    summary: "글을 넣으면 사람이 읽는 것처럼 자연스러운 목소리로 바꿔 줘요. 영상 나레이션에 많이 써요.",
    howToStart: "웹에 가입해서 문장을 넣고 목소리를 고르면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 매달 10분 분량 정도를 만들 수 있고 매월 다시 차요.",
    koreanLevel: "GOOD",
    koreanNote:
      "한국어를 지원하고 자연스러운 편이에요. 숫자랑 영문 약어는 한글로 풀어서 넣어야 제대로 읽어요(예: 2026 → 이천이십육).",
    siteUrl: "https://elevenlabs.io/ko",
    logoUrl: "/logos/elevenlabs.png",
    platforms: ["WEB"],
    aliases: ["elevenlabs", "일레븐 랩스", "11labs", "엘레븐랩스"],
  },
  {
    slug: "supertone-play",
    name: "슈퍼톤 플레이",
    maker: "수퍼톤",
    purpose: "AUDIO",
    origin: "KR",
    summary:
      "글을 음성으로 바꿔 주는 도구인데, 한국 회사가 한국어를 1순위로 두고 만들어서 억양이 목적에 잘 맞아요.",
    howToStart: "가입 없이 먼저 들어볼 수 있고, 체험할 때 신용카드를 등록하지 않아도 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "체험 크레딧을 한 번 주고, 이후에는 글자 수 단위로 결제해요.",
    koreanLevel: "NATIVE",
    koreanNote: "지원 언어 20여 개 중에 한국어를 기준으로 설계했어요.",
    siteUrl: "https://www.supertone.ai/play",
    logoUrl: "/logos/supertone-play.png",
    platforms: ["WEB", "DESKTOP"],
    aliases: ["supertone", "수퍼톤", "슈퍼톤"],
  },

  // --- 만능 에이전트 -------------------------------------------------------
  // 대화만 하는 게 아니라 **대신 일까지 해주는** 쪽. 대표 용도를 하나로 정하기
  // 어려운 종류라 alsoFor를 넉넉히 준다. 그래야 "PPT 만들려면?" 탭에서도 뜬다.
  {
    slug: "manus",
    name: "마누스",
    maker: "Manus AI",
    purpose: "CHAT",
    alsoFor: ["RESEARCH", "SLIDES", "CODE"],
    origin: "GLOBAL",
    summary:
      "답만 주는 게 아니라 시킨 일을 끝까지 대신 해요. 자료를 찾아보고 파일을 만들고 사이트까지 돌아다니면서 결과물을 내놔요.",
    howToStart: "웹에 가입하고 시킬 일을 한 줄로 적으면 돼요. 앱과 PC 프로그램도 있어요.",
    pricingKind: "FREEMIUM",
    priceNote:
      "무료 플랜이 있고 크레딧은 결제 주기마다 다시 차요. 매일 차는 방식이 아니라서 아껴 써야 해요.",
    koreanLevel: "GOOD",
    koreanNote: "공식 문서를 한국어로 운영해요. 한국어로 지시해도 알아들어요.",
    siteUrl: "https://manus.im",
    logoUrl: "/logos/manus.png",
    platforms: ["WEB", "DESKTOP", "IOS", "ANDROID"],
    caution:
      "일 하나에 크레딧이 꽤 많이 들어가요. 무료 크레딧은 '몇 번 시켜보는' 정도지 계속 쓰는 용도가 아니에요.",
    aliases: ["manus", "마누스AI", "매너스", "마뉴스"],
  },
  {
    slug: "genspark",
    name: "젠스파크",
    maker: "Genspark",
    purpose: "SLIDES",
    alsoFor: ["CHAT", "RESEARCH", "IMAGE", "VIDEO"],
    origin: "GLOBAL",
    summary:
      "한국에서는 'PPT 잘 만드는 AI'로 제일 많이 알려졌어요. 발표자료 말고도 문서·이미지·영상까지 한 곳에서 다 돼요.",
    howToStart: "한국어 사이트에 가입하고 만들고 싶은 걸 적으면 돼요. 앱도 있어요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로도 매일 크레딧을 주고 다음 날 다시 차요.",
    koreanLevel: "GOOD",
    koreanNote: "한국어 사이트를 따로 운영하고, 한국어로 만든 발표자료 후기도 많아요.",
    siteUrl: "https://www.genspark.ai/ko",
    logoUrl: "/logos/genspark.png",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution:
      "무료로 주는 크레딧 수량이 출처마다 다르게 적혀 있어요(하루 100 / 200). 공식 요금제 페이지에서 직접 확인해 보세요.",
    aliases: ["genspark", "젠 스파크", "겐스파크", "잰스파크"],
  },

  // --- 웹사이트 · 포트폴리오 ----------------------------------------------
  // 코드를 안 보여주고 사이트를 만들어 주는 쪽. 코드를 짜서 올려주는 볼트·v0 등은
  // 아래 코딩 섹션에 두고 alsoFor로 이 탭에도 뜨게 한다(SPEC 23.13).
  // 아임웹은 뺐다 — 2025년 7월에 무료 플랜이 없어지고 14일 체험만 남았고,
  // 사업자용이라 포트폴리오 하나 만들려는 사람에게는 맞지 않는다.
  {
    slug: "wix",
    name: "윅스",
    maker: "Wix",
    purpose: "WEBSITE",
    origin: "GLOBAL",
    summary:
      "만들고 싶은 사이트를 설명하면 AI가 초안을 만들어 주고, 그다음은 끌어다 놓으면서 고쳐요. 무료로도 바로 주소가 생겨요.",
    howToStart: "가입하면 바로 시작할 수 있어요. 신용카드는 필요 없어요.",
    pricingKind: "FREEMIUM",
    priceNote:
      "무료로도 사이트를 공개할 수 있어요. 대신 주소가 wixsite.com 아래로 붙고, 내 도메인 연결은 유료예요.",
    koreanLevel: "GOOD",
    koreanNote:
      "편집 화면이 한국어로 나와요. 다만 AI한테 한국어로 설명했을 때 초안이 얼마나 잘 나오는지는 확인하지 못했어요.",
    siteUrl: "https://www.wix.com/ai-website-builder",
    logoUrl: "/logos/wix.png",
    platforms: ["WEB", "IOS", "ANDROID"],
    caution: "무료 사이트는 맨 위에 윅스 광고 띠가 붙고, 이건 유료로 바꿔야 없어져요.",
    aliases: ["wix", "윅스닷컴", "윅스 ai", "홈페이지 만들기", "포트폴리오"],
  },
  {
    slug: "framer",
    name: "프레이머",
    maker: "Framer",
    purpose: "WEBSITE",
    origin: "GLOBAL",
    summary:
      "디자인이 세련된 사이트를 만들 때 많이 써요. AI한테 설명하면 페이지 구성부터 글, 이미지까지 한 번에 깔아 줘요.",
    howToStart: "가입하면 무료 작업 공간에 AI 크레딧을 줘요. 그걸로 먼저 만들어 보면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote:
      "무료로도 사이트를 공개할 수 있어요. 대신 프레이머 하위 주소로 올라가고 'Made in Framer' 표시가 떠요. 내 도메인은 유료예요.",
    studentFree: true,
    koreanLevel: "PARTIAL",
    koreanNote:
      "화면이 영어예요. 한글 글꼴은 구글 폰트나 직접 올려서 쓸 수 있어요. 한국어로 설명했을 때 AI 결과는 확인하지 못했어요.",
    siteUrl: "https://www.framer.com/ai/",
    logoUrl: "/logos/framer.png",
    platforms: ["WEB"],
    caution:
      "대학생은 학교 이메일과 학생증 사진으로 신청하면 유료 기본 플랜을 1년 동안 무료로 쓸 수 있어요. 지금 찾은 학생 혜택 중에 가장 커요.",
    aliases: ["framer", "프래이머", "프레이머 ai", "포트폴리오"],
  },
  {
    slug: "zaemit",
    name: "재밋",
    maker: "위븐",
    purpose: "WEBSITE",
    origin: "KR",
    summary:
      "한 줄로 설명하면 3분 안에 홈페이지를 만들어 주는 한국 서비스예요. 포트폴리오도 대표 용도로 내세우고 있어요.",
    howToStart: "카카오·네이버·구글 계정으로 가입하고 만들고 싶은 사이트를 적으면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 플랜으로도 AI로 만들고 기본 주소로 공개하는 것까지 돼요. 내 도메인 연결은 유료부터예요.",
    koreanLevel: "NATIVE",
    siteUrl: "https://zaemit.kr",
    logoUrl: "/logos/zaemit.png",
    platforms: ["WEB"],
    caution:
      "무료 사이트에 재밋 표시가 붙는지, AI로 몇 번까지 만들 수 있는지는 공식 자료에서 확인하지 못했어요.",
    aliases: ["zaemit", "재밋ai", "제밋", "위븐", "포트폴리오", "홈페이지 만들기"],
  },

  // --- 코딩 · 앱 만들기 ----------------------------------------------------
  {
    slug: "github-copilot",
    name: "깃허브 코파일럿",
    maker: "GitHub",
    purpose: "CODE",
    origin: "GLOBAL",
    summary: "코드를 짜다 멈칫하면 다음 줄을 회색 글씨로 미리 보여줘요. 코딩 입문자한테 부담이 제일 적어요.",
    howToStart: "깃허브에 가입해서 학생 인증을 받고, VS Code에 확장 프로그램을 설치하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "학생 인증을 받으면 무료로 쓸 수 있어요.",
    studentFree: true,
    koreanLevel: "GOOD",
    koreanNote: "설명은 한국어로 받을 수 있는데 코드 주석이나 변수명은 영어가 나아요.",
    siteUrl: "https://github.com/features/copilot",
    logoUrl: "/logos/github-copilot.png",
    platforms: ["PLUGIN", "DESKTOP"],
    caution:
      "2026년 3월부터 학생 플랜에서는 쓸 AI 모델을 직접 고를 수 없고 자동 선택만 돼요.",
    aliases: ["copilot", "코파일럿", "깃헙 코파일럿", "github copilot"],
  },
  {
    slug: "lovable",
    name: "러버블",
    maker: "Lovable",
    purpose: "CODE",
    alsoFor: ["WEBSITE"],
    origin: "GLOBAL",
    summary:
      "채팅으로 원하는 걸 설명하면 실제로 동작하는 웹사이트가 나오고 주소까지 바로 생겨요. 코딩을 몰라도 돼요.",
    howToStart: "가입하고 만들고 싶은 걸 한국어로 설명하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료 크레딧은 하루·월 단위로 정해져 있고 작은 프로젝트 하나 정도 분량이에요.",
    koreanLevel: "GOOD",
    koreanNote: "한국어로 지시할 수 있고 결과물의 화면 글자도 한국어로 나와요.",
    siteUrl: "https://lovable.dev",
    logoUrl: "/logos/lovable.png",
    platforms: ["WEB"],
    aliases: ["lovable", "러버블AI", "로버블"],
  },
  {
    slug: "claude-code",
    name: "클로드 코드",
    maker: "Anthropic",
    developerSlug: "anthropic",
    purpose: "CODE",
    origin: "GLOBAL",
    summary:
      "터미널에서 '이 버그 고쳐줘'라고 말하면 파일을 직접 읽고 고쳐요. 자동완성이 아니라 대신 일해주는 쪽에 가까워요.",
    howToStart: "터미널에 설치 명령 한 줄을 붙여넣으면 돼요. 웹이나 편집기 확장으로도 쓸 수 있어요.",
    pricingKind: "FREEMIUM",
    priceNote: "Claude 유료 구독에 포함돼 있어서 따로 결제하지 않아도 돼요.",
    koreanLevel: "GOOD",
    siteUrl: "https://www.claude.com/product/claude-code",
    logoUrl: "/logos/claude-code.png",
    platforms: ["DESKTOP", "WEB", "PLUGIN", "IOS", "ANDROID"],
    caution: "터미널을 처음 써보시는 분한테는 진입 장벽이 있어요. 코딩을 두세 달쯤 해본 뒤가 좋아요.",
    aliases: ["claude code", "클코", "cc", "클로드코드"],
  },
  {
    slug: "kiro",
    name: "키로",
    maker: "AWS",
    purpose: "CODE",
    origin: "GLOBAL",
    summary:
      "바로 코드를 짜지 않고 '뭘 만들 건지'를 먼저 문서로 정리한 다음에 그걸 보고 짜요. 혼자 만들다 방향이 엎어지는 걸 줄이려는 방식이에요.",
    howToStart:
      "사이트에서 프로그램을 내려받아 설치하고, 구글 같은 소셜 계정이나 AWS Builder ID로 로그인하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 매달 크레딧 50개를 줘요. 쓰고 남은 건 다음 달로 넘어가지 않아요.",
    koreanLevel: "UNKNOWN",
    koreanNote: "한국어 화면 지원 여부를 공식 문서에서 확인하지 못했어요.",
    siteUrl: "https://kiro.dev",
    logoUrl: "/logos/kiro.png",
    platforms: ["DESKTOP", "WEB", "PLUGIN"],
    aliases: ["kiro", "아마존 키로", "aws kiro", "키로IDE"],
  },
  {
    slug: "antigravity",
    name: "안티그래비티",
    maker: "Google",
    developerSlug: "google",
    purpose: "CODE",
    origin: "GLOBAL",
    summary:
      "AI 여러 개한테 동시에 일을 시키고, 각자 뭘 하고 있는지 한 화면에서 지켜보는 개발 도구예요. 지금은 돈을 안 받아요.",
    howToStart: "사이트에서 내려받아 설치하면 돼요. 윈도우·맥·리눅스 다 있어요.",
    pricingKind: "FREE",
    priceNote: "구글이 무료로 공개하고 있어요. 유료 단계가 아직 없어요.",
    koreanLevel: "UNKNOWN",
    koreanNote: "한국어 화면 지원 여부를 공식 문서에서 확인하지 못했어요.",
    siteUrl: "https://antigravity.google",
    logoUrl: "/logos/antigravity.png",
    platforms: ["DESKTOP"],
    aliases: ["antigravity", "안티그라비티", "구글 안티그래비티", "안티 그래비티"],
  },
  {
    slug: "jules",
    name: "줄스",
    maker: "Google",
    developerSlug: "google",
    purpose: "CODE",
    origin: "GLOBAL",
    summary:
      "깃허브 저장소를 맡겨두면 혼자 고쳐서 결과를 올려놔요. 내 컴퓨터에 설치하는 게 아니라 구글 쪽에서 돌아가요.",
    howToStart: "구글 계정으로 로그인하고 깃허브 저장소를 연결한 다음, 시킬 일을 적으면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료로 하루 15번까지 일을 시킬 수 있고 매일 다시 차요.",
    koreanLevel: "UNKNOWN",
    koreanNote: "한국어 화면 지원 여부를 공식 문서에서 확인하지 못했어요.",
    siteUrl: "https://jules.google",
    logoUrl: "/logos/jules.png",
    platforms: ["WEB"],
    caution: "깃허브 계정이 있어야 써요. 저장소를 연결하지 않으면 시작 자체가 안 돼요.",
    aliases: ["jules", "쥴스", "구글 줄스"],
  },
  // 말로 설명하면 코드·디자인·배포까지 한 번에 해서 주소를 주는 쪽.
  // 러버블과 같은 부류다. 전부 웹사이트 탭에도 뜨게 alsoFor에 WEBSITE를 넣는다.
  // Firebase Studio는 뺐다 — 2026년 6월에 신규 가입이 막혔고 2027년 3월에 닫힌다.
  {
    slug: "google-ai-studio",
    name: "구글 AI 스튜디오",
    maker: "Google",
    developerSlug: "google",
    purpose: "CODE",
    alsoFor: ["WEBSITE"],
    origin: "GLOBAL",
    summary:
      "만들고 싶은 앱을 말로 설명하면 코드를 짜고, 바로 써볼 수 있는 주소까지 만들어 줘요. 이 분야에서 무료로 시작하기 가장 쉬워요.",
    howToStart: "구글 계정으로 들어가서 Build 화면에 만들고 싶은 걸 적으면 돼요. 카드 등록은 필요 없어요.",
    pricingKind: "FREEMIUM",
    priceNote:
      "만드는 건 무료예요. 완성한 앱을 공개하는 건 두 개까지 무료고, 그 뒤로는 구글 클라우드 사용료가 나와요.",
    koreanLevel: "GOOD",
    koreanNote:
      "한국어로 설명해도 잘 알아듣고, 공식 문서도 한국어로 나와 있어요. 화면 메뉴가 한국어로 나오는지는 확인하지 못했어요.",
    siteUrl: "https://aistudio.google.com",
    logoUrl: "/logos/google-ai-studio.png",
    platforms: ["WEB"],
    caution:
      "내가 공개한 앱을 다른 사람이 쓰면 그 사용량이 내 한도에서 빠져요. 여기저기 많이 돌리기 전에 알아두세요.",
    aliases: ["ai studio", "aistudio", "구글 ai스튜디오", "에이아이 스튜디오", "바이브 코딩", "vibe coding"],
  },
  {
    slug: "bolt",
    name: "볼트",
    maker: "StackBlitz",
    purpose: "CODE",
    alsoFor: ["WEBSITE"],
    origin: "GLOBAL",
    summary:
      "웹사이트를 화면부터 서버, 데이터베이스까지 통째로 만들어서 바로 올려줘요.",
    howToStart: "bolt.new에 가입하고 만들고 싶은 걸 적으면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote:
      "무료 사용량이 매일 다시 차고 월 한도가 따로 있어요. 무료로도 공개할 수 있지만 볼트 표시가 붙고, 내 도메인은 유료예요.",
    koreanLevel: "UNKNOWN",
    koreanNote: "한국어 지원 여부를 공식 문서에서 확인하지 못했어요.",
    siteUrl: "https://bolt.new",
    logoUrl: "/logos/bolt.png",
    platforms: ["WEB"],
    caution: "프로젝트가 커질수록 한 번 고칠 때 드는 사용량이 늘어요. 버그를 고치다 보면 하루치가 금방 끝나요.",
    aliases: ["bolt", "bolt.new", "볼트뉴", "스택블리츠", "stackblitz"],
  },
  {
    slug: "replit",
    name: "레플릿",
    maker: "Replit",
    purpose: "CODE",
    alsoFor: ["WEBSITE"],
    origin: "GLOBAL",
    summary:
      "AI 에이전트가 계획을 세우고 코드를 짜고 테스트까지 한 다음, 링크로 올려줘요.",
    howToStart: "가입하고 Agent에 만들고 싶은 걸 적으면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 매일 크레딧이 다시 차고 월 한도가 있어요. 무료로 공개할 수 있는 앱은 하나예요.",
    koreanLevel: "GOOD",
    koreanNote: "공식 문서가 한국어로 나와 있고, 한국어로 지시하는 예시도 들어 있어요.",
    siteUrl: "https://replit.com",
    logoUrl: "/logos/replit.png",
    platforms: ["WEB"],
    caution:
      "무료로 공개한 앱은 30일 뒤에 자동으로 내려가요. 포트폴리오 링크로 오래 걸어두려면 유료가 필요해요.",
    aliases: ["replit", "리플릿", "레플잇", "레플릿 에이전트"],
  },
  {
    slug: "v0",
    name: "v0",
    maker: "Vercel",
    purpose: "CODE",
    alsoFor: ["WEBSITE"],
    origin: "GLOBAL",
    summary:
      "보기 좋은 화면을 만드는 데 특히 강해요. 만든 걸 버셀에 바로 올려서 주소까지 생겨요.",
    howToStart: "v0.app에 가입하고 만들고 싶은 화면을 설명하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 하루 7번까지 메시지를 보낼 수 있고, 무료로도 버셀에 올릴 수 있어요.",
    koreanLevel: "UNKNOWN",
    koreanNote: "한국어 지원 여부를 공식 문서에서 확인하지 못했어요.",
    siteUrl: "https://v0.app",
    logoUrl: "/logos/v0.png",
    platforms: ["WEB"],
    caution: "하루 7번은 몇 번 고치다 보면 금방 끝나요. 대학생 무료 혜택이 있지만 미국 일부 학교만 해당돼요.",
    aliases: ["v0", "브이제로", "브이영", "vercel", "버셀"],
  },
  {
    slug: "base44",
    name: "베이스44",
    maker: "Wix",
    purpose: "CODE",
    alsoFor: ["WEBSITE"],
    origin: "GLOBAL",
    summary:
      "로그인과 데이터베이스가 처음부터 들어간 앱을 말로 만들어요. 회원 가입이 필요한 서비스를 만들 때 편해요.",
    howToStart: "가입하고 만들고 싶은 앱을 설명하면 돼요.",
    pricingKind: "FREEMIUM",
    priceNote: "무료는 매달 메시지 크레딧이 다시 차고, 앱은 다섯 개까지 만들 수 있어요. 내 도메인은 유료예요.",
    koreanLevel: "UNKNOWN",
    koreanNote: "한국어 지원 여부를 공식 문서에서 확인하지 못했어요.",
    siteUrl: "https://base44.com",
    logoUrl: "/logos/base44.png",
    platforms: ["WEB"],
    caution:
      "무료 크레딧이 한 달에 25번이라 프로젝트 하나 만들기에도 빠듯해요. 코드를 깃허브로 내보내는 것도 유료부터예요.",
    aliases: ["base44", "베이스 44", "베이스포티포"],
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
