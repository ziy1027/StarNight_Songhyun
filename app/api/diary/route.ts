// ============================================================
// app/api/diary/route.ts
// 일기 API — 목록 조회(GET) + 작성(POST)
// ============================================================

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerClient, toDiary, DiaryRow } from "@/lib/supabase";
import { getMoonPhase, getMoonEmoji } from "@/lib/moonPhase";
import { getWeatherByCoords, DEFAULT_COORDS } from "@/lib/weather";

async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session?.user as any)?.id ?? null;
}

// ──────────────────────────────────────────────────────
// GET /api/diary
// 로그인 유저의 일기 목록 (생성일 내림차순)
// Query: ?tab=favorites → 즐겨찾기만
// ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const tab = request.nextUrl.searchParams.get("tab");

  const supabase = createServerClient();
  let query = supabase
    .from("diaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (tab === "favorites") {
    query = query.eq("is_favorite", true);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data as DiaryRow[]).map(toDiary));
}

// ──────────────────────────────────────────────────────
// POST /api/diary
// 새 일기 작성
// Body: FormData { title, date, content, photo?, locationName?, observedAt? }
// ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const formData    = await request.formData();
  const title       = (formData.get("title") as string | null)?.trim() ?? "";
  const date        = formData.get("date") as string | null;
  const content     = (formData.get("content") as string | null)?.trim() ?? "";
  const photo       = formData.get("photo") as File | null;
  const locationName = (formData.get("locationName") as string | null)?.trim() || null;
  const observedAt  = (formData.get("observedAt") as string | null) || null;

  if (!date || !content) {
    return NextResponse.json({ error: "date와 content는 필수입니다" }, { status: 400 });
  }

  const id = randomUUID();
  const supabase = createServerClient();

  // 사진 업로드 (선택)
  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const ext    = photo.name.split(".").pop() ?? "jpg";
    const path   = `${userId}/${id}.${ext}`;
    const buffer = await photo.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("diary-photos")
      .upload(path, buffer, { contentType: photo.type, upsert: false });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("diary-photos")
        .getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }
  }

  // 달 위상 + 날씨 자동 계산
  const dateObj  = new Date(date + "T12:00:00");
  const phaseVal = getMoonPhase(dateObj);
  const moon     = getMoonEmoji(phaseVal);
  const weather  = await getWeatherByCoords(
    DEFAULT_COORDS.latitude,
    DEFAULT_COORDS.longitude,
  ).catch(() => null);

  const { data, error } = await supabase
    .from("diaries")
    .insert({
      id,
      user_id:       userId,
      date,
      title,
      content,
      photo_url:     photoUrl,
      moon_phase:    moon.name,
      moon_emoji:    moon.emoji,
      weather_code:  weather?.weatherCode ?? null,
      cloud_cover:   weather?.cloudCover  ?? null,
      is_favorite:   false,
      location_name: locationName,
      observed_at:   observedAt,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toDiary(data as DiaryRow), { status: 201 });
}
