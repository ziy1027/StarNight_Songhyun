// ============================================================
// app/diary/[id]/edit/page.tsx
// 일기 수정 페이지 — 서버에서 데이터 로드, 클라이언트 폼 렌더
// ============================================================

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServerClient, toDiary, DiaryRow } from "@/lib/supabase";
import EditForm from "./EditForm";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "일기 수정 | StarNight" };
}

export default async function DiaryEditPage({ params }: Props) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/login");

  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("diaries")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) notFound();

  const diary = toDiary(data as DiaryRow);

  return <EditForm diary={diary} />;
}
