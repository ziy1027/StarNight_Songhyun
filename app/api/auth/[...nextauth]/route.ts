// app/api/auth/[...nextauth]/route.ts
// auth.ts의 handlers를 re-export (NextAuth v5 방식)
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
