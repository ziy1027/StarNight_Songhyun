// ============================================================
// auth.ts (프로젝트 루트)
// NextAuth v5 (Auth.js) 설정
//
// 구조:
//   auth.ts → handlers, auth, signIn, signOut export
//   app/api/auth/[...nextauth]/route.ts → handlers re-export
//   middleware.ts → 보호 라우트 처리
// ============================================================

import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import { createServerClient } from "@/lib/supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,

  // ── OAuth Providers ────────────────────────────────────
  providers: [
    Kakao({
      clientId:     process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "profile_nickname profile_image account_email",
        },
      },
    }),
    // Google은 준비됐을 때 추가
    // Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
  ],

  // ── 세션 전략: JWT ─────────────────────────────────────
  // Supabase DB를 직접 세션 저장소로 사용하지 않고
  // JWT에 user.id를 담아 전달
  session: { strategy: "jwt" },

  // ── 콜백 ───────────────────────────────────────────────
  callbacks: {
    /**
     * 로그인 성공 시 호출
     * Supabase users 테이블에 upsert
     */
    async signIn({ user, account }) {
      if (!user.id || !user.email || !account) return false;

      try {
        const supabase = createServerClient();
        const { error } = await supabase
          .from("users")
          .upsert(
            {
              id:       user.id,
              email:    user.email,
              name:     user.name  ?? null,
              image:    user.image ?? null,
              provider: account.provider,      // 'kakao' | 'google'
            },
            { onConflict: "id" }               // id 충돌 시 update
          );

        if (error) {
          console.error("[auth.ts] Supabase upsert 실패:", error.message);
          // upsert 실패해도 로그인은 허용 (DB 연결 전에 테스트 가능하도록)
        }
      } catch (err) {
        console.error("[auth.ts] signIn callback 오류:", err);
      }

      return true;
    },

    /**
     * JWT 생성/갱신 시 호출
     * token에 user.id를 저장해 session에서 접근 가능하게 함
     */
    async jwt({ token, user }) {
      // 최초 로그인 시 user 객체가 있음 → token에 id 저장
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },

    /**
     * 세션 조회 시 호출
     * token.userId를 session.user.id로 노출
     */
    async session({ session, token }) {
      if (token.userId && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.userId as string;
      }
      return session;
    },
  },

  // ── 커스텀 페이지 ───────────────────────────────────────
  pages: {
    signIn: "/login",   // 커스텀 로그인 페이지 (추후 구현 가능)
  },
});
