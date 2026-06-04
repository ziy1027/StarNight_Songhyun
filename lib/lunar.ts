// ============================================================
// lib/lunar.ts
// 양력 → 음력 변환 모듈
// korean-lunar-calendar 패키지를 사용 (Node.js 서버 전용)
//
// ⚠️  이 모듈은 서버 사이드 전용입니다.
//     클라이언트 컴포넌트('use client')에서 import하면 번들 오류 발생.
//     클라이언트에서는 /api/lunar 경로의 Route Handler를 호출하세요.
// ============================================================

import type { LunarDate } from "@/types";

// ----------------------------------------------------------
// korean-lunar-calendar 인스턴스 (싱글톤 캐시, 서버 메모리)
// ----------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _instance: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCalendarInstance(): any {
  if (_instance) return _instance;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const KoreanLunarCalendar = require("korean-lunar-calendar");
    _instance = new KoreanLunarCalendar();
  } catch {
    throw new Error(
      "[lunar.ts] korean-lunar-calendar 패키지가 필요합니다.\n" +
      "설치: npm install korean-lunar-calendar"
    );
  }

  return _instance;
}

/**
 * 양력 날짜를 음력으로 변환한다 (서버 전용).
 *
 * @param date - 변환할 양력 날짜
 * @returns LunarDate — { month, day, str }
 *
 * @example
 * getLunarDate(new Date(2025, 3, 27))
 * // → { month: 3, day: 30, str: "음력 3월 30일" }
 */
export function getLunarDate(date: Date): LunarDate {
  const calendar = getCalendarInstance();

  const ok = calendar.setSolarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  if (!ok) {
    return { month: 1, day: 1, str: "음력 변환 불가" };
  }

  const lunar = calendar.getLunarCalendar() as {
    year:   number;
    month:  number;
    day:    number;
    isLeap: boolean;
  };

  const leapPrefix = lunar.isLeap ? "윤" : "";
  return {
    month: lunar.month,
    day:   lunar.day,
    str:   `음력 ${leapPrefix}${lunar.month}월 ${lunar.day}일`,
  };
}

/**
 * 음력 월/일로 한국 명절 이름을 반환한다.
 *
 * @example
 * getLunarHoliday(1, 1)  // "설날"
 * getLunarHoliday(8, 15) // "추석"
 */
export function getLunarHoliday(month: number, day: number): string | null {
  const map: Record<string, string> = {
    "1-1":  "설날",
    "1-15": "정월대보름",
    "4-8":  "부처님오신날",
    "7-7":  "칠석",
    "8-15": "추석",
    "12-30":"그믐",
  };
  return map[`${month}-${day}`] ?? null;
}
