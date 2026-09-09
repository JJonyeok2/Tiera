-- 컬럼 추가는 IF NOT EXISTS로 둔다.
-- 운영 DB에 SQL 편집기로 먼저 넣고 나중에 db:migrate를 돌리는 경우가 있는데,
-- 그때 "이미 있는 컬럼" 오류로 마이그레이션 전체가 멈추는 것을 막는다.
ALTER TABLE "review" ADD COLUMN IF NOT EXISTS "is_anonymous" boolean DEFAULT false NOT NULL;
