// ============================================================
// components/LoginButton/LoginButton.tsx
// 헤더에 표시되는 소셜 로그인/로그아웃 버튼
//
// - 미로그인: 카카오 + 구글 로그인 버튼
// - 로그인 상태: 프로필 이미지 + 이름 + 로그아웃 버튼
// ============================================================

"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import styles from "./LoginButton.module.css";

interface Props {
  /** true → 헤더용 (미로그인 시 로그인 페이지 링크만 표시) */
  compact?: boolean;
}

export default function LoginButton({ compact = false }: Props) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className={styles.loading} aria-label="로그인 상태 확인 중" />;
  }

  // 로그인 상태: 프로필 + 로그아웃
  if (session?.user) {
    const user = session.user;
    return (
      <div className={styles.profile}>
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "프로필"}
            width={32}
            height={32}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarFallback} aria-hidden="true">
            {user.name?.[0] ?? "?"}
          </div>
        )}

        {!compact && <span className={styles.userName}>{user.name}</span>}

        <button
          className={styles.logoutBtn}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          로그아웃
        </button>
      </div>
    );
  }

  // 미로그인 — 헤더: 로그인 페이지 링크
  if (compact) {
    return (
      <Link href="/login" className={styles.loginLink}>
        로그인
      </Link>
    );
  }

  // 미로그인 — 로그인 페이지: 소셜 버튼 전체 표시
  return (
    <div className={styles.wrapper}>
      <a
        href="/api/auth/signin/kakao"
        className={`${styles.socialBtn} ${styles.kakaoBtn}`}
        aria-label="카카오로 로그인"
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.717 1.622 5.1 4.07 6.533L5.1 21l4.623-2.432A11.4 11.4 0 0012 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
        </svg>
        카카오 로그인
      </a>

      <a
        href="/api/auth/signin/google"
        className={`${styles.socialBtn} ${styles.googleBtn}`}
        aria-label="구글로 로그인"
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        구글 로그인
      </a>
    </div>
  );
}
