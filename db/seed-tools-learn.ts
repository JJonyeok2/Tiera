/* ---------------------------------------------------------------------------
 * Header: 도구별 "배우는 곳" 링크. SPEC 23.21.
 *
 * 2026-10-14에 하나씩 열어서 확인했다(WebFetch). 기준:
 * - OFFICIAL: 만든 회사의 시작 가이드·도움말·아카데미. 한국어판이 있으면 한국어판.
 * - COURSE  : 알려진 플랫폼의 **무료** 한국어 강의(인프런 0원 등). 유료는 넣지 않는다.
 * - VIDEO   : 공식 채널이거나 규모 있는 채널의 최근 1년 영상. 이번에는 유튜브를
 *             열어 확인할 수 없어서(요청 제한) 하나도 넣지 않았다.
 * - 개인 블로그·SEO 글·제휴 링크·유료 강의는 넣지 않는다.
 * - 도구당 최대 3개, 한국어를 앞에. 확인 못 한 도구는 비워 둔다 — 화면에서 섹션이 빠진다.
 *
 * 비어 있는 도구와 이유:
 * - papago, clova-note: 네이버 도움말이 확인 도구에서 차단돼 열어 보지 못했다.
 * - supertone-play: 공식 가이드 페이지가 엉뚱한 도메인으로 리다이렉트된다.
 *
 * 인프런 "지금 무료" 표시는 기간 한정일 수 있다. tests/seed-tools.test.ts가 형식을
 * 지키고, 링크가 살아 있는지는 분기마다 다시 열어 본다.
 * ------------------------------------------------------------------------- */
import type { LearnLink } from "@/db/schema";

export const LEARN_CHECKED_AT = "2026-10-14";

