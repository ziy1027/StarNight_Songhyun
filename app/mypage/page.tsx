"use client";

import { useState, useEffect, useRef } from "react";
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

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [photo, setPhoto]       = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 미로그인 → 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // 프로필 fetch
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user")
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setName(data.name ?? "");
        setEmail(data.email ?? "");
      })
      .catch(() => setMessage({ type: "error", text: "프로필을 불러오지 못했습니다." }));
  }, [status]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const fd = new FormData();
    if (name.trim() && name.trim() !== profile?.name)   fd.append("name",  name.trim());
    if (email.trim() && email.trim() !== profile?.email) fd.append("email", email.trim());
    if (photo)                                            fd.append("photo", photo);

    if ([...fd.keys()].length === 0) {
      setMessage({ type: "error", text: "변경된 내용이 없습니다." });
      setSaving(false);
      return;
    }

    const res = await fetch("/api/user", { method: "PATCH", body: fd });
    const data = await res.json();

    setSaving(false);
    if (res.ok) {
      setProfile(data);
      setPhoto(null);
      setPreview(null);
      setMessage({ type: "success", text: "저장됐습니다. 헤더 정보는 다음 로그인 시 반영됩니다." });
    } else {
      setMessage({ type: "error", text: data.error ?? "저장에 실패했습니다." });
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
      <h1 className={styles.title}>마이페이지</h1>

      {/* 프로필 사진 */}
      <div className={styles.avatarSection}>
        <button
          className={styles.avatarBtn}
          onClick={() => fileRef.current?.click()}
          aria-label="프로필 사진 변경"
        >
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt="프로필 사진"
              width={80}
              height={80}
              className={styles.avatar}
            />
          ) : (
            <span className={styles.avatarFallback}>
              {profile.name?.[0] ?? "?"}
            </span>
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

      {/* 로그인 수단 */}
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

      {/* 메시지 */}
      {message && (
        <p className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </p>
      )}

      {/* 저장 버튼 */}
      <button
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "저장 중…" : "저장"}
      </button>

      {/* 가입일 */}
      <p className={styles.joinedAt}>
        가입일 {new Date(profile.created_at).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}
