// ============================================================
// app/api/lunar/route.ts
// 음력 변환 API Route Handler
// GET /api/lunar?date=YYYY-MM-DD
//
// 클라이언트 컴포넌트(MoonCalendar 등)에서는
// 직접 korean-lunar-calendar를 import할 수 없으므로
// 이 API를 통해 서버에서 변환 결과를 받아옴
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getLunarDate } from "@/lib/lunar";
import type { LunarDate } from "@/types";

export async function GET(request: NextRequest) {
  const dateStr = request.nextUrl.searchParams.get("date");

  // 날짜 파라미터 유효성 검사
  if (!dateStr) {
    return NextResponse.json({ error: "date 파라미터가 필요합니다 (YYYY-MM-DD)" }, { status: 400 });
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return NextResponse.json({ error: "올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)" }, { status: 400 });
  }

  const year  = +match[1];
  const month = +match[2];
  const day   = +match[3];

  let lunar: LunarDate;
  try {
    lunar = getLunarDate(new Date(year, month - 1, day));
  } catch (err) {
    console.error("[api/lunar] 음력 변환 오류:", err);
    return NextResponse.json({ error: "음력 변환 실패" }, { status: 500 });
  }

  return NextResponse.json(lunar, {
    headers: {
      // 음력 계산 결과는 날짜가 바뀌기 전까지 불변 → 1일(86400초) 캐시
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
