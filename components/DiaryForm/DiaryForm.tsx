// ============================================================
// components/DiaryForm/DiaryForm.tsx
// 일기 작성/수정 폼 컴포넌트 (클라이언트)
// ============================================================

"use client";

import { useState, useRef, DragEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./DiaryForm.module.css";
import type { Diary, DiaryFormData } from "@/types";
import { getMoonPhase, getMoonEmoji } from "@/lib/moonPhase";

interface DiaryFormProps {
  date: string;                    // YYYY-MM-DD
  initialData?: Diary;             // 수정 모드일 때 기존 데이터
  moonEmoji?: string;              // 달 이모지 (상위에서 전달)
  moonPhaseName?: string;          // 달 위상 이름
  weatherDescription?: string;     // 날씨 설명
  cloudCover?: number;             // 운량
}

export default function DiaryForm({
  date,
  initialData,
  moonEmoji: moonEmojiProp,
  moonPhaseName: moonPhaseNameProp,
  weatherDescription,
  cloudCover,
}: DiaryFormProps) {
  const router = useRouter();

  // 달 위상 계산 (props가 없으면 직접 계산)
  const dateObj  = new Date(date + "T12:00:00");
  const phaseVal = getMoonPhase(dateObj);
  const moon     = getMoonEmoji(phaseVal);
  const emoji    = moonEmojiProp      ?? moon.emoji;
  const phase    = moonPhaseNameProp  ?? moon.nameKo;

  // 폼 상태
  const [content, setContent] = useState(initialData?.content ?? "");
  const [preview, setPreview] = useState<string | null>(initialData?.photoUrl ?? null);
  const [photo,   setPhoto]   = useState<File | null>(null);
  const [isDrag,  setIsDrag]  = useState(false);
  const [saving,  setSaving]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 처리
  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // 저장
  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);

    const fd = new FormData();
    fd.append("date", date);
    fd.append("content", content);
    if (photo) fd.append("photo", photo);

    const isEdit   = !!initialData;
    const endpoint = isEdit ? `/api/diary/${date}` : "/api/diary";
    const method   = isEdit ? "PUT" : "POST";

    const res = await fetch(endpoint, { method, body: fd });

    setSaving(false);
    if (res.ok) {
      router.push(`/diary/${date}`);
      router.refresh();
    } else {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  }

  const formData: DiaryFormData = { date, title: "", content, photo: photo ?? undefined };
  void formData; // 타입 참조용

  return (
    <div className={styles.form}>
      {/* 달/날씨 읽기전용 정보 */}
      <div className={styles.metaBar} aria-label="이 날의 달과 날씨 정보">
        <span className={styles.metaEmoji} aria-hidden="true">{emoji}</span>
        <div className={styles.metaInfo}>
          <span className={styles.metaPhase}>{phase}</span>
          {weatherDescription && (
            <span className={styles.metaWeather}>
              {weatherDescription}
              {cloudCover !== undefined && ` · 운량 ${cloudCover}%`}
            </span>
          )}
        </div>
      </div>

      {/* 일기 텍스트 입력 */}
      <textarea
        className={styles.textarea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="오늘 밤하늘은 어떠셨나요? 별을 보며 느낀 것을 기록해보세요 🌟"
        aria-label="일기 내용"
      />

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
          onClick={() => fileInputRef.current?.click()}
          role="button"
          aria-label="사진 업로드 (클릭 또는 드래그앤드롭)"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.dropzoneInput}
            onChange={onFileChange}
            tabIndex={-1}
          />
          <div className={styles.dropzoneIcon} aria-hidden="true">📷</div>
          <p className={styles.dropzoneText}>사진을 드래그하거나 클릭해서 업로드</p>
          <p className={styles.dropzoneHint}>JPG, PNG (선택사항)</p>
        </div>
      )}

      {/* 저장/취소 버튼 */}
      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={() => router.back()}>
          취소
        </button>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!content.trim() || saving}
        >
          {saving ? "저장 중…" : (initialData ? "수정 완료" : "일기 저장")}
        </button>
      </div>
    </div>
  );
}
