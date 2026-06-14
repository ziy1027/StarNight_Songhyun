-- ============================================================
-- Supabase SQL 스키마 — 달과 별 (stargazing-calendar)
-- Supabase 대시보드 → SQL Editor에서 실행하세요
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. users 테이블
-- NextAuth 로그인 성공 시 upsert됨
-- ──────────────────────────────────────────────────────────
create table if not exists public.users (
  id          text        primary key,          -- NextAuth user.id (OAuth sub)
  email       text        unique,               -- nullable: 카카오는 이메일 미제공 가능
  name        text,
  image       text,                             -- 프로필 이미지 URL
  provider    text        not null,             -- 'kakao' | 'google'
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 2. diaries 테이블
-- 날짜별 별 관측 일기
-- ──────────────────────────────────────────────────────────
create table if not exists public.diaries (
  id            uuid        primary key default gen_random_uuid(),
  user_id       text        not null references public.users(id) on delete cascade,
  date          date        not null,
  title         text        not null default '',
  content       text        not null default '',
  photo_url     text,
  moon_phase    text,
  moon_emoji    text,
  weather_code  integer,
  cloud_cover   integer,
  is_favorite   boolean     not null default false,
  location_name text,
  lat           numeric(9,6),
  lng           numeric(9,6),
  observed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, date)
);

-- updated_at 자동 갱신 트리거
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger diaries_updated_at
  before update on public.diaries
  for each row execute function public.update_updated_at();

-- ──────────────────────────────────────────────────────────
-- 3. observations 테이블
-- "오늘 별 봤어요" 체크 기록
-- ──────────────────────────────────────────────────────────
create table if not exists public.observations (
  id            uuid        primary key default gen_random_uuid(),
  user_id       text        not null references public.users(id) on delete cascade,
  date          date        not null,
  location_name text,                           -- 예: "서울", "강릉"
  lat           numeric(9, 6),
  lng           numeric(9, 6),
  created_at    timestamptz not null default now(),
  unique (user_id, date)                        -- 날짜당 체크 1회
);

-- ──────────────────────────────────────────────────────────
-- 4. 인덱스 (쿼리 성능)
-- ──────────────────────────────────────────────────────────
create index if not exists diaries_user_date_idx    on public.diaries(user_id, date desc);
create index if not exists observations_user_date_idx on public.observations(user_id, date desc);

-- ──────────────────────────────────────────────────────────
-- 5. Row Level Security (RLS)
-- 각 유저는 자신의 데이터만 접근 가능
-- 참고: API Routes에서 service_role 키를 사용하면 RLS 우회됨.
--       RLS는 client 직접 접근 시의 안전망 역할.
-- ──────────────────────────────────────────────────────────

-- users 테이블 RLS
alter table public.users enable row level security;

create policy "users: 본인 조회"
  on public.users for select
  using (id = current_setting('app.user_id', true)::text);

create policy "users: 본인 수정"
  on public.users for update
  using (id = current_setting('app.user_id', true)::text);

-- diaries 테이블 RLS
alter table public.diaries enable row level security;

create policy "diaries: 본인 전체 조회"
  on public.diaries for select
  using (user_id = current_setting('app.user_id', true)::text);

create policy "diaries: 본인 작성"
  on public.diaries for insert
  with check (user_id = current_setting('app.user_id', true)::text);

create policy "diaries: 본인 수정"
  on public.diaries for update
  using (user_id = current_setting('app.user_id', true)::text);

create policy "diaries: 본인 삭제"
  on public.diaries for delete
  using (user_id = current_setting('app.user_id', true)::text);

-- observations 테이블 RLS
alter table public.observations enable row level security;

create policy "observations: 본인 조회"
  on public.observations for select
  using (user_id = current_setting('app.user_id', true)::text);

create policy "observations: 본인 추가"
  on public.observations for insert
  with check (user_id = current_setting('app.user_id', true)::text);

create policy "observations: 본인 삭제"
  on public.observations for delete
  using (user_id = current_setting('app.user_id', true)::text);

-- ──────────────────────────────────────────────────────────
-- 6. Supabase Storage 버킷 (사진 업로드용)
-- ──────────────────────────────────────────────────────────
-- Supabase 대시보드 → Storage → New Bucket 에서 수동 생성하거나
-- 아래 SQL로 생성 (Storage 권한 필요)

insert into storage.buckets (id, name, public)
values ('diary-photos', 'diary-photos', false)
on conflict (id) do nothing;

-- diary-photos 버킷 정책: 로그인 유저만 자신의 폴더에 업로드 가능
create policy "diary-photos: 본인 업로드"
  on storage.objects for insert
  with check (
    bucket_id = 'diary-photos'
    -- 경로 형식: {user_id}/{filename}
  );

create policy "diary-photos: 본인 조회"
  on storage.objects for select
  using (bucket_id = 'diary-photos');
