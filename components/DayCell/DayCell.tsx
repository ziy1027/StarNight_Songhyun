import Link from "next/link";
import Image from "next/image";
import styles from "./DayCell.module.css";
import type { DayCellData } from "@/types";

interface DayCellProps {
  data: DayCellData;
}

/**
 * 음력 일자(1~29)를 달 밝기(0=삭, 1=망)로 변환
 * 달력 배경 그라디언트 강도 계산에 사용
 */
function getLunarIllumination(lunarDay: number): number {
  return (1 - Math.cos((lunarDay / 29.5) * 2 * Math.PI)) / 2;
}

export default function DayCell({ data }: DayCellProps) {
  const { date, day, isCurrentMonth, isToday, lunar, moonPhase, starScore } = data;

  const dayOfWeek = new Date(date + "T00:00:00").getDay();
  const isSunday   = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  const cellClass = [
    styles.cell,
    !isCurrentMonth && styles.otherMonth,
    isToday && styles.today,
    isSunday && styles.sunday,
    isSaturday && styles.saturday,
  ].filter(Boolean).join(" ");

  // 음력 1일이면 "N월 1일", 나머지는 일 숫자만
  const lunarText = lunar.day === 1 ? `${lunar.month}월` : `${lunar.day}`;

  // 달 밝기 기반 배경 그라디언트 (0=그믐/어둠, 1=보름/밝음)
  const illumination = getLunarIllumination(lunar.day);
  const glowAlpha    = (illumination * 0.32).toFixed(3);
  const bgStyle = isToday
    ? `linear-gradient(150deg, rgba(255,249,226,${glowAlpha}) 0%, rgba(107,159,255,0.14) 100%)`
    : `linear-gradient(150deg, rgba(255,249,226,${glowAlpha}) 0%, rgba(12,19,39,0.95) 100%)`;

  const moonFile = `/moon-phase/${Math.min(lunar.day, 29)}.png`;

  return (
    <Link
      href={`/day/${date}`}
      className={cellClass}
      style={{ background: bgStyle }}
      role="gridcell"
      aria-label={`${date}, ${lunar.str}, ${moonPhase.nameKo}`}
      aria-current={isToday ? "date" : undefined}
    >
      {/* 상단 날짜 행: 양력(왼쪽) + 음력(오른쪽) */}
      <div className={styles.dateRow}>
        <span className={styles.dayNumber}>{day}</span>
        <span className={styles.lunarDate}>{lunarText}</span>
      </div>

      {/* 달 이미지 (나머지 공간 채움) */}
      <div className={styles.moonWrap}>
        <Image
          src={moonFile}
          alt={moonPhase.nameKo}
          width={80}
          height={80}
          className={styles.moonImg}
        />
      </div>

      {/* 별 관측 지수 점 */}
      {starScore && (
        <span
          className={styles.scoreDot}
          data-grade={starScore.grade}
          aria-label={`별 관측 지수: ${starScore.gradeKo} (${starScore.score}점)`}
          title={`${starScore.score}점 (${starScore.gradeKo})`}
        />
      )}
    </Link>
  );
}
