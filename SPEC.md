# Tiera — 서비스 기획서 (Spec v0.1)

> AI 모델의 로튼토마토. **벤치마크 점수(스펙)** 와 **커뮤니티 점수(체감)** 를 나란히 보여주고,
> 그 둘의 괴리를 재미 요소로 만드는 AI 모델 티어 사이트.

- 작성일: 2026-09-07
- 단계: **Spec** (다음 단계: Task → Impl → QA)
- 확정 스택: Next.js(App Router) + TypeScript + **Drizzle ORM** + PostgreSQL + Auth.js
- 데이터 전략: 수동 시딩 + 외부 소스 어댑터 훅 설계 (자동 수집은 후속)
- 수록 범위: **개발사 국적 기준 미국 · 중국 · 한국** 3개국 모델만

---

## 1. 컨셉과 핵심 가설

### 1.1 문제
AI 모델 성능 정보는 두 갈래로 갈라져 있고, 둘 다 일반 사용자에게 불친절하다.
- **벤치마크**: MMLU, SWE-bench, LMArena Elo… 숫자는 많은데 "그래서 나한테 좋은 모델이 뭔데?"에 답을 못 한다.
- **커뮤니티 여론**: 레딧·X·디스코드에 흩어져 있고 집계가 안 된다.

### 1.2 해법 (로튼토마토 구조)
| 로튼토마토 | Tiera |
|---|---|
| 평론가 점수 (Tomatometer) | **벤치마크 점수** — 공개 벤치마크 정규화 집계 |
| 관객 점수 (Audience Score) | **커뮤니티 점수** — 실사용자 항목별 평가 |
| 신선/썩음 아이콘 | **티어 배지** — Prism / Gold / Silver / Bronze |
| "평론가는 극찬, 관객은 혹평" | **괴리 배지** — 스펙 우위 / 체감 우위 |

### 1.3 핵심 가설
> 사용자는 "1위가 누구냐"보다 **"벤치마크는 높은데 실제로 써보면 별로인 모델이 뭐냐"** 를 더 궁금해한다.

이 괴리(gap)가 Tiera의 유일한 차별점이자 바이럴 포인트다. 랭킹 리스트만 있는 사이트는 이미 많다.

### 1.4 톤앤매너
- **재미로 보는 티어표**. 권위 있는 척하지 않는다. 카피에도 "재미로 보는" 뉘앙스를 남긴다.
- 다크 테마 고정. 브랜드 마크는 Figma 기준 4색 별(Prism 그라데이션 / Gold / Silver / Bronze).

---

## 2. 타깃 사용자

| 페르소나 | 상황 | 원하는 것 |
|---|---|---|
| **모델 고르는 개발자** | 사이드 프로젝트에 붙일 API 모델 선정 | 코딩 카테고리 랭킹 + 가격/컨텍스트 스펙 비교 |
| **구독 고민하는 일반 유저** | Claude vs GPT vs Gemini 중 뭘 결제할지 | 종합 티어와 한줄평, 카테고리별 강약점 |
| **AI 뉴스 소비자** | 신규 모델 출시 소식을 봄 | "이 모델 실제 평가 어떰?" 즉시 확인 |
| **평가 참여자** | 여러 모델을 실사용 중 | 내 평가를 남기고 순위에 반영되는 걸 봄 |

---

## 3. 정보 구조 (IA)

```
/                          랭킹 (홈)
  ├ 점수 타입 토글          커뮤니티 평가 | 벤치마크
  ├ 국가 필터              전체 | 미국 | 중국 | 한국
  ├ 카테고리 탭            종합 | 코딩 | 글쓰기 | 추론 | 멀티모달
  └ 검색                   모델명 / 개발사명

/models/[slug]             모델 상세
  ├ 듀얼 스코어 카드        커뮤니티 점수 · 벤치마크 점수 · 괴리 배지
  ├ 카테고리 레이더/바      4개 카테고리 점수
  ├ 스펙 표                컨텍스트, 가격, 모달리티, 출시일, 오픈웨이트 여부
  ├ 벤치마크 원본 표        벤치마크명 · 원점수 · 정규화 점수 · 출처 링크
  └ 리뷰 목록 + 작성 CTA

/compare?models=a,b,c      모델 비교 (최대 3개)
/about                     점수 산정 방식 (신뢰도 확보용 — 필수 페이지)
/me                        내가 쓴 리뷰 관리
/login                     OAuth 로그인
```

---

## 4. 티어 체계 — 브랜드 확정 (Figma 기준)

**소스 오브 트루스**: Figma `Tiera` 파일 — `Sources` 프레임
`https://www.figma.com/design/dLClHMt343tarQe1NuQUz3/Tiera?node-id=0-1`
구성: 티어별 별 카드 4장(PRISM / GOLD / SILVER / BRONZE) + 브랜드 보드 1장.

목업의 `S / A / B` 문자 배지는 **폐기 확정**. Figma의 4티어 별 마크로 통일한다.
(문자 티어는 브랜드 마크와 매칭되지 않아 아이덴티티가 두 갈래로 갈린다.)

