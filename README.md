# Tiera

AI 모델의 로튼토마토.
**벤치마크 점수(스펙)** 와 **커뮤니티 점수(체감)** 를 나란히 놓고, 그 둘이 어긋나는 지점을
`스펙 우위` / `체감 우위` 배지로 드러낸다. 랭킹 리스트만 있는 사이트는 이미 많다 —
이 괴리가 Tiera의 존재 이유다.

수록 범위: 개발사 국적 기준 **미국 · 중국 · 한국**.

## 실행

```bash
# 1. Postgres
docker compose up -d          # 또는 로컬 Postgres 16

# 2. 환경변수
cp .env.example .env          # AUTH_SECRET만 바꿔도 개발은 된다

# 3. 스키마 + 시드
npm install
npm run db:push
npm run db:seed

# 4. 개발 서버
npm run dev                   # http://localhost:3000
```

OAuth 자격증명이 없으면 로그인 화면에 **개발용 로그인**(이메일만 입력)만 뜬다.
`ALLOW_DEV_LOGIN=true`이고 `NODE_ENV !== production`일 때만 켜지므로 프로덕션에서는 자동으로 꺼진다.

## 검증

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm test            # vitest — 스코어링 엔진 단위 테스트 23개
npx playwright test # E2E 14개 (dev 서버가 떠 있어야 한다)
```

## 구조

```
app/                    라우트 (App Router)
  api/models            랭킹 목록 API
  api/models/[slug]/reviews   리뷰 목록·작성
  api/reviews/[id]      리뷰 수정·삭제 (소유권 검증)
  api/cron/snapshot     일일 랭킹 스냅샷 (CRON_SECRET 필요)
components/tier/        티어 별 마크 — Figma 기준 SVG 재구성
components/ranking/     랭킹 행·필터·비교 트레이
components/model/       듀얼 스코어·카테고리 막대
components/review/      평가 입력·목록
db/                     Drizzle 스키마 · 시드
lib/scoring/            점수 산정 (순수 함수 + 집계 갱신)
lib/data-sources/       벤치마크 수집 어댑터 인터페이스
```

## 알아둘 것

- **랭킹은 `model_score` 집계 캐시만 읽는다.** `review`를 런타임에 집계하는 쿼리를 만들지 말 것.
  리뷰가 바뀌면 `recomputeCommunity(modelId)`가 캐시를 다시 채운다.
- **벤치마크 점수는 항상 전 모델을 재계산한다.** min-max 정규화라 값 하나가 바뀌면
  모든 모델의 점수가 바뀐다. 부분 갱신이 불가능하다.
- **괴리 판정은 점수 차가 아니라 순위 차로 한다.** 이유는 `lib/scoring/constants.ts` 주석 참고.
- **레이트 리미터가 인메모리다.** 다중 인스턴스로 배포하면 사실상 제한이 풀린다.
  프로덕션 전에 Redis로 교체해야 한다 (`lib/rate-limit.ts`).
- **시드의 벤치마크 수치는 예시 값이다.** 실측치가 아니며 `/about`에 그렇게 고지하고 있다.
  런칭 전 공개 리더보드의 실측치로 교체해야 한다.

자세한 설계는 `SPEC.md` 참고.

## Vercel 배포

### 1. DB 준비

Neon 또는 Supabase에서 Postgres를 만들고 **연결 문자열 두 개**를 확보한다.

- `DATABASE_URL` — **pooled** 엔드포인트 (Neon: 호스트에 `-pooler`, Supabase: 6543 포트)
- `DATABASE_URL_UNPOOLED` — 직결 엔드포인트 (마이그레이션 전용)

pooled를 쓰는 이유는 서버리스이기 때문이다. 람다 인스턴스마다 커넥션 풀이 따로 생기므로,
직결로 붙이면 동시 요청 몇십 개에 DB 커넥션 상한을 넘긴다.

### 2. 스키마 + 실데이터

```bash
DATABASE_URL_UNPOOLED="<주소>" npm run db:migrate

# Artificial Analysis에서 실제 벤치마크 데이터 수집
ARTIFICIAL_ANALYSIS_API_KEY="<키>" DATABASE_URL="<주소>" npm run data:sync -- --purge
```

`--purge`는 초기 시드로 넣었던 **예시 벤치마크**를 걷어낸다. 최초 1회만 붙이면 된다.

키는 https://artificialanalysis.ai 에서 무료로 발급받는다 (하루 1,000회).
**이용 약관상 출처 표기가 필수**라 푸터와 `/about`에 링크가 박혀 있다 — 지우지 말 것.

이 API가 주지 않는 항목(글쓰기·멀티모달)은 비워 둔다. 없는 값을 0으로 채우면
"실제로 0점"과 구분되지 않고, 스코어링이 값 없는 카테고리를 가중치에서 빼도록 돼 있다.

### (참고) 예시 데이터로만 띄우기

```bash
DATABASE_URL_UNPOOLED="<직결 주소>" npm run db:migrate
DATABASE_URL="<직결 주소>" npm run db:seed
```

`db:seed`는 `NODE_ENV=production`이면 **더미 리뷰를 만들지 않는다.**
프로덕션 DB에 가짜 평가를 심으면 점수 자체가 거짓말이 되기 때문이다.
즉 배포 직후에는 커뮤니티 점수가 비어 있고 벤치마크 점수만 존재한다.

### 3. Vercel 환경변수

| 변수 | 값 |
|---|---|
| `DATABASE_URL` | pooled 주소 |
| `DATABASE_URL_UNPOOLED` | 직결 주소 |
| `AUTH_SECRET` | `openssl rand -base64 32` 로 새로 생성 |
| `AUTH_URL` | `https://<배포 도메인>` |
| `CRON_SECRET` | 임의의 긴 문자열 |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth App (선택) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth (선택) |

`ALLOW_DEV_LOGIN`은 **넣지 않는다.** 프로덕션에서는 코드가 강제로 끄지만, 애초에 두지 않는 편이 낫다.

OAuth 콜백 URL은 `https://<도메인>/api/auth/callback/github` (google도 동일 패턴).

> ⚠️ OAuth를 하나도 설정하지 않으면 프로덕션에 **로그인 수단이 전혀 없다.**
> 개발용 이메일 로그인은 프로덕션에서 꺼지므로, 아무도 평가를 남길 수 없는 상태가 된다.

### 4. 크론

`vercel.json`에 일일 스냅샷이 정의돼 있다 (UTC 15:05 = KST 00:05).
Vercel이 `CRON_SECRET`을 `Authorization: Bearer`로 자동 첨부한다.

### 5. 배포 전 확인

- [ ] `.env`가 커밋되지 않았는지 (`git status`에 안 보여야 한다)
- [ ] `AUTH_SECRET`이 예제값이 아닌 새로 생성한 값인지
- [ ] 벤치마크가 실데이터인지 (`npm run data:sync` 실행 여부)
- [ ] Artificial Analysis 출처 표기가 살아 있는지 (푸터 / `/about`)
- [ ] 커뮤니티 리뷰가 개발용 더미인지 실사용자 것인지
- [ ] 레이트 리미터가 인메모리라 서버리스에서는 사실상 무력하다는 점 인지 (`lib/rate-limit.ts`)
