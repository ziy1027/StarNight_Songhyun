// ============================================================
// components/Providers/SessionProvider.tsx
// NextAuth SessionProvider 래퍼 (클라이언트 컴포넌트)
// layout.tsx(서버 컴포넌트)에서 직접 쓸 수 없으므로 분리
// ============================================================

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface Props {
  children: React.ReactNode;
  session?: Session | null;
}

export default function SessionProvider({ children, session }: Props) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
