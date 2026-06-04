// ============================================================
// app/page.tsx
// 메인 페이지 (클라이언트 컴포넌트)
//
// 흐름:
//   1. 마운트 → 2초 달 떠오르는 로딩 애니메이션
//   2. 동시에 Geolocation + 날씨 + 음력 API 호출
//   3. 로딩 끝 → 오늘 요약 카드 + MoonCalendar 렌더링
// ============================================================

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import MoonCalendar from "@/components/MoonCalendar/MoonCalendar";
import {
  getMoonPhase,
  getMoonEmoji,
  getStarScore,
  isBestDay,
  combineStarScore,
} from "@/lib/moonPhase";
import {
  getWeatherByCoords,
  getWeatherScore,
  getBrowserCoords,
  DEFAULT_COORDS,
} from "@/lib/weather";
import type { LunarDate, WeatherData } from "@/types";

// ----------------------------------------------------------
// 달 위상은 순수 계산이므로 클라이언트에서 직접 실행 가능
// (korean-lunar-calendar 불필요)
// ----------------------------------------------------------
function scoreColor(score: number): string {
  if (score >= 80) return "var(--color-score-excellent)";
  if (score >= 60) return "var(--color-score-good)";
  if (score >= 40) return "var(--color-score-fair)";
  if (score >= 20) return "var(--color-score-poor)";
  return "var(--color-score-bad)";
}

function formatDate(d: Date): string {
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;
}

function getScoreMessage(score: number): string {
  if (score >= 90) return "오늘은 별 보기 최고의 날이에요! 당장 밖으로 나가 하늘을 올려다봐요!";
  if (score >= 80) return "별 보기 정말 좋은 밤이에요. 담요 챙겨서 나가볼까요?";
  if (score >= 70) return "꽤 괜찮은 관측 조건이에요. 오늘 밤 잠깐 하늘을 올려다봐요.";
  if (score >= 60) return "그럭저럭 볼 만한 밤이에요. 밝은 별들은 보일 거예요.";
  if (score >= 50) return "오늘 밤 하늘은 그저 그런 편이에요. 기대는 살짝 낮춰봐요.";
  if (score >= 40) return "오늘은 별 보기가 조금 아쉬운 날이에요. 내일을 기약해봐요.";
  if (score >= 30) return "별이 잘 보이지 않는 밤이에요. 따뜻하게 집에 있어요.";
  if (score >= 20) return "오늘 밤 하늘은 별 보기가 쉽지 않아요. 다음 기회를 노려봐요.";
  if (score >= 10) return "별구경하기 많이 어려운 날이에요. 오늘은 그냥 쉬어가요.";
  return "오늘은 완전히 별구경을 포기하는 날이에요. 집에서 따뜻하게 쉬어요!";
}

