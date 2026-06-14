// ============================================================
// app/api/user/route.ts
// 내 프로필 조회(GET) + 수정(PATCH)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerClient } from "@/lib/supabase";

async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session?.user as any)?.id ?? null;
}

// ── GET /api/user ─────────────────────────────────────────
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, image, provider, created_at")
    .eq("id", userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── PATCH /api/user ───────────────────────────────────────
// Body: FormData { name?, email?, photo? }
export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const formData = await request.formData();
  const name  = (formData.get("name")  as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const photo = formData.get("photo") as File | null;

  const supabase = createServerClient();

  // 프로필 사진 업로드
  let imageUrl: string | undefined;
  if (photo && photo.size > 0) {
    const ext  = photo.name.split(".").pop() ?? "jpg";
    const path = `${userId}/profile.${ext}`;
    const buf  = await photo.arrayBuffer();

    const { error: upErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, buf, { contentType: photo.type, upsert: true });

    if (!upErr) {
      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }
  }

  const updates: Record<string, string | null> = {};
  if (name  !== null) updates.name  = name;
  if (email !== null) updates.email = email;
  if (imageUrl)       updates.image = imageUrl;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select("id, email, name, image, provider, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
