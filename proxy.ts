// ============================================================
// proxy.ts (프로젝트 루트) — Next.js 16+에서 middleware → proxy로 명칭 변경
// 보호 라우트: 로그인이 필요한 경로를 /login으로 redirect
// ============================================================

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId  = (session?.user as any)?.id;

  // 보호 경로(/diary, /stats)에서 미로그인이면 /login으로 redirect
  if (!userId) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/diary/:path*",
    "/stats/:path*",
  ],
};
