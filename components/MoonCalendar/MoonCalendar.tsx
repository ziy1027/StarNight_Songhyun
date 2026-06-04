// ============================================================
// components/MoonCalendar/MoonCalendar.tsx
// 월간 달력 컴포넌트 (클라이언트 컴포넌트)
//
// - 이전/다음 월 이동 버튼
// - 요일 헤더 (일~토)
// - 날짜 셀: 달 이모지 + 음력 일자
// - 별보기 최적일(isBestDay)에 초록 점 표시
// - 날짜 클릭 → /day/[date] 이동
//
// 음력 변환: korean-lunar-calendar는 Node.js 전용이므로
//            /api/lunar Route Handler를 통해 서버에서 수행
// ============================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./MoonCalendar.module.css";
import {
  getMoonPhase,
  getMoonEmoji,
  getStarScore,
  combineStarScore,
} from "@/lib/moonPhase";
import { getWeatherRange, getWeatherScore } from "@/lib/weather";
import type {
  DayCellData,
  CalendarData,
  LunarDate,
  WeatherData,
  StarScore,
} from "@/types";

// 요일 헤더
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

// ----------------------------------------------------------
// 유틸
// ----------------------------------------------------------
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

/**
 * /api/lunar?date=YYYY-MM-DD 를 호출해 음력 날짜를 가져온다.
 * 한 달치 날짜를 한 번에 병렬 요청해 응답 맵으로 반환.
 */
async function fetchLunarMonth(
  year: number,
  month: number,
  days: number[],
): Promise<Map<string, LunarDate>> {
  // 42칸 중 이전/다음 달 포함하므로 중복 없이 unique 날짜만 fetch
  const fetches = days.map(async (day) => {
    const m = new Date(year, month - 1, day);
    const y2 = m.getFullYear(),
      m2 = m.getMonth() + 1,
      d2 = m.getDate();
    const dateStr = `${y2}-${String(m2).padStart(2, "0")}-${String(d2).padStart(2, "0")}`;

    try {
      const res = await fetch(`/api/lunar?date=${dateStr}`, {
        cache: "force-cache",
      });
      if (!res.ok) throw new Error();
      const lunar: LunarDate = await res.json();
      return [dateStr, lunar] as const;
    } catch {
      // 실패 시 기본값
      return [
        dateStr,
        { month: m2, day: d2, str: `음력 ?월 ${d2}일` } as LunarDate,
      ] as const;
    }
  });

  const results = await Promise.all(fetches);
  return new Map(results);
}

