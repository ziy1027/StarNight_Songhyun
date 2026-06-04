// ============================================================
// components/ObservationCheck/ObservationCheck.tsx
// "오늘 별 봤어요" 토글 버튼
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import styles from "./ObservationCheck.module.css";

interface ObservationCheckProps {
  /** 관측 날짜 (YYYY-MM-DD) */
  date: string;
  /** 관측 장소 이름 (선택) */
  locationName?: string;
  lat?: number;
  lng?: number;
}

export default function ObservationCheck({
  date,
  locationName,
  lat,
  lng,
}: ObservationCheckProps) {
  const { data: session, status } = useSession();
  const [checked,  setChecked]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);

  // 이 날짜 체크 여부 조회
  useEffect(() => {
    if (status === "loading" || !session) { setFetching(false); return; }

    fetch(`/api/observation/check?date=${date}`)
      .then((r) => r.json())
      .then((data: { checked: boolean }) => {
        setChecked(data.checked ?? false);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [date, session, status]);

  async function toggle() {
    if (loading || fetching) return;
    setLoading(true);

    if (checked) {
      // 취소 (DELETE)
      await fetch(`/api/observation?date=${date}`, { method: "DELETE" });
      setChecked(false);
    } else {
      // 체크 (POST)
      await fetch("/api/observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, locationName, lat, lng }),
      });
      setChecked(true);
    }

    setLoading(false);
  }

  // 비로그인
  if (status !== "loading" && !session) {
    return (
      <div className={styles.wrapper}>
        <button
          className={`${styles.btn} ${styles.btnUnchecked}`}
          onClick={() => signIn()}
          aria-label="로그인 후 별 관측 체크"
        >
          <span className={styles.icon} aria-hidden="true">🌟</span>
          오늘 별 봤어요
        </button>
        <p className={styles.loginHint}>
          <span
            className={styles.loginLink}
            onClick={() => signIn()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && signIn()}
          >
            로그인
          </span>
          하면 관측 기록을 저장할 수 있어요
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={[
          styles.btn,
          checked ? styles.btnChecked : styles.btnUnchecked,
          (loading || fetching) ? styles.btnLoading : "",
        ].join(" ")}
        onClick={toggle}
        disabled={loading || fetching}
        aria-pressed={checked}
        aria-label={checked ? "별 관측 체크 취소" : "오늘 별 봤어요 체크"}
      >
        <span className={styles.icon} aria-hidden="true">
          {checked ? "⭐" : "🌟"}
        </span>
        {checked ? "오늘 별 봤어요 ✓" : "오늘 별 봤어요"}
      </button>
    </div>
  );
}
