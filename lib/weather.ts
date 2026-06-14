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

const BASE_URL    = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

// archive API는 약 3일 전까지만 데이터 있음 (그 이후는 forecast API)
const ARCHIVE_LAG_DAYS = 3;

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

interface OpenMeteoHourlyResponse {
  hourly: {
    time: string[];
    cloud_cover: number[];
    weather_code: number[];
  };
}

/** WMO 날씨 코드로 강수 확률 추정 (과거 데이터는 precipitation_probability 미제공) */
function estimatePrecipFromCode(code: number): number {
  if (code >= 95) return 90;      // 뇌우
  if (code >= 80) return 75;      // 소나기
  if (code >= 71) return 65;      // 눈
  if (code >= 61) return 70;      // 비
  if (code >= 51) return 50;      // 이슬비
  if (code >= 45) return 20;      // 안개
  if (code === 3)  return 15;     // 흐림
  return 0;
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

// ----------------------------------------------------------
// 내부 파싱 유틸
// ----------------------------------------------------------

/** hourly 응답에서 20~23시 데이터만 날짜별로 집계 */
function parseHourlyNight(data: OpenMeteoHourlyResponse): Map<string, WeatherData> {
  const byDate = new Map<string, { cloud: number[]; codes: number[] }>();
  data.hourly.time.forEach((timeStr, i) => {
    const hour = parseInt(timeStr.slice(11, 13), 10);
    if (hour < 20) return;
    const date = timeStr.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, { cloud: [], codes: [] });
    const e = byDate.get(date)!;
    e.cloud.push(data.hourly.cloud_cover[i] ?? 0);
    e.codes.push(data.hourly.weather_code[i] ?? 0);
  });

  const result = new Map<string, WeatherData>();
  byDate.forEach(({ cloud, codes }, date) => {
    if (!cloud.length) return;
    const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    const cloudCover  = avg(cloud);
    const weatherCode = codes[Math.floor(codes.length / 2)] ?? codes[0];
    const precipProb  = Math.max(...codes.map(estimatePrecipFromCode));
    result.set(date, { cloudCover, precipitationProbability: precipProb, weatherCode, description: wmoToKo(weatherCode) });
  });
  return result;
}

/** "YYYY-MM-DD" → 로컬 자정 ms */
function parseDateMs(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** 로컬 자정 ms → "YYYY-MM-DD" */
function msToDateStr(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

async function fetchHourlyNight(url: string): Promise<Map<string, WeatherData>> {
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error("[weather] fetch 실패:", res.status, url); return new Map(); }
    return parseHourlyNight(await res.json());
  } catch (err) {
    console.error("[weather] 네트워크 오류:", err);
    return new Map();
  }
}

/**
 * 날짜 범위의 저녁(20~23시) 날씨를 가져온다.
 *
 * 과거 데이터 정확도:
 *   - 3일 이전: archive-api.open-meteo.com (ERA5 실측값) ← 정확
 *   - 최근 3일 + 미래: api.open-meteo.com/v1/forecast (예보 모델)
 */
export async function getWeatherRange(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<Map<string, WeatherData>> {
  const todayMs     = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const startMs     = parseDateMs(startDate);
  const endMs       = parseDateMs(endDate);

  // 범위가 아예 미래 16일 밖이면 데이터 없음
  if (startMs > todayMs + 16 * 86_400_000) return new Map();

  const common = `latitude=${lat}&longitude=${lng}&hourly=cloud_cover,weather_code&timezone=Asia%2FSeoul`;

  // ── Forecast: 전체 과거~미래 범위를 항상 커버 (past_days 최대 92일)
  //    → 틈(gap) 없이 모든 날짜를 채운다. Archive가 있으면 나중에 덮어씀.
  const pastDays     = Math.min(Math.max(0, Math.ceil((todayMs - startMs) / 86_400_000)), 92);
  const forecastDays = Math.min(Math.max(1, Math.ceil((endMs - todayMs) / 86_400_000) + 1), 16);
  const forecastPromise = fetchHourlyNight(
    `${BASE_URL}?${common}&past_days=${pastDays}&forecast_days=${forecastDays}`
  );

  // ── Archive: 3일 이전 과거만 ERA5 실측값으로 보강 (forecast보다 정확)
  const archiveCutMs = todayMs - ARCHIVE_LAG_DAYS * 86_400_000;
  const archivePromise: Promise<Map<string, WeatherData>> =
    startMs < archiveCutMs
      ? fetchHourlyNight(
          `${ARCHIVE_URL}?${common}&start_date=${startDate}&end_date=${msToDateStr(Math.min(endMs, archiveCutMs - 86_400_000))}`
        )
      : Promise.resolve(new Map());

  const [forecastMap, archiveMap] = await Promise.all([forecastPromise, archivePromise]);

  // 병합: forecast로 전체를 채우고, archive(실측)가 있으면 덮어쓴다
  const result = new Map<string, WeatherData>(forecastMap);
  archiveMap.forEach((v, k) => result.set(k, v));
  return result;
}

/**
 * 날씨 데이터로 별 관측 날씨 점수를 계산한다 (0~50점)
 * - 운량이 낮을수록 높은 점수
 * - 강수 확률이 낮을수록 높은 점수
 */
export function getWeatherScore(weather: WeatherData): number {
  // 운량이 90% 이상이면 관측 불가 수준 → 최대 5점으로 하드 캡
  if (weather.cloudCover >= 90) return Math.min(5, Math.round((1 - weather.precipitationProbability / 100) * 5));

  const cloudScore  = Math.round((1 - weather.cloudCover / 100) * 40);
  const precipScore = Math.round((1 - weather.precipitationProbability / 100) * 10);
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