// ----------------------------------------------------------
// 달력 데이터 빌드
// ----------------------------------------------------------
function buildCalendarData(
  year: number,
  month: number,
  lunarMap: Map<string, LunarDate>,
  weatherMap: Map<string, WeatherData>,
): CalendarData {
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = firstDay.getDay();
  const today = new Date();
  const days: DayCellData[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month - 1, 1 - startOffset + i);
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const day = d.getDate();
    const dateStr = `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const isCurrentMonth = mo === month;
    const isToday =
      y === today.getFullYear() &&
      mo === today.getMonth() + 1 &&
      day === today.getDate();

    const phaseValue = getMoonPhase(d);
    const moonPhase = getMoonEmoji(phaseValue);
    const lunar = lunarMap.get(dateStr) ?? { month: mo, day, str: `${day}` };
    const weather = weatherMap.get(dateStr) ?? null;

    const moonScore = Math.round(getStarScore(phaseValue) / 2);
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

    days.push({
      date: dateStr,
      day,
      isCurrentMonth,
      isToday,
      lunar,
      moonPhase,
      starScore,
      weather,
    });
  }

  return { year, month, days };
}

// ----------------------------------------------------------
// Props
// ----------------------------------------------------------
interface MoonCalendarProps {
  latitude?: number;
  longitude?: number;
}

// ----------------------------------------------------------
// 컴포넌트
// ----------------------------------------------------------
export default function MoonCalendar({
  latitude,
  longitude,
}: MoonCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const lat = latitude ?? 37.5665;
      const lng = longitude ?? 126.978;

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const firstDow = new Date(year, month - 1, 1).getDay();
      const dayIndices = Array.from({ length: 42 }, (_, i) => 1 - firstDow + i);

      const [lunarMap, weatherMap] = await Promise.all([
        fetchLunarMonth(year, month, dayIndices),
        getWeatherRange(lat, lng, startDate, endDate),
      ]);

      if (!cancelled) {
        setCalendar(buildCalendarData(year, month, lunarMap, weatherMap));
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [year, month, latitude, longitude]);

  const prev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

  return (
    <section className={styles.wrapper} aria-label="별 관측 달력">
      {/* 월 네비게이션 */}
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={prev} aria-label="이전 달">
          ‹
        </button>
        <h2 className={styles.monthTitle}>
          {year}년 {month}월
        </h2>
        <button className={styles.navBtn} onClick={next} aria-label="다음 달">
          ›
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className={styles.weekRow} role="row">
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.weekLabel} role="columnheader">
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      {loading ? (
        <div
          className={styles.grid}
          role="grid"
          aria-busy="true"
          aria-label="달력 불러오는 중"
        >
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className={styles.skeletonCell} aria-hidden="true" />
          ))}
        </div>
      ) : (
        <div className={styles.grid} role="grid">
          {calendar?.days.map((d) => (
            <DayCell key={d.date} data={d} />
          ))}
        </div>
      )}
    </section>
  );
}

// ----------------------------------------------------------
// DayCell (인라인 내부 컴포넌트)
// ----------------------------------------------------------

/** 음력 일자 → 달 조도 (0=삭, 1=망) */
function getLunarIllumination(lunarDay: number): number {
  return (1 - Math.cos((lunarDay / 29.5) * 2 * Math.PI)) / 2;
}

function DayCell({ data }: { data: DayCellData }) {
  const { date, day, isCurrentMonth, isToday, lunar, moonPhase, starScore } =
    data;

  const dow = new Date(date + "T00:00:00").getDay();
  const isSun = dow === 0;
  const isSat = dow === 6;

  // 음력 표시: 1일이면 "N월 1일", 나머지는 숫자만
  const lunarText = lunar.day === 1 ? `${lunar.month}월 1일` : `${lunar.day}`;


  // 달 조도 기반 배경 그라디언트
  const illumination = getLunarIllumination(lunar.day);
  const glowAlpha = (illumination * 0.32).toFixed(3);
  const bgStyle = isToday
    ? `linear-gradient(150deg, rgba(255,249,226,${glowAlpha}) 0%, rgba(107,159,255,0.14) 100%)`
    : `linear-gradient(150deg, rgba(255,249,226,${glowAlpha}) 0%, rgba(12,19,39,0.95) 100%)`;

  // 달 이미지 글로우 (보름달일수록 밝게)
  const glowSize = Math.round(illumination * 14);
  const glowOpacity = (illumination * 0.5).toFixed(2);
  const moonGlow =
    illumination > 0.05
      ? `drop-shadow(0 0 ${glowSize}px rgba(255,249,226,${glowOpacity}))`
      : "none";

  const cls = [
    styles.cell,
    !isCurrentMonth && styles.otherMonth,
    isToday && styles.today,
    isSun && styles.sunday,
    isSat && styles.saturday,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={`/day/${date}`}
      className={cls}
      style={{ background: bgStyle }}
      role="gridcell"
      aria-label={`${date} ${lunar.str} ${moonPhase.nameKo}`}
      aria-current={isToday ? "date" : undefined}
    >
      {/* 상단: 양력날짜(좌) + 음력날짜(우) */}
      <div className={styles.dateRow}>
        <span className={styles.dayNum}>{day}</span>
        <span className={styles.lunarDay}>{lunarText}</span>
      </div>

      {/* 달 이미지 */}
      <div className={styles.moonWrap}>
        <Image
          src={`/moon-phase/${Math.min(lunar.day, 29)}.png`}
          alt={moonPhase.nameKo}
          width={40}
          height={40}
          className={styles.moonImg}
          style={{ filter: moonGlow, opacity: 0.75 }}
        />
      </div>

      {/* 날씨 있으면 → 합산 점수 dot (그믐 포함 모든 날) */}
      {starScore && isCurrentMonth && (
        <span
          className={styles.scoreDot}
          data-grade={starScore.grade}
          title={`지수 ${starScore.score}점`}
        />
      )}

    </Link>
  );
}