| 티어 | 점수 구간 | 컬러 토큰 | Figma 표기 | 설명 |
|---|---|---|---|---|
| **PRISM** | 90 – 100 | `#7B68FF → #FFB868` (Gradient) | Gradient | 가장 뛰어난 성능의 **최상위 티어** |
| **GOLD** | 80 – 89.9 | `#FFD700` | (255, 215, 0) | 매우 우수한 성능의 **상위 티어** |
| **SILVER** | 65 – 79.9 | `#C0C6D4` | (192, 198, 212) | 안정적인 성능의 **중간 티어** |
| **BRONZE** | 0 – 64.9 | `#CD7F32` | (205, 127, 50) | 기본적인 성능의 **하위 티어** |

- 티어명·설명 문구는 Figma 브랜드 보드의 한국어 카피를 그대로 사용한다.
- 컷은 **절대 기준**(상대 백분위 아님). 모델 전반이 좋아지면 Prism이 늘어나는 게 자연스럽다.
- 티어 컷과 컬러 토큰은 `lib/tiers.ts` 한 곳에서만 관리하고, 어디서도 하드코딩하지 않는다.

### 4.1 별 마크 애셋 명세

Figma의 별은 **중심에서 뻗어 나온 10개의 삼각 패싯**으로 이루어진 3D 저폴리 별 +
뒤쪽 소프트 글로우(radial) 구조다. 4티어 모두 형태는 동일하고 **색만 다르다** —
단, PRISM만 패싯별로 색이 달라지는 멀티 휴(cyan → blue → violet → magenta → pink)다.

| 자산 | 파일명 | 용도 |
|---|---|---|
| Prism 별 | `tier-prism.svg` | 90점 이상 모델 배지 |
| Gold 별 | `tier-gold.svg` | 80~89점 |
| Silver 별 | `tier-silver.svg` | 65~79점 |
| Bronze 별 | `tier-bronze.svg` | 65점 미만 |

- 노출 사이즈: `sm 20px` (랭킹 행) / `md 40px` (모델 카드) / `lg 96px` (모델 상세 히어로)
- 글로우는 SVG에 굽지 말고 CSS(`filter: drop-shadow`)로 분리한다 — `sm`에서는 글로우 제거.
- **색만으로 티어를 구분하지 않는다**: 마크 옆에 항상 텍스트 라벨(PRISM/GOLD/…)을 동반한다.

**애셋 확보 방식: (B) SVG 컴포넌트 재구성 — 확정**

Figma 익스포트 대신 지오메트리를 코드로 재구성한다. 파일 4개 대신 1개, 크기 무손실,
티어 추가 시 색만 주입하면 되고, 서버 컴포넌트로 렌더되어 클라이언트 번들이 0이다.

```
components/tier/
  tierTokens.ts      지오메트리 + 티어별 컬러 토큰 + tierOf(score) + glowFilter()  ← 단일 소스
  TierStarDefs.tsx   그라데이션 <defs> 스프라이트. app/layout.tsx에 1회 마운트
  TierStar.tsx       별 본체. 훅 없음 = 서버 컴포넌트
```

설계 규칙:
- **그라데이션 정의는 문서당 1회**. 별마다 `<defs>`를 만들면 랭킹 20행에 `linearGradient` 200개가 쌓인다. 스프라이트로 빼면 DOM이 가벼워지고 `useId`가 필요 없어져 서버 컴포넌트로 남는다.
- **글로우는 CSS `drop-shadow`**. `radialGradient` + `circle`은 별 뒤에 동그란 판이 보인다 — Figma의 글로우는 별 실루엣을 따라 번지는 블룸이라 `drop-shadow`만이 그 모양을 낸다. 블러라서 비싸므로 히어로에서만 켠다.
- **`size < 28px`에서는 능선/중심점을 그리지 않는다.** 서브픽셀이라 어차피 안 보이는데 노드만 늘어난다.
- **기본은 `aria-hidden`**. 별 옆에 항상 텍스트 라벨을 두는 것이 규칙이므로, 리스트에서 `aria-label`을 켜면 "프리즘 티어 PRISM"으로 두 번 읽힌다. 라벨이 없는 자리에서만 `labelled` 프롭을 켠다.

> Figma와 픽셀 단위로 일치하지는 않는다. QA에서 Figma 스크린샷과 나란히 놓고 패싯 명암 대비만 맞춘다.

---

## 5. 점수 산정 로직 ★ 핵심

### 5.1 커뮤니티 점수

**평가 입력**: 카테고리별 5점 척도(정수 1~5). 안 써본 카테고리는 **"평가 안 함"** 선택 가능.

| 카테고리 | 종합 산출 가중치 |
|---|---|
| 코딩 (CODING) | 0.30 |
| 추론 (REASONING) | 0.30 |
| 글쓰기 (WRITING) | 0.20 |
| 멀티모달 (MULTIMODAL) | 0.20 |

**계산 단계**