export const LEARN_LINKS: Record<string, LearnLink[]> = {
  // --- 대화 ---------------------------------------------------------------
  chatgpt: [
    {
      title: "ChatGPT 시작하기",
      url: "https://openai.com/ko-KR/academy/getting-started/",
      kind: "OFFICIAL",
      lang: "ko",
      by: "OpenAI 아카데미",
      note: "화면 구성, 첫 대화와 프롬프트, 음성 기능까지 첫걸음",
    },
    {
      title: "ChatGPT 사용하기",
      url: "https://openai.com/ko-KR/academy/using-chatgpt/",
      kind: "OFFICIAL",
      lang: "ko",
      by: "OpenAI 아카데미",
      note: "개인화, 파일, 딥리서치, 이미지 생성, 프로젝트를 단계별로",
    },
    {
      title: "WE CAN ChatGPT!",
      url: "https://www.inflearn.com/course/we-can-chatgpt",
      kind: "COURSE",
      lang: "ko",
      by: "인프런 · 생성형AI코리아",
      note: "질문 잘하는 법, GPTs, 자소서·보고서 실습 (입문, 약 3시간)",
    },
  ],
  claude: [
    {
      title: "Claude 시작하기",
      url: "https://support.claude.com/ko/articles/8114491-claude-%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Anthropic 지원 센터",
      note: "웹·앱 접속, 첫 대화, 모델 고르기, 무료 사용량과 팁",
    },
    {
      title: "Claude 101",
      url: "https://anthropic.skilljar.com/claude-101",
      kind: "OFFICIAL",
      lang: "en",
      by: "Anthropic 아카데미",
      note: "프로젝트·아티팩트·리서치로 일상 업무에 쓰는 법 (무료, 수료증)",
    },
  ],
  gemini: [
    {
      title: "Gemini 앱 고객센터",
      url: "https://support.google.com/gemini/?hl=ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Google",
      note: "시작하기, Gems, 연결된 앱 등 기능별 공식 도움말",
    },
    {
      title: "Gemini 모바일 앱 시작하기",
      url: "https://support.google.com/gemini/answer/14554984?hl=ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Google",
      note: "휴대폰에서 글·음성·사진으로 대화 시작하기",
    },
  ],
  "naver-ai-tab": [
    {
      title: "네이버 'AI탭' 정식 출시 안내",
      url: "https://www.navercorp.com/media/pressReleasesDetail?seq=10034429",
      kind: "OFFICIAL",
      lang: "ko",
      by: "NAVER",
      note: "검색창의 AI탭 여는 법과 장소·쇼핑·예약 연계 기능",
    },
  ],
  manus: [
    {
      title: "마누스 공식 문서",
      url: "https://manus.im/docs/ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Manus",
      note: "직접 일을 해 주는 AI 에이전트의 개념과 시작하는 법",
    },
    {
      title: "처음 쓰는 사람을 위한 프롬프트",
      url: "https://manus.im/ko/blog/manus-beginner-prompts",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Manus",
      note: "생활·업무·리서치 예시로 일 맡기는 법",
    },
  ],

  // --- 자료조사 -------------------------------------------------------------
  "gemini-notebook": [
    {
      title: "Gemini Notebook 알아보기",
      url: "https://support.google.com/notebooklm/answer/16164461?hl=ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Google",
      note: "자료를 올리고 출처 달린 답을 받는 기본 개념",
    },
    {
      title: "노트북 만들기",
      url: "https://support.google.com/gemininotebook/answer/16206563?hl=ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Google",
      note: "자료 추가, 오디오·영상 요약, 마인드맵, 퀴즈, 공유까지",
    },
    {
      title: "생산성 높이는 NotebookLM 활용 가이드",
      url: "https://inflearn.com/course/%EC%83%9D%EC%82%B0%EC%84%B1-%EB%86%92%EC%9D%B4%EB%8A%94-notebooklm",
      kind: "COURSE",
      lang: "ko",
      by: "인프런 · may9noy",
      note: "논문 정리, 유튜브 요약, 오디오 기능 활용 (입문, 이름 바뀌기 전 화면)",
    },
  ],
  perplexity: [
    {
      title: "퍼플렉시티 고객센터",
      url: "https://www.perplexity.ai/help-center/ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Perplexity",
      note: "시작하기부터 기능, 모바일 앱까지 공식 도움말",
    },
    {
      title: "Getting started with Perplexity",
      url: "https://www.perplexity.ai/hub/getting-started",
      kind: "OFFICIAL",
      lang: "en",
      by: "Perplexity",
      note: "검색·딥리서치 소개와 짧은 아카데미 영상",
    },
  ],
  liner: [
    {
      title: "학술 모드로 자료 찾기",
      url: "https://liner.com/ko/learn/liner-scholar-mode",
      kind: "OFFICIAL",
      lang: "ko",
      by: "라이너",
      note: "학술 모드 전환, 문장별 출처 확인, 인용 복사 4단계",
    },
    {
      title: "딥 리서치 사용법",
      url: "https://liner.com/ko/learn/guide-deep-research",
      kind: "OFFICIAL",
      lang: "ko",
      by: "라이너",
      note: "주제 입력부터 보고서·출처 검토, 추천 논문까지",
    },
    {
      title: "3분 만에 초안 쓰기",
      url: "https://liner.com/ko/learn/ai-writing-tool-for-professionals",
      kind: "OFFICIAL",
      lang: "ko",
      by: "라이너",
      note: "출처 기반으로 글 초안을 쓰는 5단계",
    },
  ],
  scispace: [
    {
      title: "SciSpace로 문헌 검토하기",
      url: "https://scispace.com/help/en/articles/10660587-how-to-conduct-a-literature-review-using-scispace",
      kind: "OFFICIAL",
      lang: "en",
      by: "SciSpace",
      note: "논문 검색, PDF 분석, 라이브러리 정리, 인용 만들기",
    },
    {
      title: "Chat with PDF 사용법",
      url: "https://scispace.com/help/en/articles/10660595-how-does-chat-with-pdf-work-chat-with-pdf-interacting-with-research-papers-using-ai",
      kind: "OFFICIAL",
      lang: "en",
      by: "SciSpace",
      note: "논문 PDF를 올리고 질문·요약하는 법",
    },
  ],
  consensus: [
    {
      title: "검색 방법과 팁",
      url: "https://help.consensus.app/en/articles/9922660-how-to-search-best-practices",
      kind: "OFFICIAL",
      lang: "en",
      by: "Consensus",
      note: "연구 질문 쓰는 법, 검색 모드, 필터",
    },
    {
      title: "학생이 Consensus를 쓰는 5가지 방법",
      url: "https://help.consensus.app/en/articles/16359577-the-top-5-ways-students-use-consensus",
      kind: "OFFICIAL",
      lang: "en",
      by: "Consensus",
      note: "주제 파악, 논문 목록 만들기, 초안 근거 점검",
    },
  ],

  // --- 번역·글쓰기 ------------------------------------------------------------
  deepl: [
    {
      title: "DeepL 번역기 시작하기",
      url: "https://www.deepl.com/ko/academy/deepl-translator-getting-started",
      kind: "OFFICIAL",
      lang: "ko",
      by: "DeepL 아카데미",
      note: "대체 표현 고르기, 사전, 격식체 조절, 용어집",
    },
    {
      title: "DeepL Write 시작하기",
      url: "https://www.deepl.com/ko/academy/deepl-write-getting-started",
      kind: "OFFICIAL",
      lang: "ko",
      by: "DeepL 아카데미",
      note: "맞춤법·문법 교정과 어조 바꾸기",
    },
    {
      title: "DeepL 모바일 앱 사용하기",
      url: "https://www.deepl.com/ko/academy/deepl-mobile-app",
      kind: "OFFICIAL",
      lang: "ko",
      by: "DeepL 아카데미",
      note: "이동 중 글·사진·파일 번역하기",
    },
  ],
  papago: [],
  wrtn: [
    {
      title: "뤼튼 고객센터",
      url: "https://help.wrtn.ai/",
      kind: "OFFICIAL",
      lang: "ko",
      by: "뤼튼테크놀로지스",
      note: "채팅 기록, AI 서포터, 도구 기능 안내",
    },
  ],

  // --- 발표자료 -------------------------------------------------------------
  miricanvas: [
    {
      title: "미리캔버스 시작하기",
      url: "https://help.miricanvas.com/hc/ko/categories/57570621872537--%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0",
      kind: "OFFICIAL",
      lang: "ko",
      by: "미리캔버스 헬프센터",
      note: "가입, 워크스페이스, 편집 기본기",
    },
    {
      title: "AI 기능 사용하기",
      url: "https://help.miricanvas.com/hc/ko/articles/33349963638553-AI-%EA%B8%B0%EB%8A%A5-%ED%94%84%EB%A0%88%EC%A0%A0%ED%85%8C%EC%9D%B4%EC%85%98-%EB%94%B1-%EB%A7%9E%EB%8A%94-%ED%8E%98%EC%9D%B4%EC%A7%80-%EB%9D%BC%EC%9D%B4%ED%8C%85-%EC%9D%B4%EB%AF%B8%EC%A7%80-%EC%83%9D%EC%84%B1-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0",
      kind: "OFFICIAL",
      lang: "ko",
      by: "미리캔버스 헬프센터",
      note: "AI로 발표자료 초안, 글, 이미지 만들기",
    },
  ],
  gamma: [
    {
      title: "새 프레젠테이션 만들기",
      url: "https://help.gamma.app/ko/articles/7838093-gamma%EC%97%90%EC%84%9C-%EC%83%88-%ED%94%84%EB%A0%88%EC%A0%A0%ED%85%8C%EC%9D%B4%EC%85%98-%EB%AC%B8%EC%84%9C-%EB%98%90%EB%8A%94-%EC%9B%B9%ED%8E%98%EC%9D%B4%EC%A7%80%EB%A5%BC-%EC%96%B4%EB%96%BB%EA%B2%8C-%EC%83%9D%EC%84%B1%ED%95%98%EB%82%98%EC%9A%94",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Gamma",
      note: "감마로 첫 발표자료를 만드는 기본 흐름",
    },
    {
      title: "Gamma 기본 사항",
      url: "https://help.gamma.app/ko/collections/12178861-gamma-%EA%B8%B0%EB%B3%B8-%EC%82%AC%ED%95%AD",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Gamma",
      note: "대시보드, 슬라이드 편집 등 기본기 13편",
    },
  ],
  snapdeck: [
    {
      title: "처음 쓰는 분들을 위한 스냅덱 사용법",
      url: "https://blog.snapdeck.app/post/snapdeck-getting-started",
      kind: "OFFICIAL",
      lang: "ko",
      by: "스냅덱 팀",
      note: "첫 발표자료를 만드는 시작 가이드",
    },
  ],
  canva: [
    {
      title: "Canva 사용법 3단계",
      url: "https://www.canva.com/ko_kr/learn/mobileapp/",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Canva",
      note: "템플릿 고르기, 편집, 저장·공유까지",
    },
    {
      title: "Canva 도움말 센터",
      url: "https://www.canva.com/ko_kr/help/",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Canva",
      note: "업로드, 크기 조정, 배경 제거 같은 자주 묻는 사용법",
    },
    {
      title: "AI Essentials",
      url: "https://www.canva.com/design-school/courses/ai-essentials",
      kind: "OFFICIAL",
      lang: "en",
      by: "Canva 디자인 스쿨",
      note: "Canva AI로 디자인 만드는 무료 입문 코스 (약 1시간)",
    },
  ],
  genspark: [
    {
      title: "AI 슬라이드를 캔바·피그마에서 고치기",
      url: "https://www.genspark.ai/ko/blog/genspark-ai-slides-edit",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Genspark",
      note: "만든 슬라이드를 내보내 다른 도구에서 다듬는 법",
    },
    {
      title: "Genspark 공식 유튜브",
      url: "https://www.youtube.com/@GensparkProduct",
      kind: "OFFICIAL",
      lang: "en",
      by: "Genspark",
      note: "기능별 사용 가이드 영상",
    },
  ],

  // --- 기록·정리 -------------------------------------------------------------
  "notion-ai": [
    {
      title: "Notion AI로 할 수 있는 모든 것",
      url: "https://www.notion.com/ko/help/guides/everything-you-can-do-with-notion-ai",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Notion",
      note: "질문·요약, 파일 분석, 글쓰기에 AI 쓰는 법",
    },
    {
      title: "Notion 시작하기",
      url: "https://www.notion.com/ko/help/category/new-to-notion",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Notion",
      note: "페이지, 데이터베이스, 공유 기본기",
    },
    {
      title: "Getting started with Notion AI",
      url: "https://academy.notion.com/getting-started-with-notion-ai",
      kind: "OFFICIAL",
      lang: "en",
      by: "Notion 아카데미",
      note: "30분 동안 검색·문서 작성·프로젝트 관리에 AI 쓰기",
    },
  ],
  "clova-note": [],
  tiro: [
    {
      title: "티로 빠른 시작",
      url: "https://docs.tiro.ooo/ko/guide/start/quickstart",
      kind: "OFFICIAL",
      lang: "ko",
      by: "티로",
      note: "가입부터 실시간 기록, 요약 노트까지 5분 안내",
    },
  ],

  // --- 이미지 ---------------------------------------------------------------
  "adobe-firefly": [
    {
      title: "글로 이미지 만들기",
      url: "https://helpx.adobe.com/kr/firefly/web/work-with-images/generate-images/generate-images-from-text-descriptions.html",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Adobe 도움말",
      note: "프롬프트와 설정으로 이미지를 만드는 법",
    },
    {
      title: "Take a tour of Adobe Firefly",
      url: "https://www.adobe.com/learn/firefly/web/tour-adobe-firefly",
      kind: "OFFICIAL",
      lang: "en",
      by: "Adobe Learn",
      note: "화면 구성과 주요 기능 둘러보기",
    },
  ],
  dreamina: [
    {
      title: "AI 이미지 생성기 사용 방법",
      url: "https://dreamina.capcut.com/ko-kr/tools/ai-image-generator",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Dreamina",
      note: "프롬프트 입력, 생성, 보정·다운로드 3단계",
    },
  ],
  midjourney: [
    {
      title: "AI 영상 제작 베이직: 미드저니 & 런웨이",
      url: "https://www.inflearn.com/course/ai-%EC%98%81%EC%83%81-%EC%A0%9C%EC%9E%91-%EC%98%AC%EC%9D%B8%EC%9B%90-%EB%AF%B8%EB%93%9C%EC%A0%80%EB%8B%88-am",
      kind: "COURSE",
      lang: "ko",
      by: "인프런 · Dong Ah K",
      note: "미드저니 화면, 프롬프트, 파라미터, 레퍼런스 활용 (입문)",
    },
    {
      title: "Midjourney Quick Start",
      url: "https://docs.midjourney.com/hc/en-us/articles/33329261836941-Quick-Start",
      kind: "OFFICIAL",
      lang: "en",
      by: "Midjourney",
      note: "첫 이미지 생성, 업스케일·변형, 영상까지",
    },
  ],

  // --- 영상 ----------------------------------------------------------------
  capcut: [
    {
      title: "초보자를 위한 CapCut 튜토리얼",
      url: "https://www.capcut.com/ko-kr/resource/capcut-tutorial-for-beginners",
      kind: "OFFICIAL",
      lang: "ko",
      by: "CapCut",
      note: "불러오기, 컷 편집, 자동 자막, 효과, 내보내기",
    },
    {
      title: "쇼츠 with 캡컷",
      url: "https://www.inflearn.com/course/%EC%88%8F%ED%8F%BC-%EC%98%81%EC%83%81-%ED%8E%B8%EC%A7%91-%EC%BA%A1%EC%BB%B7",
      kind: "COURSE",
      lang: "ko",
      by: "인프런 · 프로멘토",
      note: "쇼츠·릴스용 숏폼 편집 (입문, 약 36분)",
    },
  ],
  vrew: [
    {
      title: "Vrew 공식 튜토리얼",
      url: "https://vrew.imweb.me/tutorial",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Vrew",
      note: "자막, 컷 편집, AI 목소리, 텍스트로 영상 만들기를 순서대로",
    },
    {
      title: "Vrew 고객센터",
      url: "https://docs.channel.io/vrew-kr/ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Vrew",
      note: "자주 묻는 질문과 새 기능 안내",
    },
  ],
  "google-flow": [
    {
      title: "구글 플로우 시작하기",
      url: "https://support.google.com/flow/answer/16353333?hl=ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Google Flow 고객센터",
      note: "접속 방법, 크레딧, 워터마크, 자주 나는 오류",
    },
    {
      title: "Gemini / Flow로 AI 영상 만들기",
      url: "https://www.inflearn.com/course/gemini-flow%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-ai%EC%98%81",
      kind: "COURSE",
      lang: "ko",
      by: "인프런 · stanlee",
      note: "Flow와 Veo로 자기소개 영상 만들기 (입문, 약 28분)",
    },
  ],
  kling: [
    {
      title: "Kling AI 사용 가이드",
      url: "https://kling.ai/quickstart",
      kind: "OFFICIAL",
      lang: "en",
      by: "Kling AI",
      note: "글·사진으로 영상 만들기, 모션 컨트롤, 영상 연장 프롬프트",
    },
  ],
  hailuo: [
    {
      title: "AI 영상 프롬프트 잘 쓰는 법",
      url: "https://hailuoai.video/pages/blog/effective-ai-video-prompt-guide",
      kind: "OFFICIAL",
      lang: "en",
      by: "Hailuo AI",
      note: "주체·배경·동작·스타일 4단으로 프롬프트 쓰기",
    },
  ],
  runway: [
    {
      title: "AI 영상 제작 베이직: 미드저니 & 런웨이",
      url: "https://www.inflearn.com/course/ai-%EC%98%81%EC%83%81-%EC%A0%9C%EC%9E%91-%EC%98%AC%EC%9D%B8%EC%9B%90-%EB%AF%B8%EB%93%9C%EC%A0%80%EB%8B%88-am",
      kind: "COURSE",
      lang: "ko",
      by: "인프런 · Dong Ah K",
      note: "런웨이 화면과 핵심 기능 (입문, 화면이 조금 옛날 것)",
    },
    {
      title: "Runway Academy",
      url: "https://academy.runway.com/",
      kind: "OFFICIAL",
      lang: "en",
      by: "Runway",
      note: "공식 강좌·튜토리얼·프롬프트 가이드 (무료 등록)",
    },
  ],
  higgsfield: [
    {
      title: "첫 생성물 만들기",
      url: "https://higgsfield.ai/creator-hub/help-center/getting-started/how-do-i-create-my-first-generation",
      kind: "OFFICIAL",
      lang: "en",
      by: "Higgsfield",
      note: "모델·프롬프트·설정을 골라 첫 결과 만들기 6단계",
    },
    {
      title: "Higgsfield Academy",
      url: "https://higgsfield.ai/academy/courses",
      kind: "OFFICIAL",
      lang: "en",
      by: "Higgsfield",
      note: "AI 광고·단편영상 강좌 (무료, 입문 4개 포함)",
    },
  ],

  // --- 아바타 영상 ------------------------------------------------------------
  "ai-studios": [
    {
      title: "비디오 프로젝트 시작하기",
      url: "https://help.aistudios.com/ko/articles/10306099-how-can-i-start-a-video-project-in-ai-studios",
      kind: "OFFICIAL",
      lang: "ko",
      by: "AI Studios 헬프센터",
      note: "새 프로젝트와 주제·PPT로 AI 초안 만들기",
    },
    {
      title: "AI 비디오 생성기 사용 방법",
      url: "https://www.aistudios.com/ko/how-to-guides/how-to-use-an-ai-video-generator-2026-step-by-step-guide",
      kind: "OFFICIAL",
      lang: "ko",
      by: "AI Studios",
      note: "대본, 아바타·목소리 선택, 생성, 내보내기 6단계",
    },
  ],
  heygen: [
    {
      title: "HeyGen Academy 시작하기",
      url: "https://www.heygen.com/academy/welcome-to-academy",
      kind: "OFFICIAL",
      lang: "en",
      by: "HeyGen",
      note: "아바타·목소리·대본으로 첫 영상 완성까지",
    },
    {
      title: "HeyGen 헬프센터",
      url: "https://help.heygen.com/en/",
      kind: "OFFICIAL",
      lang: "en",
      by: "HeyGen",
      note: "아바타, 음성, 번역, 편집 주제별 도움말",
    },
  ],

  // --- 음악·목소리 -----------------------------------------------------------
  suno: [
    {
      title: "심플 모드로 노래 만들기",
      url: "https://help.suno.com/en/articles/2462273",
      kind: "OFFICIAL",
      lang: "en",
      by: "Suno",
      note: "원하는 노래를 문장으로 설명해 첫 곡 만들기",
    },
    {
      title: "Suno로 노래 만드는 법",
      url: "https://suno.com/hub/how-to-make-a-song",
      kind: "OFFICIAL",
      lang: "en",
      by: "Suno",
      note: "고급 모드, [Verse]·[Chorus] 구조 태그, 연장·편집",
    },
  ],
  elevenlabs: [
    {
      title: "ElevenCreative 빠른 시작",
      url: "https://elevenlabs.io/docs/ko/eleven-creative/quickstart",
      kind: "OFFICIAL",
      lang: "ko",
      by: "ElevenLabs",
      note: "목소리·모델 고르고 첫 음성 만들기 (코딩 없이)",
    },
    {
      title: "텍스트 음성 변환 가이드",
      url: "https://elevenlabs.io/docs/ko/eleven-creative/playground/text-to-speech",
      kind: "OFFICIAL",
      lang: "ko",
      by: "ElevenLabs",
      note: "목소리 설정과 자연스럽게 읽히는 글 쓰는 법",
    },
  ],
  "supertone-play": [],

  // --- 웹사이트 -------------------------------------------------------------
  wix: [
    {
      title: "AI로 사이트 만들기",
      url: "https://support.wix.com/ko/article/wix-%EC%97%90%EB%94%94%ED%84%B0-ai-%EC%83%9D%EC%84%B1-%EC%82%AC%EC%9D%B4%ED%8A%B8-%EC%A0%9C%EC%9E%91%ED%95%98%EA%B8%B0",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Wix 고객센터",
      note: "AI 채팅으로 정보를 넣고 사이트 디자인 만들기",
    },
    {
      title: "AI로 사이트 생성 및 관리하기",
      url: "https://support.wix.com/ko/ai%EB%A1%9C-%EC%82%AC%EC%9D%B4%ED%8A%B8-%EC%83%9D%EC%84%B1-%EB%B0%8F-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Wix 고객센터",
      note: "Wix AI 도구 도움말 모음",
    },
  ],
  framer: [
    {
      title: "Get Started with Framer Agents",
      url: "https://www.framer.com/academy/courses/get-started-with-framer-agents",
      kind: "OFFICIAL",
      lang: "en",
      by: "Framer 아카데미",
      note: "AI로 레이아웃과 사이트 구조 만들기 (무료, 약 22분)",
    },
    {
      title: "AI로 처음부터 웹사이트 만들기",
      url: "https://www.framer.com/help/articles/how-to-build-a-website-from-scratch-with-framer-agents/",
      kind: "OFFICIAL",
      lang: "en",
      by: "Framer",
      note: "초안 생성, 수정, 게시 전 점검 6단계",
    },
  ],
  zaemit: [
    {
      title: "AI로 홈페이지 시작하는 법",
      url: "https://zaemit.kr/page/help-center?category=site_start&parent_category=START&mode=view&seq=598",
      kind: "OFFICIAL",
      lang: "ko",
      by: "재밋",
      note: "문장 입력부터 페이지 생성, 에디터 수정까지 7단계",
    },
    {
      title: "재밋 공식 유튜브",
      url: "https://www.youtube.com/@zaemit_official/videos",
      kind: "OFFICIAL",
      lang: "ko",
      by: "재밋",
      note: "블록 편집, 하위 페이지, 도메인 연결 등 기능별 영상",
    },
  ],

  // --- 코딩 ----------------------------------------------------------------
  "github-copilot": [
    {
      title: "GitHub Copilot 소개",
      url: "https://learn.microsoft.com/ko-kr/training/modules/introduction-to-github-copilot/",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Microsoft Learn",
      note: "설치·설정부터 VS Code에서 제안 코드로 개발하는 실습까지",
    },
    {
      title: "IDE에서 Copilot 빠른 시작",
      url: "https://docs.github.com/ko/copilot/get-started/quickstart-for-using-github-copilot-in-your-ide",
      kind: "OFFICIAL",
      lang: "ko",
      by: "GitHub Docs",
      note: "질문하기, 에이전트 모드, 인라인 제안을 10분 안에",
    },
    {
      title: "Getting started with GitHub Copilot",
      url: "https://github.com/skills/getting-started-with-github-copilot",
      kind: "OFFICIAL",
      lang: "en",
      by: "GitHub Skills",
      note: "브라우저 속 VS Code에서 1시간 실습",
    },
  ],
  lovable: [
    {
      title: "러버블 빠른 시작",
      url: "https://docs.lovable.dev/introduction/getting-started",
      kind: "OFFICIAL",
      lang: "en",
      by: "Lovable",
      note: "첫 앱 만들기, 화면에서 고치기, 무료 주소로 공개하기",
    },
  ],
  "claude-code": [
    {
      title: "혼자 공부하는 바이브 코딩 with 클로드 코드",
      url: "https://www.inflearn.com/course/%EB%B0%94%EC%9D%B4%EB%B8%8C-%EC%BD%94%EB%94%A9-%EC%9E%85%EB%AC%B8-%EA%B0%95%EC%9D%98-%ED%98%BC%EC%9E%90-%EA%B3%B5%EB%B6%80%ED%95%98%EB%8A%94",
      kind: "COURSE",
      lang: "ko",
      by: "인프런 · 한빛미디어",
      note: "설치부터 웹페이지·앱 15개 실습까지 (입문, 약 4시간)",
    },
    {
      title: "클로드 코드 빠른 시작",
      url: "https://code.claude.com/docs/ko/quickstart",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Anthropic",
      note: "설치, 첫 질문, 첫 코드 수정, Git까지 단계별",
    },
    {
      title: "Claude Code 101",
      url: "https://academy.claude.com/courses/claude-code-101",
      kind: "OFFICIAL",
      lang: "en",
      by: "Anthropic 아카데미",
      note: "코딩 에이전트 개념, Plan Mode, CLAUDE.md (무료)",
    },
  ],
  kiro: [
    {
      title: "키로 첫 프로젝트 만들기",
      url: "https://kiro.dev/docs/getting-started/first-project/",
      kind: "OFFICIAL",
      lang: "en",
      by: "Kiro",
      note: "스펙 기반 개발, 훅, MCP 등 핵심 기능 따라하기",
    },
  ],
  antigravity: [
    {
      title: "Google Antigravity 시작하기",
      url: "https://codelabs.developers.google.com/getting-started-google-antigravity?hl=ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Google Codelabs",
      note: "설치, 화면 구성, MCP 연결, 나만의 스킬까지 실습",
    },
    {
      title: "구글 안티그래비티 마스터 클래스 - 기초",
      url: "https://www.inflearn.com/course/%EB%B0%94%EC%9D%B4%EB%B8%8C%EC%BD%94%EB%94%A9-google-antigra",
      kind: "COURSE",
      lang: "ko",
      by: "인프런 · youngportfolio",
      note: "에이전트 매니저, 결과물 확인, 브라우저 검증 (입문, 글 강의)",
    },
  ],
  jules: [
    {
      title: "Jules 시작하기",
      url: "https://jules.google/docs",
      kind: "OFFICIAL",
      lang: "en",
      by: "Google",
      note: "깃허브 연결, 첫 작업 맡기기, 계획 승인까지",
    },
  ],
  "google-ai-studio": [
    {
      title: "AI Studio에서 앱 빌드",
      url: "https://ai.google.dev/gemini-api/docs/aistudio-build-mode?hl=ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Google AI for Developers",
      note: "말로 앱 만들기, 화면 보며 고치기, 공유하기",
    },
    {
      title: "AI Studio의 Gemini로 바이브 코딩하기",
      url: "https://codelabs.developers.google.com/vibe-code-with-gemini-in-aistudio?hl=ko",
      kind: "OFFICIAL",
      lang: "ko",
      by: "Google Codelabs",
      note: "프롬프트 하나로 웹앱 만들고 디자인 수정·저장까지",
    },
  ],
  bolt: [
    {
      title: "Intro to Bolt",
      url: "https://support.bolt.new/get-started/intro-bolt",
      kind: "OFFICIAL",
      lang: "en",
      by: "Bolt",
      note: "채팅으로 앱 만들기와 프로젝트 시작 방법",
    },
    {
      title: "Bolt 영상 튜토리얼",
      url: "https://support.bolt.new/get-started/video-tutorials",
      kind: "OFFICIAL",
      lang: "en",
      by: "Bolt",
      note: "약 1시간짜리 공식 온보딩 영상 모음",
    },
  ],
  replit: [
    {
      title: "Replit Learn",
      url: "https://learn.replit.com/",
      kind: "OFFICIAL",
      lang: "en",
      by: "Replit",
      note: "코딩 경험 없이 AI로 앱 만드는 무료 강좌 (30분, 7강)",
    },
    {
      title: "첫 앱 만들기",
      url: "https://docs.replit.com/build/your-first-app",
      kind: "OFFICIAL",
      lang: "en",
      by: "Replit",
      note: "프롬프트, 빌드, 테스트, 개선의 기본 흐름",
    },
  ],
  v0: [
    {
      title: "v0 Quickstart",
      url: "https://v0.app/docs/quickstart",
      kind: "OFFICIAL",
      lang: "en",
      by: "Vercel",
      note: "첫 프로젝트, 디자인 모드, 데이터 연결, 배포",
    },
    {
      title: "v0 Foundations",
      url: "https://vercel.com/academy/v0-foundations",
      kind: "OFFICIAL",
      lang: "en",
      by: "Vercel Academy",
      note: "코딩 없이 웹사이트 만들고 도메인 연결까지 7강",
    },
  ],
  base44: [
    {
      title: "베이스44 빠른 시작",
      url: "https://docs.base44.com/Getting-Started/Quick-start-guide",
      kind: "OFFICIAL",
      lang: "en",
      by: "Base44",
      note: "설명하고, 확인하고, 고치고, 공개하는 5단계",
    },
  ],
};
/* Footer: db/seed-tools-learn.ts */
