// ============================================================
// types/index.ts
// 프로젝트 전역에서 사용하는 타입 정의 모음
// 모든 컴포넌트와 lib 파일은 여기서 타입을 import해서 사용
// ============================================================

// ----------------------------------------------------------
// 달 위상 관련 타입
// ----------------------------------------------------------

/** 달 위상 단계 (8단계 구분) */
export type MoonPhaseName =
  | "new_moon"        // 삭 (그믐/신월) — 별보기 최적
  | "waxing_crescent" // 초승달
  | "first_quarter"   // 상현달
  | "waxing_gibbous"  // 상현망간 (차오르는 보름)
  | "full_moon"       // 망 (보름달) — 별보기 최악
  | "waning_gibbous"  // 하현망간 (기우는 보름)
  | "last_quarter"    // 하현달
  | "waning_crescent"; // 그믐달

/** 달 위상 계산 결과 */
export interface MoonPhase {
  /** 위상 이름 (영문 키) */
  name: MoonPhaseName;
  /** 달의 밝기 비율 (0.0 = 삭, 1.0 = 망) */
  illumination: number;
  /** 달 이모지 (🌑 ~ 🌘) */
  emoji: string;
  /** 한국어 위상 이름 */
  nameKo: string;
}

// ----------------------------------------------------------
// 음력 관련 타입
// ----------------------------------------------------------

/**
 * getLunarDate()가 반환하는 음력 날짜 정보
 * 간결하게 { month, day, str } 만 포함
 */
export interface LunarDate {
  /** 음력 월 (1~12) */
  month: number;
  /** 음력 일 (1~30) */
  day: number;
  /** 한국어 표시 문자열 ("음력 N월 N일") */
  str: string;
}

// ----------------------------------------------------------
// 날씨 관련 타입
// ----------------------------------------------------------

/** getWeatherByCoords()가 반환하는 날씨 데이터 */
export interface WeatherData {
  /** 운량 (0 ~ 100, 낮을수록 맑음) */
  cloudCover: number;
  /** 강수 확률 (0 ~ 100) */
  precipitationProbability: number;
  /** WMO 날씨 코드 */
  weatherCode: number;
  /** 날씨 한국어 설명 */
  description: string;
}

/** 위치 좌표 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * getNationwideClearSpots()가 반환하는 관측 후보지
 * 운량 낮은 순으로 정렬되어 반환됨
 */
export interface Location {
  /** 지역 이름 (예: "서울", "제주") */
  name: string;
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
  /** 해당 지역 현재 운량 (0 ~ 100) */
  cloudCover: number;
  /** 날씨 설명 */
  description: string;
}

// ----------------------------------------------------------
// 별 관측 지수 관련 타입
// ----------------------------------------------------------

/** 별 관측 지수 등급 */
export type StarScoreGrade =
  | "excellent" // 최상 (80~100)
  | "good"      // 좋음 (60~79)
  | "fair"      // 보통 (40~59)
  | "poor"      // 나쁨 (20~39)
  | "bad";      // 최악 (0~19)

/** 별 관측 지수 계산 결과 */
export interface StarScore {
  /** 총 점수 (0 ~ 100) */
  score: number;
  /** 등급 */
  grade: StarScoreGrade;
  /** 한국어 등급 설명 */
  gradeKo: string;
  /** 점수 세부 내역 */
  breakdown: {
    /** 달 위상 기여 점수 (0~50) */
    moonScore: number;
    /** 날씨 기여 점수 (0~50) */
    weatherScore: number;
  };
}

// ----------------------------------------------------------
// 달력 날짜 셀 관련 타입
// ----------------------------------------------------------

/** 달력의 각 날짜 셀 데이터 */
export interface DayCellData {
  /** 양력 날짜 (YYYY-MM-DD) */
  date: string;
  /** 양력 일 */
  day: number;
  /** 현재 표시 달에 속하는 날인지 */
  isCurrentMonth: boolean;
  /** 오늘인지 */
  isToday: boolean;
  /** 음력 정보 */
  lunar: LunarDate;
  /** 달 위상 */
  moonPhase: MoonPhase;
  /** 별 관측 지수 (날씨 데이터 없으면 null) */
  starScore: StarScore | null;
  /** 날씨 데이터 */
  weather: WeatherData | null;
  /** 그믐 전후 최적 관측일 여부 */
  isBestDay: boolean;
}

/** 달력 전체 데이터 */
export interface CalendarData {
  /** 표시 연도 */
  year: number;
  /** 표시 월 (1~12) */
  month: number;
  /** 달력 날짜 셀 배열 (42칸 = 6주 × 7일) */
  days: DayCellData[];
}

// ----------------------------------------------------------
// 날짜 상세 페이지 타입
// ----------------------------------------------------------

/** day/[date]/page.tsx 에서 사용하는 상세 데이터 */
export interface DayDetailData extends DayCellData {
  /** 일출 시각 (HH:MM, 선택) */
  sunrise?: string;
  /** 일몰 시각 (HH:MM, 선택) */
  sunset?: string;
}

// ----------------------------------------------------------
// 일기 (Diary) 관련 타입
// ----------------------------------------------------------

/** 별 관측 일기 */
export interface Diary {
  /** UUID */
  id: string;
  /** 작성자 user.id */
  userId: string;
  /** 관측 날짜 (YYYY-MM-DD) */
  date: string;
  /** 일기 제목 */
  title: string;
  /** 일기 본문 */
  content: string;
  /** Supabase Storage URL (선택) */
  photoUrl?: string;
  /** 달 위상 이름 (예: "waning_gibbous") */
  moonPhase?: string;
  /** 달 이모지 (예: "🌖") */
  moonEmoji?: string;
  /** WMO 날씨 코드 */
  weatherCode?: number;
  /** 운량 (0~100) */
  cloudCover?: number;
  /** 즐겨찾기 여부 */
  isFavorite: boolean;
  /** 관측 장소 이름 (선택) */
  locationName?: string;
  /** 위도 (선택) */
  lat?: number;
  /** 경도 (선택) */
  lng?: number;
  /** 관측 시각 (ISO 8601, 선택) */
  observedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 일기 작성 폼 데이터 */
export interface DiaryFormData {
  /** 관측 날짜 (YYYY-MM-DD) */
  date: string;
  /** 일기 제목 */
  title: string;
  /** 일기 본문 */
  content: string;
  /** 업로드할 사진 파일 (선택) */
  photo?: File;
  /** 관측 장소 이름 (선택) */
  locationName?: string;
  /** 관측 시각 ISO 문자열 (선택) */
  observedAt?: string;
}

// ----------------------------------------------------------
// 관측 체크 (Observation) 관련 타입
// ----------------------------------------------------------

/** "오늘 별 봤어요" 관측 기록 */
export interface Observation {
  /** UUID */
  id: string;
  /** 기록한 user.id */
  userId: string;
  /** 관측 날짜 (YYYY-MM-DD) */
  date: string;
  /** 관측 장소 이름 (선택) */
  locationName?: string;
  /** 위도 (선택) */
  lat?: number;
  /** 경도 (선택) */
  lng?: number;
  createdAt: string;
}

// ----------------------------------------------------------
// NextAuth 세션 확장 타입
// ----------------------------------------------------------

/** NextAuth session.user 확장 (id 포함) */
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
