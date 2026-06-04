// ============================================================
// lib/moonPhase.ts
// 달 위상 계산 핵심 모듈
//
// 공개 함수:
//   getMoonPhase(date)      → 위상값 (0 ~ 29.5, 삭망월 기준 경과일)
//   getMoonEmoji(phase)     → MoonPhase 객체 (이모지, 이름, illumination)
//   getStarScore(phase)     → 별 관측 지수 (0 ~ 100)
//   isBestDay(phase)        → 그믐 전후 최적일 여부 (boolean)
// ============================================================

import type { MoonPhase, MoonPhaseName } from "@/types";

// ----------------------------------------------------------
// 상수 정의
// ----------------------------------------------------------

/** 삭망월(Synodic Month) 주기 — 일(day) 단위 */
const SYNODIC_MONTH = 29.530588861;

/**
 * 기준 삭일 (Known New Moon)
 * 2000년 1월 6일 18:14 UTC — 천문학적으로 검증된 기준점
 */
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

/**
 * 최적 관측일 판별 기준: 삭(0일) 전후 며칠까지를 "최적"으로 볼 것인가
 * 그믐(28~29일)과 신월(0~2일) 포함
 */
const BEST_DAY_RANGE = 2.0; // 삭 기준 ±2일

// ----------------------------------------------------------
// 위상 단계 테이블 (8단계)
// phase(0~29.5) 기준으로 각 단계의 시작 경계값
// ----------------------------------------------------------

interface PhaseTableEntry {
  /** 단계 시작 위상값 (이상 ~ 다음 시작 미만) */
  from: number;
  name: MoonPhaseName;
  nameKo: string;
  emoji: string;
}

/**
 * 위상 단계 테이블
 * 삭망월 29.53일을 8등분:
 *   삭(0) → 초승(3.69) → 상현(7.38) → 상현망(11.07)
 *   → 망(14.77) → 하현망(18.45) → 하현(22.15) → 그믐(25.84)
 */
const PHASE_TABLE: PhaseTableEntry[] = [
  {
    from: 0,
    name: "new_moon",
    nameKo: "삭 (그믐)",
    emoji: "🌑",
  },
  {
    from: SYNODIC_MONTH * (1 / 8), // ≈ 3.69일
    name: "waxing_crescent",
    nameKo: "초승달",
    emoji: "🌒",
  },
  {
    from: SYNODIC_MONTH * (2 / 8), // ≈ 7.38일
    name: "first_quarter",
    nameKo: "상현달",
    emoji: "🌓",
  },
  {
    from: SYNODIC_MONTH * (3 / 8), // ≈ 11.07일
    name: "waxing_gibbous",
    nameKo: "상현망간",
    emoji: "🌔",
  },
  {
    from: SYNODIC_MONTH * (4 / 8), // ≈ 14.77일
    name: "full_moon",
    nameKo: "망 (보름달)",
    emoji: "🌕",
  },
  {
    from: SYNODIC_MONTH * (5 / 8), // ≈ 18.45일
    name: "waning_gibbous",
    nameKo: "하현망간",
    emoji: "🌖",
  },
  {
    from: SYNODIC_MONTH * (6 / 8), // ≈ 22.15일
    name: "last_quarter",
    nameKo: "하현달",
    emoji: "🌗",
  },
  {
    from: SYNODIC_MONTH * (7 / 8), // ≈ 25.84일
    name: "waning_crescent",
    nameKo: "그믐달",
    emoji: "🌘",
  },
];

// ----------------------------------------------------------
// 공개 함수
// ----------------------------------------------------------

/**
 * 주어진 날짜의 달 위상값을 반환한다.
 *
 * 기준 삭일(2000-01-06)로부터 경과 일수를 삭망월로 나눈 나머지가
 * 해당 날짜가 삭망월 주기 안에서 몇 번째 날인지를 나타낸다.
 *
 * @param date - 계산할 날짜 (로컬 타임 기준, 시각은 정오로 보정)
 * @returns 0 이상 29.53 미만의 위상값
 *   - 0에 가까울수록 삭(그믐/신월) → 별보기 최적
 *   - 14.77에 가까울수록 망(보름달) → 별보기 최악
 *
 * @example
 * getMoonPhase(new Date("2025-04-27")) // ≈ 0.x (삭 근처)
 */
