"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";

export default function Header() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
        /* 로그인 상태 — 아바타 클릭 → 드롭다운 */
        <div className={styles.userWrap} ref={dropRef}>
          <button
            className={styles.avatarBtn}
            onClick={() => setOpen((v) => !v)}
            aria-label="프로필 메뉴"
            aria-expanded={open}
          >
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
            <span className={styles.chevron} aria-hidden="true">{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <div className={styles.dropdown} role="menu">
              <div className={styles.dropdownHeader}>
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={36}
                    height={36}
                    className={styles.dropAvatar}
                  />
                ) : (
                  <span className={styles.dropAvatarFallback}>
                    {session.user.name?.[0] ?? "?"}
                  </span>
                )}
                <div>
                  <p className={styles.dropName}>{session.user.name}</p>
                  {session.user.email && (
                    <p className={styles.dropEmail}>{session.user.email}</p>
                  )}
                </div>
              </div>

              <div className={styles.dropDivider} />

              <Link
                href="/mypage"
                className={styles.dropItem}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                마이페이지
              </Link>

              <button
                className={`${styles.dropItem} ${styles.dropLogout}`}
                role="menuitem"
                onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
              >
                로그아웃
              </button>
            </div>
          )}
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
