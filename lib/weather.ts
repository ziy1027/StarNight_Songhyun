// ============================================================
// lib/weather.ts
// Open-Meteo API 기반 날씨/운량 데이터 모듈
// 문서: https://open-meteo.com/en/docs
// API 키 필요 없음, 무료
// ============================================================

import type { WeatherData, Location } from "@/types";

// ----------------------------------------------------------
// 상수
// ----------------------------------------------------------

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * 전국 별 관측 후보지 좌표 목록
 * getNationwideClearSpots()에서 운량 낮은 순으로 정렬해 반환
 */
const NATIONWIDE_SPOTS = [
  { name: "서울", latitude: 37.5665, longitude: 126.9780 },
  { name: "부산", latitude: 35.1796, longitude: 129.0756 },
  { name: "제주", latitude: 33.4996, longitude: 126.5312 },
  { name: "강릉", latitude: 37.7519, longitude: 128.8761 },
  { name: "전주", latitude: 35.8242, longitude: 127.1480 },
] as const;

/**
 * WMO 날씨 코드 → 한국어 설명
 * 참고: https://open-meteo.com/en/docs#weathervariables
 */
const WMO_KO: Record<number, string> = {
  0:  "맑음",
  1:  "대체로 맑음",
  2:  "구름 조금",
  3:  "흐림",
  45: "안개",
  48: "짙은 안개",
  51: "가벼운 이슬비",
  53: "이슬비",
  55: "짙은 이슬비",
  61: "가벼운 비",
  63: "비",
  65: "강한 비",
  71: "가벼운 눈",
  73: "눈",
  75: "강한 눈",
  80: "소나기",
  81: "강한 소나기",
  95: "뇌우",
};

/** WMO 코드를 한국어로 변환 */
function wmoToKo(code: number): string {
  return WMO_KO[code] ?? "알 수 없음";
}

// ----------------------------------------------------------
// Open-Meteo 응답 타입 (내부 전용)
// ----------------------------------------------------------

interface OpenMeteoCurrentResponse {
  current: {
    cloud_cover: number;
    weather_code: number;
  };
}

interface OpenMeteoDailyResponse {
  daily: {
    time: string[];
    cloud_cover_mean: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
}

// ----------------------------------------------------------
// 공개 함수
// ----------------------------------------------------------

/**
 * 특정 좌표의 현재 날씨(운량, 날씨코드)를 가져온다.
 * Open-Meteo "current" 파라미터 사용 — 실시간 데이터.
 *
 * @param lat - 위도
 * @param lng - 경도
 * @returns WeatherData (cloudCover, weatherCode, description 등)
 *
 * @example
 * const weather = await getWeatherByCoords(37.5665, 126.978);
 * console.log(weather.cloudCover);   // 예: 30 (30% 운량)
 * console.log(weather.description);  // "구름 조금"
 */
export async function getWeatherByCoords(
  lat: number,
  lng: number
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude:  lat.toString(),
    longitude: lng.toString(),
    current:   "cloud_cover,weather_code",
    timezone:  "Asia/Seoul",
  });

  const url = `${BASE_URL}?${params}`;

  let res: Response;
  try {
    res = await fetch(url, {
      // Next.js App Router 캐시: 10분 단위로 revalidate
      next: { revalidate: 600 },
    });
  } catch (err) {
    console.error("[weather.ts] getWeatherByCoords 네트워크 오류:", err);
    return buildFallbackWeather();
  }

  if (!res.ok) {
    console.error(`[weather.ts] Open-Meteo 응답 오류: HTTP ${res.status}`);
    return buildFallbackWeather();
  }

  const data: OpenMeteoCurrentResponse = await res.json();
  const cloudCover   = data.current.cloud_cover ?? 0;
  const weatherCode  = data.current.weather_code ?? 0;

  return {
    cloudCover,
    precipitationProbability: 0, // current API는 강수확률 제공 안 함
    weatherCode,
    description: wmoToKo(weatherCode),
  };
}

