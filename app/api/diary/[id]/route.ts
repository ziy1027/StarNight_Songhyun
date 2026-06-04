// ============================================================
// app/api/diary/[id]/route.ts
// 일기 단건 API — 조회(GET) / 수정(PATCH) / 삭제(DELETE)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerClient, toDiary, DiaryRow } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session?.user as any)?.id ?? null;
}

// ── GET /api/diary/[id] ───────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("diaries")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "일기를 찾을 수 없습니다" }, { status: 404 });

  return NextResponse.json(toDiary(data as DiaryRow));
}

// ── PATCH /api/diary/[id] ─────────────────────────────
// JSON body 또는 FormData (사진 포함 수정)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerClient();

  const contentType = request.headers.get("content-type") ?? "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};

  if (contentType.includes("multipart/form-data")) {
    const formData    = await request.formData();
    const title       = formData.get("title") as string | null;
    const content     = formData.get("content") as string | null;
    const locationName = formData.get("locationName") as string | null;
    const observedAt  = formData.get("observedAt") as string | null;
    const photo       = formData.get("photo") as File | null;

    if (title       !== null) updates.title         = title.trim();
    if (content     !== null) updates.content        = content.trim();
    if (locationName !== null) updates.location_name = locationName.trim() || null;
    if (observedAt  !== null) updates.observed_at   = observedAt || null;

    if (photo && photo.size > 0) {
      const ext    = photo.name.split(".").pop() ?? "jpg";
      const path   = `${userId}/${id}.${ext}`;
      const buffer = await photo.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("diary-photos")
        .upload(path, buffer, { contentType: photo.type, upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("diary-photos").getPublicUrl(path);
        updates.photo_url = urlData.publicUrl;
      }
    }
  } else {
    // JSON (즐겨찾기 토글 등)
    const body = await request.json().catch(() => ({}));
    if (body.isFavorite  !== undefined) updates.is_favorite   = body.isFavorite;
    if (body.title       !== undefined) updates.title         = body.title;
    if (body.content     !== undefined) updates.content       = body.content;
    if (body.locationName !== undefined) updates.location_name = body.locationName || null;
    if (body.observedAt  !== undefined) updates.observed_at  = body.observedAt || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "업데이트할 항목이 없습니다" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("diaries")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toDiary(data as DiaryRow));
}

// ── DELETE /api/diary/[id] ────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("diaries")
    .select("photo_url")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.photo_url) {
    const path = existing.photo_url.split("/diary-photos/")[1];
    if (path) await supabase.storage.from("diary-photos").remove([path]);
  }

  const { error } = await supabase
    .from("diaries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
