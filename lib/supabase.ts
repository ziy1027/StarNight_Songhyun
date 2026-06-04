// ============================================================
// lib/supabase.ts
// Supabase 클라이언트 인스턴스
//
// - createBrowserClient(): 클라이언트 컴포넌트용 (anon key)
// - createServerClient(): API Routes / Server Components용 (service role)
//
// Next.js App Router에서는 서버 컴포넌트와 클라이언트 컴포넌트가
// 분리되어 있으므로 각각 다른 인스턴스를 사용한다.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { Diary, Observation } from "@/types";

// ----------------------------------------------------------
// 환경변수 검증 헬퍼
// ----------------------------------------------------------
function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`[supabase.ts] 환경변수 ${key}가 설정되지 않았습니다.`);
  return val;
}

// ----------------------------------------------------------
// 데이터베이스 타입 (Supabase Row 형태 → 앱 타입 변환용)
// ----------------------------------------------------------
export interface DiaryRow {
  id:            string;
  user_id:       string;
  date:          string;
  title:         string;
  content:       string;
  photo_url:     string | null;
  moon_phase:    string | null;
  moon_emoji:    string | null;
  weather_code:  number | null;
  cloud_cover:   number | null;
  is_favorite:   boolean;
  location_name: string | null;
  lat:           number | null;
  lng:           number | null;
  observed_at:   string | null;
  created_at:    string;
  updated_at:    string;
}

export interface ObservationRow {
  id:            string;
  user_id:       string;
  date:          string;
  location_name: string | null;
  lat:           number | null;
  lng:           number | null;
  created_at:    string;
}

/** DiaryRow → Diary 변환 */
export function toDiary(row: DiaryRow): Diary {
  return {
    id:           row.id,
    userId:       row.user_id,
    date:         row.date,
    title:        row.title,
    content:      row.content,
    photoUrl:     row.photo_url ?? undefined,
    moonPhase:    row.moon_phase ?? undefined,
    moonEmoji:    row.moon_emoji ?? undefined,
    weatherCode:  row.weather_code ?? undefined,
    cloudCover:   row.cloud_cover ?? undefined,
    isFavorite:   row.is_favorite,
    locationName: row.location_name ?? undefined,
    lat:          row.lat ?? undefined,
    lng:          row.lng ?? undefined,
    observedAt:   row.observed_at ?? undefined,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

/** ObservationRow → Observation 변환 */
export function toObservation(row: ObservationRow): Observation {
  return {
    id:           row.id,
    userId:       row.user_id,
    date:         row.date,
    locationName: row.location_name ?? undefined,
    lat:          row.lat ?? undefined,
    lng:          row.lng ?? undefined,
    createdAt:    row.created_at,
  };
}

// ----------------------------------------------------------
// 클라이언트용 Supabase (브라우저 / 클라이언트 컴포넌트)
// anon key 사용, RLS 적용됨
// ----------------------------------------------------------
export function createBrowserClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

// ----------------------------------------------------------
// 서버용 Supabase (API Routes / Server Components)
// service_role key 사용 → RLS 우회 (서버에서만 사용할 것!)
// ----------------------------------------------------------
export function createServerClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        // 서버 클라이언트는 세션 자동 갱신 불필요
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  );
}
