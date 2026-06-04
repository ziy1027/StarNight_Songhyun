// ============================================================
// app/api/observation/check/route.ts
// 특정 날짜 체크 여부 단건 조회
// GET /api/observation/check?date=YYYY-MM-DD
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId  = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ checked: false });

  const date = request.nextUrl.searchParams.get("date");
  if (!date)  return NextResponse.json({ checked: false });

  const supabase = createServerClient();
  const { data } = await supabase
    .from("observations")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  return NextResponse.json({ checked: !!data });
}
