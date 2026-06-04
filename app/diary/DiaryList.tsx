"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Diary } from "@/types";
import styles from "./page.module.css";

type Tab = "all" | "favorites";

interface Props {
  diaries: Diary[];
}

export default function DiaryList({ diaries }: Props) {
  const [tab, setTab] = useState<Tab>("all");

  const filtered =
    tab === "favorites" ? diaries.filter((d) => d.isFavorite) : diaries;

  return (
    <main className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>내 관측 일기</h1>
        <Link href="/diary/write" className={styles.writeBtn}>
          + 일기 쓰기
        </Link>
      </div>

      {/* 탭 */}
      <div className={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={tab === "all"}
          className={`${styles.tab} ${tab === "all" ? styles.tabActive : ""}`}
          onClick={() => setTab("all")}
        >
          전체
          <span className={styles.tabCount}>{diaries.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "favorites"}
          className={`${styles.tab} ${tab === "favorites" ? styles.tabActive : ""}`}
          onClick={() => setTab("favorites")}
        >
          즐겨찾기
          <span className={styles.tabCount}>
            {diaries.filter((d) => d.isFavorite).length}
          </span>
        </button>
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <Empty tab={tab} />
      ) : (
        <ul className={styles.list}>
          {filtered.map((d) => (
            <DiaryCard key={d.id} diary={d} />
          ))}
        </ul>
      )}
    </main>
  );
}

// ── 카드 ──────────────────────────────────────────────
function DiaryCard({ diary }: { diary: Diary }) {
  const d = new Date(diary.date + "T00:00:00");
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const dateStr = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;

  return (
    <li>
      <Link href={`/diary/${diary.id}`} className={styles.card}>
        {/* 썸네일 */}
        <div className={styles.cardThumb}>
          {diary.photoUrl ? (
            <Image
              src={diary.photoUrl}
              alt="관측 사진"
              fill
              sizes="72px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className={styles.cardThumbEmoji} aria-hidden="true">
              {diary.moonEmoji ?? "🌙"}
            </span>
          )}
        </div>

        {/* 본문 */}
        <div className={styles.cardBody}>
          <p className={styles.cardTitle}>
            {diary.title || "제목 없음"}
          </p>
          <p className={styles.cardMeta}>
            {dateStr}
            {diary.locationName && (
              <span className={styles.cardLocation}> · {diary.locationName}</span>
            )}
          </p>
          <p className={styles.cardPreview}>{diary.content}</p>
        </div>

        {/* 즐겨찾기 표시 */}
        {diary.isFavorite && (
          <span className={styles.cardFav} aria-label="즐겨찾기">★</span>
        )}
      </Link>
    </li>
  );
}

// ── 빈 상태 ───────────────────────────────────────────
function Empty({ tab }: { tab: Tab }) {
  if (tab === "favorites") {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyIcon} aria-hidden="true">★</p>
        <p className={styles.emptyText}>즐겨찾기한 일기가 없어요</p>
        <p className={styles.emptyHint}>
          마음에 드는 일기에 별표를 눌러 저장해보세요
        </p>
      </div>
    );
  }

  return (
    <div className={styles.empty}>
      <p className={styles.emptyIcon} aria-hidden="true">✍️</p>
      <p className={styles.emptyText}>아직 작성한 일기가 없어요</p>
      <p className={styles.emptyHint}>별을 보고 난 날의 기억을 기록해보세요!</p>
      <Link href="/diary/write" className={styles.emptyBtn}>
        첫 일기 쓰기
      </Link>
    </div>
  );
}