/**
 * 전국 5개 도시의 날씨를 가져와 운량 낮은 순(맑은 순)으로 정렬해 반환한다.
 * 별 관측 최적 장소 추천 기능에서 사용.
 *
 * 대상 지역: 서울, 부산, 제주, 강릉, 전주
 *
 * @returns Location[] — 운량 낮은 순 정렬
 *
 * @example
 * const spots = await getNationwideClearSpots();
 * console.log(spots[0].name);       // 가장 맑은 도시
 * console.log(spots[0].cloudCover); // 해당 도시 운량
 */
export async function getNationwideClearSpots(): Promise<Location[]> {
  // 5개 도시를 병렬로 fetch
  const results = await Promise.allSettled(
    NATIONWIDE_SPOTS.map(async (spot): Promise<Location> => {
      const weather = await getWeatherByCoords(spot.latitude, spot.longitude);
      return {
        name:        spot.name,
        latitude:    spot.latitude,
        longitude:   spot.longitude,
        cloudCover:  weather.cloudCover,
        description: weather.description,
      };
    })
  );

  // 성공한 결과만 추출
  const locations: Location[] = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<Location>).value);

  // 운량 오름차순 정렬 (낮을수록 맑음 = 별보기 좋음)
  return locations.sort((a, b) => a.cloudCover - b.cloudCover);
}

/**
 * 특정 월의 날씨 예보를 날짜 범위로 가져온다.
 * 달력 월간 뷰에서 날짜별 운량을 미리 로드할 때 사용.
 *
 * @param lat       - 위도
 * @param lng       - 경도
 * @param startDate - 시작 날짜 (YYYY-MM-DD)
 * @param endDate   - 종료 날짜 (YYYY-MM-DD)
 * @returns date(YYYY-MM-DD) → WeatherData 맵
 */
export async function getWeatherRange(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<Map<string, WeatherData>> {
  const params = new URLSearchParams({
    latitude:   lat.toString(),
    longitude:  lng.toString(),
    daily:      "cloud_cover_mean,precipitation_probability_max,weather_code",
    timezone:   "Asia/Seoul",
    start_date: startDate,
    end_date:   endDate,
  });

  // Open-Meteo forecast API는 최대 16일 앞까지만 지원
  // end_date가 범위 초과면 오늘+16일로 자름
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 16);
  const maxDateStr = maxDate.toISOString().slice(0, 10);
  if (endDate > maxDateStr) {
    params.set("end_date", maxDateStr);
  }
  // start_date가 오늘보다 미래면 날씨 없음
  if (startDate > maxDateStr) return new Map();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}?${params}`, {
      next: { revalidate: 3600 },
    });
  } catch {
    return new Map();
  }

  if (!res.ok) return new Map();

  const data: OpenMeteoDailyResponse = await res.json();
  const result = new Map<string, WeatherData>();

  data.daily.time.forEach((date, i) => {
    result.set(date, {
      cloudCover:              data.daily.cloud_cover_mean[i] ?? 0,
      precipitationProbability: data.daily.precipitation_probability_max[i] ?? 0,
      weatherCode:             data.daily.weather_code[i] ?? 0,
      description:             wmoToKo(data.daily.weather_code[i] ?? 0),
    });
  });

  return result;
}

/**
 * 날씨 데이터로 별 관측 날씨 점수를 계산한다 (0~50점)
 * - 운량이 낮을수록 높은 점수
 * - 강수 확률이 낮을수록 높은 점수
 */
export function getWeatherScore(weather: WeatherData): number {
  const cloudScore  = Math.round((1 - weather.cloudCover / 100) * 35);
  const precipScore = Math.round((1 - weather.precipitationProbability / 100) * 15);
  return Math.max(0, Math.min(50, cloudScore + precipScore));
}

/**
 * 브라우저 Geolocation API로 현재 위치를 가져온다.
 * 클라이언트 컴포넌트에서만 호출 가능.
 *
 * @returns { latitude, longitude } 또는 null (권한 거부 등)
 */
export function getBrowserCoords(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      ()    => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600_000 }
    );
  });
}

/** API 실패 시 사용하는 기본 날씨 데이터 */
function buildFallbackWeather(): WeatherData {
  return {
    cloudCover:              50,
    precipitationProbability: 0,
    weatherCode:              1,
    description:             "데이터 없음",
  };
}

/** 기본 위치: 서울 */
export const DEFAULT_COORDS = { latitude: 37.5665, longitude: 126.9780 };
