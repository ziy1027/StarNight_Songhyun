// ============================================================
// app/diary/page.tsx
// 내 관측 일기 목록 (서버 컴포넌트 → DiaryList 클라이언트로 위임)
// ============================================================

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServerClient, toDiary, DiaryRow } from "@/lib/supabase";
import type { Diary } from "@/types";
import DiaryList from "./DiaryList";

export const metadata: Metadata = {
  title: "내 일기 | StarNight",
  description: "나의 별 관측 일기 목록",
};

export default async function DiaryListPage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/login");

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("diaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const diaries: Diary[] = error ? [] : (data as DiaryRow[]).map(toDiary);

  return <DiaryList diaries={diaries} />;
}