```
1) 카테고리 단순 평균        R_c = mean(1..5 점수들)
2) 100점 환산               raw_c = R_c / 5 * 100        // 20 ~ 100
3) 베이지안 보정             S_c = (v_c * raw_c + m * C_c) / (v_c + m)
     v_c = 해당 카테고리 평가 수
     m   = 신뢰 임계 상수 (초기값 30, 상수로 관리)
     C_c = 전체 모델의 카테고리 c 평균 raw
4) 종합                     OVERALL = Σ(w_c * S_c) / Σ(w_c)
     단, v_c = 0 인 카테고리는 분모·분자에서 제외
5) 티어                     4절 컷 적용
```

> **왜 베이지안 보정인가**: 리뷰 3개짜리 신규 모델이 평균 5.0으로 1위를 먹는 사고를 막는다.
> 리뷰가 쌓일수록 전체 평균(C_c)의 영향이 사라지고 실제 평균에 수렴한다.

**신뢰 배지** (목업의 `공인` / `평가 중`)
- `CERTIFIED` (공인): 종합 평가 수 ≥ m
- `PROVISIONAL` (평가 중): 종합 평가 수 < m — 점수는 노출하되 회색 처리 + 툴팁

### 5.2 벤치마크 점수

```
1) 벤치마크별 min-max 정규화   N_b = 20 + ((value - min_b) / (max_b - min_b)) * 80
     - higherIsBetter = false 인 지표는 반전
     - 해당 벤치마크 결과가 3개 모델 미만이면 정규화 불가 → 제외
     - min/max는 "현재 DB에 등록된 전체 모델" 집합 기준 (재계산 시점: 시딩/갱신 후)
2) 카테고리 점수              BS_c = Σ(w_b * N_b) / Σ(w_b)     // 벤치마크별 가중치
3) 종합                       5.1과 동일한 카테고리 가중치 적용
4) 티어                       동일 컷
```

### 5.3 괴리 배지 (Tiera 시그니처) — **순위 차 기준으로 개정**

```
rankDiff = benchmarkRank - communityRank      // 순위는 1이 가장 높다

rankDiff ≥ +3  →  "체감 우위"   벤치마크 순위보다 커뮤니티 평가가 높은 모델
rankDiff ≤ -3  →  "스펙 우위"   벤치마크 순위는 높지만 체감 평가는 아쉬운 모델
그 외          →  "일치"
```

> **초안(점수 차 ±5)을 폐기한 이유.** 구현 후 실데이터로 돌려보니 판정이 무너졌다.
> 커뮤니티 점수는 5점 척도를 환산한 **절대 평점**이라 72~88에 몰리는데,
> 벤치마크 점수는 min-max 정규화 결과라 **상대 순위**에 가깝고 전 구간에 퍼진다.
> 두 점수를 그냥 빼면 "평가가 엇갈렸다"가 아니라 "두 척도의 분포가 다르다"를 재게 되어,
> 하위권 모델이 전부 괴리 +40~70으로 잡혔다 (HyperCLOVA X SEED가 +71.9로 최대 괴리).
> 순위 차는 척도에 무관하고, "벤치마크 6위인데 커뮤니티 12위"라고 그대로 보여줄 수 있다.
>
> 함께 적용한 보정: 벤치마크 정규화의 하한을 0이 아니라 **20**으로 두어
> 커뮤니티 점수와 같은 밴드에 올렸다 (`BENCH_FLOOR`). 두 점수를 나란히 그리는 화면이
> 여럿이라, 축의 바닥이 다르면 막대 비교 자체가 거짓말이 된다.
- 홈 랭킹 리스트 행과 모델 상세 상단에 노출.
- `/about`에 "가장 괴리가 큰 모델 TOP 5" 섹션을 두면 공유 유인이 된다. *(MVP 이후 검토)*

### 5.4 순위 변동 (▲2 / ▼1)

- `RankSnapshot` 테이블에 **매일 1회** (점수타입 × 카테고리 × 모델) 순위를 저장.
- 변동값 = `어제 rank - 오늘 rank`. 스냅샷이 없는 신규 모델은 `NEW` 배지.
- 갱신 주체: Vercel Cron → `/api/cron/snapshot` (`CRON_SECRET` 헤더 검증).

---

## 6. 데이터 모델 (Prisma 초안)

