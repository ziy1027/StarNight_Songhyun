"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  provider: string;
  created_at: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  text: string;
}

let toastId = 0;

export default function MyPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [photo,   setPhoto]   = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [toasts,  setToasts]  = useState<Toast[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((type: "success" | "error", text: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user")
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setName(data.name ?? "");
        setEmail(data.email ?? "");
      })
      .catch(() => addToast("error", "프로필을 불러오지 못했습니다."));
  }, [status, addToast]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);

    const fd = new FormData();
    if (name.trim()  && name.trim()  !== profile?.name)  fd.append("name",  name.trim());
    if (email.trim() && email.trim() !== profile?.email) fd.append("email", email.trim());
    if (photo) fd.append("photo", photo);

    if ([...fd.keys()].length === 0) {
      addToast("error", "변경된 내용이 없습니다.");
      setSaving(false);
      return;
    }

    const res  = await fetch("/api/user", { method: "PATCH", body: fd });
    const data = await res.json();

    setSaving(false);

    if (res.ok) {
      setProfile(data);
      setPhoto(null);
      setPreview(null);
      // 헤더 세션 즉시 반영
      await update({ name: data.name ?? undefined, image: data.image ?? undefined });
      addToast("success", "저장됐습니다!");
    } else {
      addToast("error", data.error ?? "저장에 실패했습니다.");
    }
  }

  if (status === "loading" || !profile) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const avatarSrc = preview ?? profile.image ?? null;

  return (
    <div className={styles.container}>
      {/* ── 토스트 ── */}
      <div className={styles.toastArea} aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            {t.type === "success" ? "✓ " : "✕ "}{t.text}
          </div>
        ))}
      </div>

      <h1 className={styles.title}>마이페이지</h1>

      {/* 프로필 사진 */}
      <div className={styles.avatarSection}>
        <button
          className={styles.avatarBtn}
          onClick={() => fileRef.current?.click()}
          aria-label="프로필 사진 변경"
        >
          {avatarSrc ? (
            <Image src={avatarSrc} alt="프로필 사진" width={80} height={80} className={styles.avatar} />
          ) : (
            <span className={styles.avatarFallback}>{profile.name?.[0] ?? "?"}</span>
          )}
          <span className={styles.avatarOverlay}>변경</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {photo && (
          <button
            className={styles.cancelPhoto}
            onClick={() => { setPhoto(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
          >
            사진 취소
          </button>
        )}
      </div>

      <p className={styles.provider}>
        {profile.provider === "kakao" ? "카카오" : profile.provider} 로그인
      </p>

      {/* 폼 */}
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">닉네임</label>
          <input
            id="name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="닉네임 입력"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 입력"
          />
          {!profile.email && (
            <p className={styles.hint}>카카오 로그인 시 이메일이 제공되지 않아 비어있습니다. 직접 입력해주세요.</p>
          )}
        </div>
      </div>

      <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? "저장 중…" : "저장"}
      </button>

      <p className={styles.joinedAt}>
        가입일 {new Date(profile.created_at).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}
