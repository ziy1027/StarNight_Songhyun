// ============================================================
// app/api/observation/route.ts
// 관측 체크 API — 목록(GET) / 추가(POST) / 취소(DELETE)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerClient, toObservation, ObservationRow } from "@/lib/supabase";

async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session?.user as any)?.id ?? null;
}

// ── GET /api/observation ─────────────────────────────
// 로그인 유저의 전체 관측 기록 (날짜 내림차순)
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("observations")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as ObservationRow[]).map(toObservation));
}

// ── POST /api/observation ────────────────────────────
// 관측 체크 추가
// Body: JSON { date, locationName?, lat?, lng? }
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const body = await request.json() as {
    date: string;
    locationName?: string;
    lat?: number;
    lng?: number;
  };

  if (!body.date) return NextResponse.json({ error: "date가 필요합니다" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("observations")
    .upsert(
      {
        user_id:       userId,
        date:          body.date,
        location_name: body.locationName ?? null,
        lat:           body.lat ?? null,
        lng:           body.lng ?? null,
      },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toObservation(data as ObservationRow), { status: 201 });
}

// ── DELETE /api/observation ──────────────────────────
// 관측 체크 취소
// Query: ?date=YYYY-MM-DD
export async function DELETE(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date 파라미터가 필요합니다" }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("observations")
    .delete()
    .eq("user_id", userId)
    .eq("date", date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
