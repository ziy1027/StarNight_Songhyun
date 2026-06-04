// ============================================================
// components/StarScore/StarScore.tsx
// 별 관측 지수를 시각적으로 표시하는 컴포넌트
// - 총점, 등급, 게이지 바, 세부 내역(달/날씨 기여도) 표시
// ============================================================

import styles from "./StarScore.module.css";
import type { StarScore as StarScoreType } from "@/types";

interface StarScoreProps {
  /** 별 관측 지수 데이터 */
  starScore: StarScoreType;
  /** 세부 내역 표시 여부 (상세 페이지: true, 카드 요약: false) */
  showBreakdown?: boolean;
}

/** 등급별 게이지 바 색상 */
const BAR_COLORS: Record<StarScoreType["grade"], string> = {
  excellent: "var(--color-score-excellent)",
  good: "var(--color-score-good)",
  fair: "var(--color-score-fair)",
  poor: "var(--color-score-poor)",
  bad: "var(--color-score-bad)",
};

/**
 * 별 관측 지수 표시 컴포넌트
 */
export default function StarScore({
  starScore,
  showBreakdown = false,
}: StarScoreProps) {
  const { score, grade, gradeKo, breakdown } = starScore;
  const barColor = BAR_COLORS[grade];

  return (
    <div className={styles.wrapper} aria-label={`별 관측 지수: ${score}점 (${gradeKo})`}>
      {/* 점수 및 등급 */}
      <div className={styles.scoreDisplay}>
        <span
          className={styles.scoreNumber}
          data-grade={grade}
          style={{ color: barColor }}
        >
          {score}
        </span>
        <span className={styles.scoreMax}>/ 100</span>
        <span
          className={styles.gradeLabel}
          data-grade={grade}
          style={{ color: barColor }}
        >
          {gradeKo}
        </span>
      </div>

      {/* 점수 게이지 바 */}
      <div className={styles.bar} role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={styles.barFill}
          style={{
            width: `${score}%`,
            background: barColor,
          }}
        />
      </div>

      {/* 세부 내역 (showBreakdown=true일 때만 표시) */}
      {showBreakdown && (
        <dl className={styles.breakdown}>
          <div className={styles.breakdownItem}>
            <dt className={styles.breakdownLabel}>
              <span aria-hidden="true">🌙</span>
              달 위상 점수
            </dt>
            <dd className={styles.breakdownScore}>
              {breakdown.moonScore} / 50
            </dd>
          </div>
          <div className={styles.breakdownItem}>
            <dt className={styles.breakdownLabel}>
              <span aria-hidden="true">☁️</span>
              날씨 점수
            </dt>
            <dd className={styles.breakdownScore}>
              {breakdown.weatherScore} / 50
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