```prisma
enum Country      { US CN KR }   // 개발사 국적 기준. 미국·중국·한국만 등록한다.
enum Category     { CODING WRITING REASONING MULTIMODAL }
enum ScoreScope   { OVERALL CODING WRITING REASONING MULTIMODAL }
enum ScoreType    { COMMUNITY BENCHMARK }
enum Tier         { PRISM GOLD SILVER BRONZE }
enum ModelStatus  { CERTIFIED PROVISIONAL }
enum Modality     { TEXT IMAGE AUDIO VIDEO }
enum Role         { USER ADMIN }

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  reviews   Review[]
}

model Developer {
  id      String   @id @default(cuid())
  slug    String   @unique          // "anthropic"
  name    String                    // "Anthropic"
  country Country
  logoUrl String?
  models  Model[]
}

model Model {
  id             String    @id @default(cuid())
  slug           String    @unique   // "claude-sonnet-4-6"
  name           String              // "Claude Sonnet 4.6"
  developerId    String
  developer      Developer @relation(fields: [developerId], references: [id])
  description    String?
  releasedAt     DateTime?
  contextWindow  Int?                // 토큰
  inputPricePerM Decimal?  @db.Decimal(10, 4)
  outputPricePerM Decimal? @db.Decimal(10, 4)
  modalities     Modality[]
  isOpenWeight   Boolean   @default(false)
  status         ModelStatus @default(PROVISIONAL)
  isPublished    Boolean   @default(true)

  reviews          Review[]
  scores           ModelScore[]
  benchmarkResults BenchmarkResult[]
  snapshots        RankSnapshot[]

  @@index([developerId])
}

model Review {
  id        String   @id @default(cuid())
  userId    String
  modelId   String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  model     Model    @relation(fields: [modelId], references: [id], onDelete: Cascade)
  comment   String?  @db.Text        // 한줄평 (선택, 최대 500자)
  ratings   ReviewRating[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, modelId])        // 1인 1모델 1리뷰
  @@index([modelId, createdAt])
}

model ReviewRating {
  id       String   @id @default(cuid())
  reviewId String
  review   Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  category Category
  score    Int                        // 1..5

  @@unique([reviewId, category])
}

// 집계 캐시 — 리뷰 변경 시 갱신. 랭킹 조회는 항상 이 테이블만 읽는다.
model ModelScore {
  modelId     String
  model       Model      @relation(fields: [modelId], references: [id], onDelete: Cascade)
  scoreType   ScoreType
  scope       ScoreScope
  raw         Float                   // 보정 전
  score       Float                   // 보정 후 (노출값)
  sampleCount Int                     // 평가 수 / 벤치마크 수
  tier        Tier
  updatedAt   DateTime   @updatedAt

  @@id([modelId, scoreType, scope])
  @@index([scoreType, scope, score])   // 랭킹 정렬용
}

model Benchmark {
  id             String    @id @default(cuid())
  slug           String    @unique     // "swe-bench-verified"
  name           String
  category       Category?             // null이면 종합에만 반영
  unit           String                // "%", "elo", "pass@1"
  higherIsBetter Boolean   @default(true)
  weight         Float     @default(1)
  sourceName     String
  sourceUrl      String
  results        BenchmarkResult[]
}

model BenchmarkResult {
  id          String    @id @default(cuid())
  modelId     String
  benchmarkId String
  model       Model     @relation(fields: [modelId], references: [id], onDelete: Cascade)
  benchmark   Benchmark @relation(fields: [benchmarkId], references: [id], onDelete: Cascade)
  value       Float
  measuredAt  DateTime
  sourceUrl   String?

  @@unique([modelId, benchmarkId])
}

model RankSnapshot {
  id        String    @id @default(cuid())
  modelId   String
  model     Model     @relation(fields: [modelId], references: [id], onDelete: Cascade)
  scoreType ScoreType
  scope     ScoreScope
  rank      Int
  score     Float
  date      DateTime  @db.Date

  @@unique([modelId, scoreType, scope, date])
  @@index([date, scoreType, scope])
}
```

> Auth.js 표준 테이블(`Account`, `Session`, `VerificationToken`)은 어댑터 스키마를 그대로 추가한다.

---

## 7. 화면 명세

### 7.1 홈 — 랭킹 (`/`)

**헤더**
- 좌: Tiera 로고(별 마크 + 워드마크) + 서브텍스트 `AI 모델 커뮤니티 평가`
- 중앙: 검색 입력 `모델 또는 개발사 검색` — 300ms 디바운스, 클라이언트 필터 + 서버 쿼리
- 우: 점수 타입 세그먼트 토글 `커뮤니티 평가` / `벤치마크`

**필터**
- 국가 칩: `전체` `미국` `중국` `한국` (4개 고정)
- 카테고리 탭: `종합` `코딩` `글쓰기` `추론` `멀티모달`
- 모든 필터 상태는 **URL 쿼리에 반영** (`?type=community&country=CN&scope=CODING`) — 공유 가능해야 한다.

**랭킹 행 (1행 구성)**
```
[순위]  [점수 원형]  [모델명]  [개발사 · 국가]        [비교 체크박스]  [티어 별 배지]
                    [공인/평가 중] [리뷰 N개] [▲2] [괴리 배지]
```
- 점수 원형: 티어 색 링 + 숫자. `PROVISIONAL`은 점선 링.
- 행 클릭 → 모델 상세. 체크박스는 이벤트 전파 차단.
- 비교 체크박스 2개 이상 선택 시 하단에 플로팅 바 `선택한 N개 비교하기` (최대 3개, 초과 시 토스트).
- 기본 20개 + 무한 스크롤 (cursor 기반).

**빈/에러 상태**
- 검색 결과 0건: "‘{검색어}’와 일치하는 모델이 없어요" + 필터 초기화 버튼
- 해당 카테고리 평가가 없는 모델은 리스트에서 제외 (`sampleCount = 0`)

