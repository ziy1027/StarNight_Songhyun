// ============================================================
// app/day/[date]/page.tsx
// 날짜 상세 페이지 (Server Component)
//
// URL: /day/YYYY-MM-DD
// 표시 항목:
//   - 달 이모지 (크게, float 애니메이션)
//   - 위상 이름, 음력 날짜, 달 조도
//   - 별 관측 지수 바 (0~100)
//   - 날씨 운량 (오늘이면 실시간, 미래면 예보)
//   - 뒤로가기 버튼
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getMoonPhase, getMoonEmoji, getStarScore, isBestDay, combineStarScore } from "@/lib/moonPhase";
import { getLunarDate } from "@/lib/lunar";
import { getWeatherByCoords, getWeatherRange, getWeatherScore, DEFAULT_COORDS } from "@/lib/weather";
import type { StarScore, WeatherData } from "@/types";

// ----------------------------------------------------------
// 유틸
// ----------------------------------------------------------

/** YYYY-MM-DD 파라미터를 파싱해 { year, month, day } 반환. 유효하지 않으면 null. */
function parseDateParam(s: string): { year: number; month: number; day: number } | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const year = +m[1], month = +m[2], day = +m[3];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // 실제 날짜 존재 여부 (예: 2025-02-30 차단)
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() + 1 !== month || d.getDate() !== day) return null;

  return { year, month, day };
}

/** 점수 → 등급 문자열 */
function toGrade(s: number): StarScore["grade"] {
  if (s >= 80) return "excellent";
  if (s >= 60) return "good";
  if (s >= 40) return "fair";
  if (s >= 20) return "poor";
  return "bad";
}

function toGradeKo(s: number): string {
  if (s >= 80) return "최상";
  if (s >= 60) return "좋음";
  if (s >= 40) return "보통";
  if (s >= 20) return "나쁨";
  return "최악";
}

/** 점수에 따른 색상 CSS 변수 */
function gradeColor(grade: StarScore["grade"]): string {
  const map: Record<StarScore["grade"], string> = {
    excellent: "var(--color-score-excellent)",
    good:      "var(--color-score-good)",
    fair:      "var(--color-score-fair)",
    poor:      "var(--color-score-poor)",
    bad:       "var(--color-score-bad)",
  };
  return map[grade];
}

// ----------------------------------------------------------
// 파라미터 타입
// ----------------------------------------------------------
interface PageProps {
  params: Promise<{ date: string }>;
}

// ----------------------------------------------------------
// 메타데이터
// ----------------------------------------------------------
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const parsed = parseDateParam(date);
  if (!parsed) return { title: "잘못된 날짜" };

  const { year, month, day } = parsed;
  const moon  = getMoonEmoji(getMoonPhase(new Date(year, month - 1, day)));
  const lunar = getLunarDate(new Date(year, month - 1, day));

  return {
    title: `${year}년 ${month}월 ${day}일 별 관측`,
    description: `${lunar.str} · ${moon.nameKo} ${moon.emoji} · 별 관측 지수 확인`,
  };
}

