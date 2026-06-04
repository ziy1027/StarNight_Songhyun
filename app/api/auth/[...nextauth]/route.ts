// ============================================================
// app/api/auth/[...nextauth]/route.ts
// NextAuth v5 Route Handler
// auth.ts의 handlers를 re-export함
// ============================================================

import { handlers } from "@/auth";
export const { GET, POST } = handlers;
