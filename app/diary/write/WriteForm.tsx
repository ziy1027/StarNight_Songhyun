"use client";

import { useState, useRef, DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function WriteForm() {
  const router = useRouter();

  const [title,        setTitle]       = useState("");
  const [date,         setDate]        = useState(todayStr);
  const [time,         setTime]        = useState(nowTimeStr);
  const [locationName, setLocation]    = useState("");
  const [content,      setContent]     = useState("");
  const [photo,        setPhoto]       = useState<File | null>(null);
  const [preview,      setPreview]     = useState<string | null>(null);
  const [isDrag,       setIsDrag]      = useState(false);
  const [saving,       setSaving]      = useState(false);

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

    // date + time → ISO observedAt (선택)
    const observedAt = time ? `${date}T${time}:00` : "";

    const fd = new FormData();
    fd.append("title",   title.trim());
    fd.append("date",    date);
    fd.append("content", content.trim());
    if (locationName.trim()) fd.append("locationName", locationName.trim());
    if (observedAt)          fd.append("observedAt",   observedAt);
    if (photo)               fd.append("photo",        photo);

    const res = await fetch("/api/diary", { method: "POST", body: fd });

    setSaving(false);
    if (res.ok) {
      const diary = await res.json();
      router.push(`/diary/${diary.id}`);
      router.refresh();
    } else {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  }

  const canSave = content.trim().length > 0 && !saving;

  return (
    <main className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <Link href="/diary" className={styles.back}>← 일기 목록</Link>
        <h1 className={styles.pageTitle}>일기 쓰기</h1>
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

        {/* 날짜 + 시간 */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="date">날짜</label>
            <input
              id="date"
              type="date"
              className={styles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
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
        </div>

        {/* 관측 지역 */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="location">관측 장소</label>
          <input
            id="location"
            type="text"
            className={styles.input}
            value={locationName}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 강원도 태백, 서울 북악산"
          />
        </div>

        {/* 본문 */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="content">내용 <span className={styles.required}>*</span></label>
          <textarea
            id="content"
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 밤하늘은 어떠셨나요? 별을 보며 느낀 것들을 자유롭게 기록해보세요 🌟"
            rows={8}
          />
        </div>

        {/* 사진 업로드 */}
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
            disabled={!canSave}
            type="button"
          >
            {saving ? "저장 중…" : "일기 저장"}
          </button>
        </div>
      </div>
    </main>
  );
}
