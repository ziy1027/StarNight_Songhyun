// ============================================================
// app/diary/write/page.tsx
// 새 일기 쓰기 — 서버에서 인증 확인 후 클라이언트 폼 렌더
// ============================================================

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import WriteForm from "./WriteForm";

export const metadata: Metadata = {
  title: "일기 쓰기 | StarNight",
};

export default async function WritePage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/login");

  return <WriteForm />;
}