### 7.2 모델 상세 (`/models/[slug]`)

1. **히어로**: 모델명, 개발사·국가, 출시일, 오픈웨이트 배지
2. **듀얼 스코어 카드** (좌우 2분할)
   - 커뮤니티 점수 (티어 별 마크 + 점수 + 리뷰 수 + 공인/평가 중)
   - 벤치마크 점수 (티어 별 마크 + 점수 + 반영 벤치마크 수)
   - 하단 중앙에 괴리 배지 + 한 줄 설명
3. **카테고리 breakdown**: 4개 카테고리 가로 바 차트. 커뮤니티/벤치마크 두 계열 오버레이.
4. **스펙 표**: 컨텍스트 윈도우, 입출력 가격($/1M), 모달리티, 오픈웨이트, 출시일
5. **벤치마크 원본 표**: 벤치마크명 · 원점수 · 정규화 점수 · 측정일 · 출처 링크(외부)
6. **리뷰 섹션**
   - 상단: `평가하기` 버튼 (비로그인 → 로그인 유도 / 이미 작성 → `내 평가 수정`)
   - 정렬: 최신순 / 평점 높은순 / 평점 낮은순
   - 리뷰 카드: 유저 아바타·닉네임, 카테고리별 점수 칩, 한줄평, 작성일, (본인 것이면 수정/삭제)

### 7.3 리뷰 작성 모달

- 4개 카테고리 각각 별 5개 + `평가 안 함` 토글
- 최소 1개 카테고리 필수
- 한줄평 선택, 0~500자 카운터
- 제출 → 낙관적 업데이트 + 점수 재계산 후 갱신된 점수 표시 ("내 평가가 반영됐어요, 종합 88.2 → 88.4")

### 7.4 비교 (`/compare?models=a,b,c`)

- 최대 3개. URL만으로 재현 가능.
- 상단 3열 카드: 각 모델의 듀얼 스코어 + 티어
- 카테고리 레이더 차트 1개에 3개 모델 오버레이
- 스펙 비교 표 — **행마다 최고값 하이라이트** (가격은 낮은 쪽이 우위)
- 공통 벤치마크만 추려서 바 차트 비교
- 모델 추가/교체 셀렉트

### 7.5 점수 산정 방식 (`/about`)

5절의 공식과 상수를 그대로 사람 말로 풀어 쓴 페이지. **MVP 필수** —
점수 근거를 공개하지 않으면 "이 사이트 점수 신뢰 못 함"이 첫 피드백으로 온다.

---

## 8. 주요 플로우

### 8.1 첫 방문 → 리뷰 작성
```
홈 랭킹 → 모델 카드 클릭 → 상세 → [평가하기]
  → 비로그인? → 로그인 모달(GitHub/Google) → OAuth → 원래 모델 상세로 복귀 (callbackUrl)
  → 평가 모달 → 카테고리 별점 + 한줄평 → 제출
  → POST /api/models/{slug}/reviews
  → 트랜잭션: Review + ReviewRating upsert → 해당 모델 ModelScore 재계산
  → 응답에 갱신 점수 포함 → UI 반영
```

### 8.2 점수 재계산 트리거
| 이벤트 | 재계산 범위 |
|---|---|
| 리뷰 생성/수정/삭제 | 해당 모델의 COMMUNITY 5개 scope |
| 전체 평균 `C_c` 갱신 | 일 1회 배치 (전 모델 재계산) |
| 벤치마크 시딩/갱신 | 전 모델 BENCHMARK 재계산 (min-max가 바뀌므로) |
| 일 1회 크론 | RankSnapshot 저장 |

### 8.3 모델 비교
```
홈에서 체크박스 2~3개 → 플로팅 바 → /compare?models=a,b
  또는 상세 페이지의 [비교에 추가] → 비교 트레이에 적재
```

---

## 9. API 명세

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/models` | 랭킹 목록. `?type=community\|benchmark&scope=OVERALL&country=&q=&cursor=&limit=20` | - |
| GET | `/api/models/[slug]` | 상세 (스코어·스펙·벤치마크 포함) | - |
| GET | `/api/models/[slug]/reviews` | 리뷰 목록. `?sort=recent\|high\|low&cursor=` | - |
| POST | `/api/models/[slug]/reviews` | 리뷰 생성 (upsert 아님, 중복 시 409) | 필요 |
| PATCH | `/api/reviews/[id]` | 본인 리뷰 수정 | 본인 |
| DELETE | `/api/reviews/[id]` | 본인 리뷰 삭제 | 본인 |
| GET | `/api/compare?models=a,b,c` | 비교 데이터 묶음 | - |
| GET | `/api/search?q=` | 모델·개발사 통합 검색 (자동완성) | - |
| POST | `/api/cron/snapshot` | 일일 랭킹 스냅샷 | `CRON_SECRET` |

- 응답 형식 통일: `{ data, meta?: { nextCursor, total } }` / 에러 `{ error: { code, message } }`
- 입력 검증은 **Zod 스키마 한 곳**에서 정의하고 클라이언트 폼과 서버가 공유한다.

---

## 10. 데이터 소스 어댑터 (자동화 훅)

지금은 시딩이지만, 나중에 외부 소스를 갈아끼울 수 있게 인터페이스만 먼저 판다.

```ts
// lib/data-sources/types.ts
export interface BenchmarkSource {
  readonly id: string;                       // "seed" | "lmarena" | ...
  fetchResults(): Promise<RawBenchmarkResult[]>;
}