// ----------------------------------------------------------
// 컴포넌트
// ----------------------------------------------------------
export default function HomePage() {
  // ── 로딩 애니메이션 상태
  const [showLoading, setShowLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // ── 오늘 달 위상 (순수 계산 → lazy initializer로 즉시 확정)
  const [phaseVal] = useState(() => getMoonPhase(new Date()));
  const moon  = getMoonEmoji(phaseVal);
  const isBest = isBestDay(phaseVal);

  // ── 음력 (API 호출 필요)
  const [lunar, setLunar] = useState<LunarDate | null>(null);

  // ── 날씨 & 위치
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // ── 로딩 타이머
  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1500);
    const t2 = setTimeout(() => setShowLoading(false), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // ── 음력 fetch (서버 API 경유)
  useEffect(() => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    fetch(`/api/lunar?date=${dateStr}`, { cache: "force-cache" })
      .then((r) => r.json())
      .then((data: LunarDate) => setLunar(data))
      .catch(() => {
        /* 실패 시 미표시 */
      });
  }, []);

  // ── Geolocation + 날씨 fetch
  useEffect(() => {
    async function fetchWeather() {
      const pos = await getBrowserCoords();
      const c = pos ?? DEFAULT_COORDS;
      setCoords(c);

      const w = await getWeatherByCoords(c.latitude, c.longitude);
      setWeather(w);
      setWeatherLoading(false);
    }
    fetchWeather();
  }, []);

  // ── 별 관측 지수
  const moonScore = Math.round(getStarScore(phaseVal) / 2);
  const weatherScore = weather ? getWeatherScore(weather) : null;
  const totalScore = weatherScore !== null ? combineStarScore(moonScore, weatherScore) : null;

  return (
    <>
      {/* ── 로딩 화면 (달 떠오르는 애니메이션) ── */}
      {showLoading && (
        <div
          className={`${styles.loadingScreen} ${fadeOut ? styles.hidden : ""}`}
          role="status"
          aria-label="로딩 중"
        >
          <Image
            src="/logo_white.svg"
            alt="StarNight"
            width={150}
            height={150}
            priority
            className={styles.risingLogo}
          />
          <p className={styles.loadingText}>
            StarNight <span className={styles.loadingDots} aria-hidden="true" />
          </p>
        </div>
      )}

      {/* ── 메인 콘텐츠 ── */}
      {!showLoading && (
        <div className={styles.content}>
          {/* ── 오늘 요약 카드 ── */}
          <div className={styles.summaryCard} aria-label="오늘의 별 관측 요약">
            {/* 상단: 달 이미지(좌) + 날짜·날씨 정보(우) */}
            <div className={styles.summaryTop}>
              <div className={styles.summaryLeft}>
                {lunar ? (
                  <Image
                    src={`/moon-phase/${Math.min(lunar.day, 29)}.png`}
                    alt={moon?.nameKo ?? "달"}
                    width={64}
                    height={64}
                    className={styles.summaryMoon}
                  />
                ) : (
                  <span className={styles.summaryMoonPlaceholder} aria-hidden="true">🌙</span>
                )}
                <span className={styles.summaryPhaseName}>
                  {moon?.nameKo ?? "…"}{isBest && " ⭐"}
                </span>
              </div>

              <div className={styles.summaryRight}>
                <span className={styles.summaryDate}>{formatDate(new Date())}</span>
                <span className={styles.summaryLunar}>
                  {lunar?.str ?? "음력 불러오는 중…"}
                </span>
                {weather && (
                  <span className={styles.summaryWeather}>
                    {weather.description} · 운량 {weather.cloudCover}%
                  </span>
                )}
              </div>
            </div>

            {/* 하단: 총 점수 + 설명 */}
            <div className={styles.summaryBottom}>
              {weatherLoading ? (
                <span className={styles.scoreLoading}>···</span>
              ) : (
                <>
                  <span
                    className={styles.summaryScoreNum}
                    style={{ color: scoreColor(totalScore ?? moonScore * 2) }}
                  >
                    {totalScore ?? moonScore * 2}
                  </span>
                  <span className={styles.summaryScoreMax}>/ 100</span>
                  <span className={styles.summaryScoreDivider} aria-hidden="true">·</span>
                  <span className={styles.summaryMessage}>
                    {getScoreMessage(totalScore ?? moonScore * 2)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── 달력 ── */}
          <MoonCalendar
            latitude={coords.latitude}
            longitude={coords.longitude}
          />

          {/* ── 범례 ── */}
          <Legend />
        </div>
      )}

      <h1 className="sr-only">StarNight — 별 관측 최적일 달력</h1>
    </>
  );
}

// ── 범례
function Legend() {
  const items = [
    { color: "var(--color-score-excellent)", label: "최상 (80+)" },
    { color: "var(--color-score-good)", label: "좋음 (60+)" },
    { color: "var(--color-score-fair)", label: "보통 (40+)" },
    { color: "var(--color-score-poor)", label: "나쁨 (20+)" },
    { color: "var(--color-score-bad)", label: "최악" },
  ];
  return (
    <nav
      aria-label="별 관측 지수 범례"
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        justifyContent: "center",
        fontSize: "0.75rem",
        color: "var(--color-text-muted)",
      }}
    >
      {items.map((it) => (
        <span
          key={it.label}
          style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: it.color,
              flexShrink: 0,
            }}
          />
          {it.label}
        </span>
      ))}
      <span>● = 별 관측 지수</span>
      <span style={{ color: "var(--color-score-excellent)" }}>
        ● (초록 글로우) = 그믐 최적일
      </span>
    </nav>
  );
}
