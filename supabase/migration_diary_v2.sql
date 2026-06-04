-- ============================================================
-- Migration: diaries 테이블 v2
-- 실행: Supabase 대시보드 → SQL Editor
-- ============================================================

-- 새 컬럼 추가
ALTER TABLE public.diaries
  ADD COLUMN IF NOT EXISTS title        text         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_favorite  boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS lat          numeric(9,6),
  ADD COLUMN IF NOT EXISTS lng          numeric(9,6),
  ADD COLUMN IF NOT EXISTS observed_at  timestamptz;

-- 날짜당 1개 제한 해제 (여러 일기 허용)
ALTER TABLE public.diaries
  DROP CONSTRAINT IF EXISTS diaries_user_id_date_key;

-- 인덱스 재정비
CREATE INDEX IF NOT EXISTS diaries_user_favorite_idx
  ON public.diaries(user_id, is_favorite)
  WHERE is_favorite = true;