export interface RawBenchmarkResult {
  modelSlug: string;
  benchmarkSlug: string;
  value: number;
  measuredAt: Date;
  sourceUrl?: string;
}
```
- MVP 구현체: `SeedBenchmarkSource` — `prisma/seed/benchmarks.json`을 읽는다.
- 후속: `LmArenaSource` 등. 수집기는 `RawBenchmarkResult[]`만 반환하고,
  정규화·집계는 공용 파이프라인(`lib/scoring/benchmark.ts`)이 담당한다.
- **원칙**: 수집(collect) / 정규화(normalize) / 집계(aggregate) / 표시(present) 4단계를 파일로 분리.

**시딩 초기 데이터 범위** (2026-09 기준, 각 개발사 공식 문서·공개 자료 확인)

| 국가 | 개발사 · 모델 |
|---|---|
| 미국 | Anthropic — Claude Fable 5.1 / Opus 5 / Sonnet 5 / Haiku 4.5<br>OpenAI — GPT-6 Astra / GPT-5.6 Sol · Terra · Luna<br>Google — Gemini 3.1 Pro / 3.8 Flash<br>SpaceXAI(구 xAI) — Grok 4.6 · Meta — Muse Spark 1.3 |
| 중국 | DeepSeek-V4-Pro · Kimi K3(Moonshot) · Qwen3.8-Max(Alibaba) · GLM-5.3(Z.ai) |
| 한국 | Solar Pro 4(Upstage) · K-EXAONE 2.0(LG AI Research) · HyperCLOVA X SEED Think(Naver Cloud) |

- 총 19개 모델 / 개발사 12곳 / 벤치마크 7종
- 출시일·컨텍스트·가격·모달리티·오픈웨이트는 확인한 값만 넣고, **확인하지 못한 항목은
  지어내지 않고 null로 둔다** (UI에서 `–`로 표시). 현재 K-EXAONE 2.0·HyperCLOVA X SEED Think은
  가격이 공개돼 있지 않아 비워 두었다.
- 더미 리뷰: 모델당 26~410개 (`NODE_ENV !== 'production'`에서만 생성).
  괴리 배지가 실제로 작동하는지 눈으로 보려고, 일부 모델의 커뮤니티 성향을 벤치마크와
  일부러 어긋나게 잡아뒀다 (Grok 4.6 · Gemini 3.1 Pro = 스펙 우위 표본,
  DeepSeek-V4-Pro · Kimi K3 · GLM-5.3 = 체감 우위 표본).
- ⚠️ **벤치마크 수치는 여전히 예시 값이다.** 모델 목록과 스펙은 실제를 따랐지만,
  각 모델의 벤치마크 점수는 실측치가 아니다. 출처를 "시드 데이터(예시)"로 표기하고
  `/about`에 고지한다.

## 11. 비기능 요구사항

**성능**
- 홈 랭킹은 `ModelScore` 인덱스 단일 쿼리로 해결. 리뷰 테이블을 런타임 집계하지 않는다.
- 랭킹/상세는 ISR (`revalidate: 300`), 리뷰 작성 시 `revalidatePath`로 무효화.
- LCP < 2.5s 목표. 목록 이미지는 로고 SVG만 사용.

**어뷰징 방지 (MVP 최소선)**
- 익명 리뷰 불가 — OAuth 로그인 필수
- 1인 1모델 1리뷰 (DB 유니크 제약)
- 리뷰 작성 rate limit: 사용자당 10분 5건
- 한줄평 최대 500자 + 서버측 sanitize (XSS)
- 리뷰 신고 / 어드민 모더레이션은 **Out of scope**

**보안**
- 모든 mutation은 서버에서 세션 검증 후 소유권 확인 (`review.userId === session.user.id`)
- Prisma 사용으로 SQL 인젝션 회피, 정렬 파라미터는 화이트리스트 매핑
- `.env` 값은 클라이언트로 새지 않게 `NEXT_PUBLIC_` 접두어 사용 금지 목록 명시

**접근성**
- 티어를 **색으로만** 구분하지 않는다 — 별 마크 형태 + 텍스트 라벨 동반 (색각 이상 대응)
- 별점 입력은 라디오 그룹 시맨틱 + 키보드 조작 가능
- 다크 배경 대비 4.5:1 이상 유지

**반응형**
- 모바일에서 랭킹 행은 2줄로 재배치, 비교 페이지는 가로 스크롤 표

---

## 12. MVP 범위

### In scope
- [x] 랭킹 조회 (점수 타입 토글 · 국가 필터 · 카테고리 탭 · 검색 · 무한 스크롤)
- [x] 모델 상세 (듀얼 스코어 · 괴리 배지 · 카테고리 breakdown · 스펙 · 벤치마크 원본)
- [x] 리뷰 CRUD (항목별 5점 척도 + 한줄평)
- [x] OAuth 로그인 (GitHub, Google)
- [x] 모델 비교 (최대 3개)
- [x] `/about` 점수 산정 방식
- [x] 시딩 데이터 + 어댑터 인터페이스
- [x] 일일 순위 스냅샷 크론

### v2 목표 — RAG 기반 모델 추천 챗봇

용도를 말하면 가격·성능을 근거로 모델을 추천해 주는 대화형 인터페이스.

> 입력 예: *"사무 업무에 사용할 건데 어떤 모델이 좋아?"*
> 출력: 후보 2~3개 + 각각의 추천 이유(가격 / 카테고리 점수 / 컨텍스트 / 한국어 처리)와
> 근거가 된 모델 상세 페이지 링크.

- **검색 대상(코퍼스)**: 모델 스펙·점수(`model`, `model_score`, `benchmark_result`)와
  커뮤니티 한줄평(`review.comment`). 한줄평이 핵심 자산이다 —
  "문서 정리에 써보니 한국어 처리가 낫더라" 같은 문장은 벤치마크로는 절대 안 나온다.
- **왜 RAG인가**: 점수 테이블만 조회해 규칙 기반으로 추천하면 "코딩 1위는 X"밖에 못 한다.
  "사무 업무"처럼 카테고리에 딱 안 떨어지는 질의를 실제 사용 후기에 매칭하려면 검색이 필요하다.
- **가격 축을 반드시 넣는다**: 랭킹 화면에는 없는 축이다. "성능은 3위지만 가격이 1/10"이
  실제 의사결정에서 가장 자주 답이 되므로, 추천 근거에 항상 가격 대비를 포함한다.
- **선행 조건**: 진짜 리뷰가 쌓여야 한다. 시드 더미 리뷰로 만들면 그럴듯한 거짓말을 하게 된다.
- **경계**: 추천은 참고용이다. 답변에 근거 링크를 반드시 붙이고,
  모델 선택의 유일한 근거로 삼지 말라는 고지를 유지한다.

### Out of scope (v1 이후)
- 리뷰 신고·모더레이션·어드민 콘솔
- 리뷰 좋아요/댓글
- 모델 등록 요청 폼
- 점수 변화 시계열 차트
- 외부 벤치마크 자동 수집 실행 (인터페이스만 준비)
- 다국어 (한국어만)
- 라이트 테마

---

## 13. 결정 필요 / 열린 이슈

| # | 이슈 | 제안 |
|---|---|---|
| 1 | ~~목업의 `S/A` 문자 티어 vs 브랜드 4티어~~ | ~~**해소.** Figma를 기준으로 4티어(Prism/Gold/Silver/Bronze) 확정, 문자 배지 폐기~~ |
| 2 | 5점 척도의 100점 환산식 (`R/5*100` → 최저 20점) | 최저 20점이 "완전 별로"에 20점을 주는 게 어색하면 `(R-1)/4*100` 대안. **`R/5*100` 권장** (목업 점수대와 일치) |
| 3 | 신뢰 임계 `m` 초기값 | 30. 트래픽 붙으면 상향 |
| 4 | 카테고리 가중치 (코딩·추론 0.3 / 글쓰기·멀티모달 0.2) | 개발자 타깃 반영. 사용자가 직접 가중치를 조절하는 "내 취향 랭킹"은 v2 후보 |
| 5 | 한국 모델 데이터 확보 | Upstage Solar, LG EXAONE, Naver HyperCLOVA X — 공개 벤치마크가 적어 벤치마크 점수 결측 처리 정책 필요 (`데이터 없음` 표기, 종합에서 제외) |
| 7 | 국가 범위 = 미국·중국·한국 3개국 고정 | **확정.** 개발사(Developer)의 국적을 기준으로 판정하며, 모델 단위 국가 필드는 두지 않는다. 유럽(Mistral 등)은 등록 대상 제외 — 확장 시 `Country` enum에 값을 추가하고 필터 칩만 늘리면 되도록 설계 |
| 6 | 도메인 / 배포 | Vercel + Neon(or Supabase Postgres) |
| ~~11~~ | ~~ORM 선택~~ | ~~**변경.** Prisma → **Drizzle ORM**. Prisma는 엔진 바이너리를 `binaries.prisma.sh`에서 받는데 개발 샌드박스의 이그레스 정책이 이를 차단해 실행·검증이 불가능했다. Drizzle은 순수 TypeScript라 바이너리 의존이 없다. 스키마는 6절과 1:1 대응~~ |
| 12 | 레이트 리미터가 인메모리 | 다중 인스턴스로 배포하면 사실상 무력화된다. 프로덕션 전 Redis(Upstash)로 교체 필요 (`lib/rate-limit.ts`) |
| 13 | 시드 벤치마크 수치가 예시 값 | 실측치가 아니다. `/about`에 고지하고 있으나, 런칭 전 공개 리더보드 실측치로 교체해야 한다 |
| ~~8~~ | ~~별 애셋 확보 방식~~ | ~~**해소.** (B) SVG 컴포넌트 재구성으로 확정, `components/tier/` 3파일 구현 완료~~ |
| 9 | PRISM 그라데이션 토큰과 별 마크 색이 다름 | **이원화로 정리.** `TIER_GRADIENT`(`#7B68FF → #FFB868`)는 브랜드 보드에 적힌 값 그대로 배지·텍스트·필에 쓰고, 별 마크는 자체 멀티 휴 팔레트(cyan → blue → violet → magenta)를 쓴다. 하나의 2-스톱 그라데이션으로는 10패싯 입체감이 안 나온다 |
| 10 | 별 마크 하단·좌측 패싯 명도 | 초안은 Figma보다 과하게 어두워 하단 다리가 거의 검게 보였다. 패싯 3·4·5·6·7·8의 명도를 14~36% 올려 맞췄다. **Figma와 나란히 놓고 최종 확인 필요** |