// ----------------------------------------------------------
// 페이지 컴포넌트
// ----------------------------------------------------------
export default async function DayDetailPage({ params }: PageProps) {
  const { date } = await params;
  const parsed = parseDateParam(date);
  if (!parsed) notFound();

  const { year, month, day } = parsed;
  const dateObj = new Date(year, month - 1, day);

  // 달 위상 계산
  const phaseVal  = getMoonPhase(dateObj);
  const moon      = getMoonEmoji(phaseVal);
  const lunar     = getLunarDate(dateObj);
  const best      = isBestDay(phaseVal);
  const moonScore = Math.round(getStarScore(phaseVal) / 2); // 0~50

  // 오늘 여부 판별 (실시간 날씨 or 예보 분기)
  const nowDate = new Date();
  const isToday =
    year === nowDate.getFullYear() &&
    month === nowDate.getMonth() + 1 &&
    day === nowDate.getDate();

  // 날씨 fetch
  // - 오늘: current API (실시간)
  // - 과거/미래: daily forecast API
  let weather: WeatherData | null = null;

  if (isToday) {
    // 실시간 날씨
    weather = await getWeatherByCoords(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude);
  } else {
    // 예보 (Open-Meteo는 16일 이내만 지원)
    const wMap = await getWeatherRange(
      DEFAULT_COORDS.latitude,
      DEFAULT_COORDS.longitude,
      date,
      date
    );
    weather = wMap.get(date) ?? null;
  }

  // 별 관측 지수 조립
  const weatherScore = weather ? getWeatherScore(weather) : null;
  let starScore: StarScore | null = null;

  if (weatherScore !== null) {
    const total = combineStarScore(moonScore, weatherScore);
    starScore = {
      score: total,
      grade: toGrade(total),
      gradeKo: toGradeKo(total),
      breakdown: { moonScore, weatherScore },
    };
  }

  // 달 조도 % (0=삭, 100=망)
  const illuminationPct = Math.round(moon.illumination * 100);

  // 이전/다음 날 계산
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const prevDate = new Date(dateObj); prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(dateObj); nextDate.setDate(nextDate.getDate() + 1);

  // 전월 링크
  const backMonth = `/?month=${year}-${String(month).padStart(2, "0")}`;

  return (
    <article className={styles.page} aria-labelledby="date-heading">

      {/* 뒤로가기 */}
      <Link href={backMonth} className={styles.back}>
        ← 달력으로
      </Link>

      {/* 달 위상 헤더 카드 */}
      <div className={styles.heroCard}>
        <Image
          src={`/moon-phase/${Math.min(lunar.day, 29)}.png`}
          alt={moon.nameKo}
          width={140}
          height={140}
          className={styles.bigMoon}
          priority
        />

        <h1 id="date-heading" className={styles.solarDate}>
          {year}년 {month}월 {day}일
        </h1>

        <p className={styles.lunarDate}>{lunar.str}</p>
        <p className={styles.phaseName}>{moon.nameKo}</p>

        {best && (
          <p className={styles.bestBadge}>⭐ 별보기 최적일</p>
        )}

        {/* 이전/다음날 네비게이션 */}
        <div className={styles.heroNav}>
          <Link href={`/day/${fmt(prevDate)}`} className={styles.heroNavBtn}>
            ‹ {prevDate.getMonth() + 1}월 {prevDate.getDate()}일
          </Link>
          <Link href={`/day/${fmt(nextDate)}`} className={styles.heroNavBtn}>
            {nextDate.getMonth() + 1}월 {nextDate.getDate()}일 ›
          </Link>
        </div>
      </div>

      {/* 별 관측 지수 카드 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span aria-hidden="true">⭐</span> 별 관측 지수
        </h2>

        {starScore ? (
          <>
            {/* 점수 숫자 + 등급 */}
            <div className={styles.scoreRow}>
              <span
                className={styles.scoreNum}
                style={{ color: gradeColor(starScore.grade) }}
              >
                {starScore.score}
              </span>
              <span className={styles.scoreMax}>/ 100</span>
              <span
                className={styles.scoreGrade}
                style={{ color: gradeColor(starScore.grade) }}
              >
                {starScore.gradeKo}
              </span>
            </div>

            {/* 게이지 바 */}
            <div className={styles.bar}
                 role="progressbar"
                 aria-valuenow={starScore.score}
                 aria-valuemin={0}
                 aria-valuemax={100}>
              <div
                className={styles.barFill}
                style={{
                  width: `${starScore.score}%`,
                  background: gradeColor(starScore.grade),
                }}
              />
            </div>

            {/* 세부 내역 */}
            <dl className={styles.breakdown}>
              <div className={styles.breakdownRow}>
                <dt>🌙 달 위상 점수</dt>
                <dd className={styles.breakdownVal}>{starScore.breakdown.moonScore} / 50</dd>
              </div>
              <div className={styles.breakdownRow}>
                <dt>☁️ 날씨 점수</dt>
                <dd className={styles.breakdownVal}>{starScore.breakdown.weatherScore} / 50</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className={styles.noData}>
            날씨 예보 데이터가 없어 지수를 계산할 수 없습니다.
            <br />
            (오늘로부터 16일 이내 날짜만 날씨 데이터가 제공됩니다)
          </p>
        )}
      </div>

      {/* 달 위상 상세 카드 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span aria-hidden="true">🌙</span> 달 위상 상세
        </h2>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>위상 이름</span>
            <span className={styles.infoVal} style={{ fontFamily: "var(--font-sans-kr)", fontSize: "1rem" }}>
              {moon.nameKo}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>달 조도</span>
            <span className={styles.infoVal}>{illuminationPct}%</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>음력</span>
            <span className={styles.infoVal} style={{ fontFamily: "var(--font-sans-kr)", fontSize: "0.9rem" }}>
              {lunar.str}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>관측 최적일</span>
            <span className={styles.infoVal} style={{ fontFamily: "var(--font-sans-kr)", fontSize: "1rem" }}>
              {best ? "✅ 최적" : "❌ 비최적"}
            </span>
          </div>
        </div>
      </div>

      {/* 날씨 정보 카드 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span aria-hidden="true">☁️</span>
          날씨 정보
          {isToday && <span style={{ color: "var(--color-accent-star)", marginLeft: "0.5rem" }}>실시간</span>}
        </h2>

        {weather ? (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>날씨</span>
              <span className={styles.infoVal} style={{ fontFamily: "var(--font-sans-kr)", fontSize: "1rem" }}>
                {weather.description}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>운량</span>
              <span className={styles.infoVal}>{weather.cloudCover}%</span>
            </div>
            {weather.precipitationProbability > 0 && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>강수 확률</span>
                <span className={styles.infoVal}>{weather.precipitationProbability}%</span>
              </div>
            )}
          </div>
        ) : (
          <p className={styles.noData}>이 날짜의 날씨 데이터가 없습니다.</p>
        )}
      </div>

    </article>
  );
}