export function getMoonPhase(date: Date): number {
  const msPerDay = 86_400_000; // 1000 * 60 * 60 * 24

  // 날짜 정오(정확한 경계 오차 방지)를 UTC로 환산해서 경과일 계산
  const noonMs = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0
  );

  const elapsedDays = (noonMs - KNOWN_NEW_MOON_MS) / msPerDay;

  // 경과일을 삭망월로 나눈 나머지 (음수 방지 처리)
  const phase = ((elapsedDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

  // 소수점 4자리로 반올림 (부동소수점 오차 정리)
  return Math.round(phase * 10_000) / 10_000;
}

/**
 * 위상값(0~29.5)을 받아 달 이모지, 한국어 이름, illumination이 담긴
 * MoonPhase 객체를 반환한다.
 *
 * @param phase - getMoonPhase()가 반환한 0 이상 29.53 미만 값
 * @returns MoonPhase 객체
 *
 * @example
 * const phase = getMoonPhase(new Date());
 * const moon  = getMoonEmoji(phase);
 * console.log(moon.emoji, moon.nameKo); // 🌒 초승달
 */
export function getMoonEmoji(phase: number): MoonPhase {
  // 위상 단계 조회: PHASE_TABLE을 역순으로 탐색해서
  // phase가 from 이상인 첫 번째 항목을 선택
  const entry =
    [...PHASE_TABLE].reverse().find((e) => phase >= e.from) ??
    PHASE_TABLE[0]; // 엣지케이스 안전망

  // illumination: 달의 실제 밝기 비율 (0.0 ~ 1.0)
  // ├─ 0    (삭)   → 0.0
  // ├─ 7.38 (상현) → 0.5 (반달, 오른쪽)
  // ├─ 14.77(망)   → 1.0 (보름)
  // └─ 22.15(하현) → 0.5 (반달, 왼쪽)
  const illumination = calculateIllumination(phase);

  return {
    name: entry.name,
    nameKo: entry.nameKo,
    emoji: entry.emoji,
    illumination,
  };
}

/**
 * 위상값(0~29.5)으로 별 관측 지수를 계산한다.
 *
 * 점수 산출 방식:
 *   - 삭(phase=0) 근처: 100점 (달이 없어 최적)
 *   - 망(phase≈14.77) 근처: 0점 (보름달로 최악)
 *   - 삼각함수(cos)로 부드럽게 감소/증가
 *
 * @param phase - 0 이상 29.53 미만 위상값
 * @returns 0 ~ 100 사이의 정수 점수
 *
 * @example
 * getStarScore(0)     // 100 (그믐, 최적)
 * getStarScore(14.77) // 0   (보름, 최악)
 * getStarScore(7.38)  // ~50 (반달)
 */
export function getStarScore(phase: number): number {
  // phase를 0~2π 라디안으로 변환
  // cos(0) = 1(삭), cos(π) = -1(망)
  const radians = (phase / SYNODIC_MONTH) * 2 * Math.PI;

  // cos 값 -1~1 → 점수 0~100으로 선형 변환
  const raw = ((Math.cos(radians) + 1) / 2) * 100;

  return Math.round(raw);
}

/**
 * 주어진 위상값이 별 관측 "최적일"인지 판별한다.
 *
 * 최적일 기준:
 *   - 삭(0) 전후 ±BEST_DAY_RANGE일 (2일) 이내
 *   - 즉, phase < 2.0 이거나 phase > 27.53 (SYNODIC_MONTH - 2)
 *
 * @param phase - 0 이상 29.53 미만 위상값
 * @returns true이면 최적 관측일
 *
 * @example
 * isBestDay(0.5)   // true  (삭 직후)
 * isBestDay(28.8)  // true  (삭 직전 그믐)
 * isBestDay(14.0)  // false (보름 근처)
 */
export function isBestDay(phase: number): boolean {
  return phase < BEST_DAY_RANGE || phase > SYNODIC_MONTH - BEST_DAY_RANGE;
}

/**
 * 달 위상 점수(0~50)와 날씨 점수(0~50)를 결합해 최종 별 관측 지수(0~100)를 산출한다.
 *
 * 날씨는 가시성 게이트: 흐리면 달 위상과 무관하게 볼 수 없다.
 * 달은 맑은 하늘 안에서 조건을 조절하는 배율 역할.
 *
 * 공식: total = weatherScore × (1 + moonScore / 50)
 *   - 날씨 0(완전 흐림) → 달 무관하게 0
 *   - 날씨 50 + 달 50(그믐) → 100
 *   - 날씨 50 + 달 0(보름) → 50
 *   - 날씨 10 + 달 50(그믐) → 20 (기존 공식은 60으로 오류)
 */
export function combineStarScore(moonScore: number, weatherScore: number): number {
  return Math.round(weatherScore * (1 + moonScore / 50));
}

// ----------------------------------------------------------
// 내부 유틸리티
// ----------------------------------------------------------

/**
 * 위상값(0~29.5)을 달의 실제 밝기 비율(0.0~1.0)로 변환한다.
 * - 삭(0)   → 0.0
 * - 망(14.77) → 1.0
 *
 * @param phase - 위상값
 * @returns 0.0 ~ 1.0
 */
function calculateIllumination(phase: number): number {
  // 삼각함수 기반 illumination 계산
  // (1 - cos(2π * phase/T)) / 2  형태
  const radians = (phase / SYNODIC_MONTH) * 2 * Math.PI;
  const illumination = (1 - Math.cos(radians)) / 2;

  // 소수점 3자리로 반올림
  return Math.round(illumination * 1_000) / 1_000;
}