---

## 14. 다음 단계 (Task 분해 예고)

1. 프로젝트 스캐폴딩 (Next.js + TS + Tailwind + Prisma + ESLint/Prettier)
2. 디자인 토큰 & 티어 컴포넌트 (별 마크 SVG 4종, 스코어 링, 배지)
3. Prisma 스키마 + 마이그레이션 + 시드 스크립트
4. 스코어링 엔진 (`lib/scoring/`) + 단위 테스트 ← **가장 먼저 테스트를 붙일 곳**
5. 랭킹 API + 홈 화면
6. 모델 상세 화면
7. Auth.js 연동 + 리뷰 CRUD
8. 비교 화면
9. `/about` + 크론 스냅샷
10. QA: ESLint / Playwright E2E / 로컬 서버 직접 검수

---

## 15. 구현 현황 (2026-09-08)

| 단계 | 상태 |
|---|---|
| 스캐폴딩 · 디자인 토큰 · 티어 컴포넌트 | 완료 |
| Drizzle 스키마 · 시드 | 완료 |
| 스코어링 엔진 + 단위 테스트 38개 | 완료 |
| 랭킹 API + 홈 (토글·국가·카테고리·검색·무한 스크롤) | 완료 |
| 모델 상세 (듀얼 스코어·괴리·breakdown·스펙·벤치마크 원본) | 완료 |
| 비교(최대 3개) · `/about` | 완료 |
| Auth.js + 리뷰 CRUD + 레이트 리밋 | 완료 |
| 일일 스냅샷 크론 · Artificial Analysis 동기화 크론 | 완료 |
| Vercel 배포 (icn1) + Supabase | 완료 |
| 더미 리뷰 제거 · 커뮤니티 빈 상태 | 완료 |
| QA — tsc / ESLint / vitest 38 / Playwright E2E 20 / 프로덕션 빌드 | 전부 통과 |

