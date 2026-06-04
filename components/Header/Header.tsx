"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className={styles.header}>
      {/* 로고 */}
      <Link href="/" className={styles.logo}>
        <Image
          src="/logo_white.svg"
          alt="StarNight"
          width={130}
          height={34}
          priority
          className={styles.logoImg}
        />
        <span className={styles.logoText}>StarNight</span>
      </Link>

      {/* 세션 영역 */}
      {status === "loading" ? (
        <div className={styles.loading} aria-label="로그인 상태 확인 중" />
      ) : session?.user ? (
        /* 로그인 상태 */
        <div className={styles.user}>
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "프로필"}
              width={30}
              height={30}
              className={styles.avatar}
            />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              {session.user.name?.[0] ?? "?"}
            </span>
          )}
          <span className={styles.name}>{session.user.name}</span>
          <button
            className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            로그아웃
          </button>
        </div>
      ) : (
        /* 미로그인 상태 */
        <Link href="/login" className={styles.loginLink}>
          로그인
        </Link>
      )}
    </header>
  );
}
