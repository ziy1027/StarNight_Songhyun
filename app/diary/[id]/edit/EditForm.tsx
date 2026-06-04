"use client";

import { useState, useRef, DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Diary } from "@/types";
import styles from "./page.module.css";

interface Props {
  diary: Diary;
}

export default function EditForm({ diary }: Props) {
  const router = useRouter();

  const [title,        setTitle]    = useState(diary.title);
  const [locationName, setLocation] = useState(diary.locationName ?? "");
  const [content,      setContent]  = useState(diary.content);
  const [photo,        setPhoto]    = useState<File | null>(null);
  const [preview,      setPreview]  = useState<string | null>(diary.photoUrl ?? null);
  const [isDrag,       setIsDrag]   = useState(false);
  const [saving,       setSaving]   = useState(false);

  // observedAt → time string (HH:MM)
  const initTime = diary.observedAt
    ? (() => {
        const t = new Date(diary.observedAt);
        return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
      })()
    : "";
  const [time, setTime] = useState(initTime);

  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function removePhoto() {
    setPhoto(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);

    const observedAt = time ? `${diary.date}T${time}:00` : "";

    const fd = new FormData();
    fd.append("title",   title.trim());
    fd.append("content", content.trim());
    fd.append("locationName", locationName.trim());
    fd.append("observedAt",   observedAt);
    if (photo) fd.append("photo", photo);

    const res = await fetch(`/api/diary/${diary.id}`, { method: "PATCH", body: fd });

    setSaving(false);
    if (res.ok) {
      router.push(`/diary/${diary.id}`);
      router.refresh();
    } else {
      alert("수정에 실패했습니다. 다시 시도해주세요.");
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <Link href={`/diary/${diary.id}`} className={styles.back}>← 돌아가기</Link>
        <h1 className={styles.pageTitle}>일기 수정</h1>
        <div style={{ width: 70 }} />
      </div>

      <div className={styles.form}>
        {/* 제목 */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="오늘 밤 별 이야기"
            maxLength={100}
          />
        </div>

        {/* 시간 + 위치 */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="time">관측 시각</label>
            <input
              id="time"
              type="time"
              className={styles.input}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="location">관측 장소</label>
            <input
              id="location"
              type="text"
              className={styles.input}
              value={locationName}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 강원도 태백"
            />
          </div>
        </div>

        {/* 본문 */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="content">
            내용 <span className={styles.required}>*</span>
          </label>
          <textarea
            id="content"
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />
        </div>

        {/* 사진 */}
        {preview ? (
          <div className={styles.preview}>
            <Image src={preview} alt="관측 사진 미리보기" fill className={styles.previewImg} />
            <button className={styles.previewRemove} onClick={removePhoto} aria-label="사진 제거">
              ✕
            </button>
          </div>
        ) : (
          <div
            className={`${styles.dropzone} ${isDrag ? styles.dragover : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            aria-label="사진 업로드"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className={styles.dropzoneInput}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              tabIndex={-1}
            />
            <div className={styles.dropzoneIcon} aria-hidden="true">📷</div>
            <p className={styles.dropzoneText}>사진을 드래그하거나 클릭해서 업로드</p>
            <p className={styles.dropzoneHint}>JPG, PNG (선택사항)</p>
          </div>
        )}

        {/* 버튼 */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={() => router.back()} type="button">
            취소
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!content.trim() || saving}
            type="button"
          >
            {saving ? "저장 중…" : "수정 완료"}
          </button>
        </div>
      </div>
    </main>
  );
}