### 15.1 더미 리뷰 제거 (2026-09-08)

시드가 만든 리뷰는 실데이터가 아니다. 벤치마크는 Artificial Analysis에서 실제로
받아오는데 커뮤니티 점수만 조작된 숫자로 남아 있으면, 이 사이트에서 제일 중요한
"체감 vs 벤치마크 괴리"가 통째로 거짓말이 된다. 그래서 지웠다.

- `lib/demo-data.ts` — 삭제 범위를 `seed-user-%@tiera.local` 계정으로 **한정**한다.
  리뷰 테이블을 직접 비우지 않고 더미 **계정**을 지워 FK cascade로 리뷰를 떨어뜨린다.
  실제 사용자의 평가는 이 경로로 지워질 수 없다. 삭제 후 `recomputeCommunity()`로
  `model_score` 캐시를 다시 계산한다.
- `db/purge-demo.ts` (`npm run db:purge-demo`) — 로컬/수동 실행용 CLI.
- `POST /api/cron/purge-demo` — `CRON_SECRET` 보호. 미설정 503 / 불일치 401.
- 커뮤니티 점수가 하나도 없으면 홈은 `?type=BENCHMARK`로 307 리다이렉트한다.
  이때 `scope` · `country` · `q`를 **전부 유지한다** (초기 구현은 `scope`만 넘겨서
  검색어가 조용히 사라졌다).
- 결과 0건이어도 검색어나 국가 필터가 걸려 있으면 "평가가 없다"가 아니라
  "이 조건에 없다"로 보여준다. 두 상태를 합쳤다가 E2E에서 잡혔다.

남은 것: **OAuth 미설정** — 프로덕션에 `AUTH_GITHUB_ID` / `AUTH_GOOGLE_ID`가 없어
아무도 로그인할 수 없고, 따라서 첫 리뷰도 남길 수 없다. 더미를 지운 지금 이게
커뮤니티 점수가 채워지지 않는 유일한 병목이다.
