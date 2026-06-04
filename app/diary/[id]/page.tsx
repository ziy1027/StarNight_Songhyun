// ============================================================
// app/diary/[id]/page.tsx
// 일기 상세 읽기 페이지
// ============================================================

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { createServerClient, toDiary, DiaryRow } from "@/lib/supabase";
import FavoriteButton from "./FavoriteButton";
import DeleteButton from "./DeleteButton";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `일기 상세 | StarNight`, description: `일기 ${id}` };
}

export default async function DiaryDetailPage({ params }: Props) {
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

  // 날짜 포맷
  const d = new Date(diary.date + "T00:00:00");
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const dateStr = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;

  // 관측 시각 포맷
  let timeStr: string | null = null;
  if (diary.observedAt) {
    const t = new Date(diary.observedAt);
    timeStr = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <main className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <Link href="/diary" className={styles.back}>← 일기 목록</Link>
        <FavoriteButton id={diary.id} isFavorite={diary.isFavorite} />
      </div>

      {/* 사진 */}
      {diary.photoUrl && (
        <div className={styles.photo}>
          <Image
            src={diary.photoUrl}
            alt="관측 사진"
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      )}

      {/* 제목 + 날짜 + 위치 */}
      <div className={styles.titleSection}>
        <h1 className={styles.title}>
          {diary.title || "제목 없음"}
        </h1>
        <p className={styles.meta}>
          <span>{dateStr}</span>
          {timeStr && <span> · {timeStr}</span>}
          {diary.locationName && (
            <span className={styles.location}> · 📍 {diary.locationName}</span>
          )}
        </p>
      </div>

      {/* 달/날씨 뱃지 */}
      {(diary.moonEmoji || diary.cloudCover !== undefined) && (
        <div className={styles.moonBadge}>
          {diary.moonEmoji && (
            <span className={styles.moonEmoji} aria-hidden="true">{diary.moonEmoji}</span>
          )}
          <div className={styles.moonInfo}>
            {diary.moonPhase && (
              <span className={styles.moonPhase}>{diary.moonPhase}</span>
            )}
            {diary.cloudCover !== undefined && (
              <span className={styles.cloudCover}>운량 {diary.cloudCover}%</span>
            )}
          </div>
        </div>
      )}

      {/* 본문 */}
      <div className={styles.content}>
        {diary.content}
      </div>

      {/* 수정/삭제 */}
      <div className={styles.actions}>
        <Link href={`/diary/${diary.id}/edit`} className={styles.editBtn}>
          수정
        </Link>
        <DeleteButton id={diary.id} />
      </div>
    </main>
  );
}
