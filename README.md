# StarNight 🌙

> 달의 위상과 날씨를 결합해 **별 관측 최적일**을 알려주는 한국어 웹앱

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2-green?logo=supabase)](https://supabase.com/)

---

## 개요

그믐(달이 없는 날)이 별을 보기 가장 좋은 날입니다.  
**StarNight**은 양력 달력에 음력과 달 모양을 함께 표시하고, 현재 위치의 날씨(운량)를 결합해 **별 관측 지수(0~100점)** 를 계산해줍니다.

| 화면      | 설명                                              |
| --------- | ------------------------------------------------- |
| 메인 달력 | 이번 달 전체 날짜별 달 위상 + 음력 + 별 관측 지수 |
| 날짜 상세 | 해당 날의 달 조도 · 날씨 · 점수 세부 내역         |
| 일기      | 별 관측 기록 + 사진 업로드                        |
| 통계      | 월별 관측 횟수 차트 + 연간 히트맵                 |

---

## 주요 기능

### ✅ 구현 완료

| 기능            | 설명                                                          |
| --------------- | ------------------------------------------------------------- |
| 달 위상 달력    | 매일 달 이모지(🌑~🌘) · 음력 날짜 · 별 관측 지수 표시         |
| 별 관측 지수    | 달 위상(50점) + 날씨 운량(35점) + 강수확률(15점) = 100점 만점 |
| 위치 기반 날씨  | Geolocation API → Open-Meteo 실시간 운량                      |
| 날짜 상세       | `/day/YYYY-MM-DD` — 점수 게이지 · 달 조도 · 날씨 카드         |
| 소셜 로그인     | 카카오 / 구글 OAuth (NextAuth v5)                             |
| 별 관측 일기    | 날짜별 일기 작성 · 수정 · 삭제 + 사진 업로드                  |
| 관측 체크       | "오늘 별 봤어요" 버튼으로 관측 기록                           |
| 통계            | 월별 바 차트 + 연간 GitHub 잔디 스타일 히트맵 (Recharts)      |
| 로딩 애니메이션 | 달 떠오르는 2초 오프닝                                        |

### 📋 예정 (로드맵)

| 단계 | 기능                                                |
| ---- | --------------------------------------------------- |
| 3차  | 천문 이벤트 (유성우 · 월식 · 슈퍼문) · 그믐 전 알림 |
| 4차  | 커뮤니티 — 관측 사진 공개 피드                      |

---

## 기술 스택

| 분류         | 기술                     | 비고                              |
| ------------ | ------------------------ | --------------------------------- |
| 프레임워크   | Next.js 16 (App Router)  | React 서버 컴포넌트 활용          |
| 언어         | TypeScript 5             | 전체 타입 정의 (`types/index.ts`) |
| 스타일       | CSS Modules + CSS 변수   | 다크 테마 전용                    |
| 인증         | NextAuth.js v5 (Auth.js) | JWT 전략, 카카오 · 구글           |
| DB / Storage | Supabase (PostgreSQL)    | RLS 적용, 사진 버킷               |
| 날씨 API     | Open-Meteo               | 무료 · API 키 불필요              |
| 음력 변환    | korean-lunar-calendar    | 클라이언트 사이드 계산            |
| 차트         | Recharts 3               | 월별 바 차트 · 히트맵             |
| 배포         | Vercel                   | 추천                              |

---

## 별 관측 지수 계산 방법

```
총점(0~100) = 달 위상 점수(0~50) + 날씨 점수(0~50)

달 위상 점수 = cos(위상 / 29.53일 × 2π) 기반 — 삭(그믐) 근처일수록 높음
날씨 점수   = 운량 점수(0~35) + 강수확률 점수(0~15)

최적일 기준: 삭(新月) 전후 ±2일 이내 (phase < 2.0 또는 phase > 27.53)
```

| 점수   | 등급 | 의미             |
| ------ | ---- | ---------------- |
| 80~100 | 최상 | 그믐 + 맑음      |
| 60~79  | 좋음 | 초승 · 그믐 근처 |
| 40~59  | 보통 |                  |
| 20~39  | 나쁨 |                  |
| 0~19   | 최악 | 보름달 + 흐림    |

---

## 시작하기

### 요구 사항

- Node.js 18+
- npm 또는 pnpm
- Supabase 프로젝트
- 카카오 개발자 앱 (소셜 로그인 사용 시)
- Google Cloud Console 프로젝트 (소셜 로그인 사용 시)

### 설치

```bash
git clone https://github.com/your-id/MoonCalForStar
cd MoonCalForStar
npm install
```

### 환경변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력합니다.

```env
# NextAuth
NEXTAUTH_SECRET=<랜덤 문자열 — openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# 카카오 OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# 구글 OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 데이터베이스 초기화

Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql` 내용을 실행합니다.

```bash
# 또는 Supabase CLI 사용 시
supabase db push
```

### 개발 서버 실행

```bash
npm run dev
# → http://localhost:3000
```

---

## 프로젝트 구조

```
MoonCalForStar/
├── app/
│   ├── page.tsx                  # 메인 달력 (클라이언트 컴포넌트)
│   ├── layout.tsx                # 루트 레이아웃 — 헤더 · 네비 · 푸터
│   ├── day/[date]/               # 날짜 상세 (/day/YYYY-MM-DD)
│   ├── diary/                    # 일기 목록
│   │   └── [date]/               # 일기 상세 · 수정
│   ├── stats/                    # 관측 통계
│   ├── login/                    # 로그인 페이지
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth 핸들러
│       ├── lunar/                # 음력 변환 API
│       ├── diary/                # 일기 CRUD API
│       └── observation/          # 관측 체크 API
│
├── components/
│   ├── MoonCalendar/             # 월간 달력 컴포넌트
│   ├── DayCell/                  # 달력 날짜 셀
│   ├── StarScore/                # 별 관측 지수 표시
│   ├── LoginButton/              # 로그인/로그아웃 버튼
│   ├── DiaryForm/                # 일기 작성 폼
│   ├── ObservationCheck/         # "별 봤어요" 체크
│   └── Providers/SessionProvider # NextAuth 세션 프로바이더
│
├── lib/
│   ├── moonPhase.ts              # 달 위상 계산 (getMoonPhase, getStarScore)
│   ├── lunar.ts                  # 음력 변환 (getLunarDate)
│   ├── weather.ts                # Open-Meteo API 래퍼
│   └── supabase.ts               # Supabase 클라이언트 (서버/클라이언트 분리)
│
├── types/
│   └── index.ts                  # 전역 TypeScript 타입 정의
│
├── supabase/
│   └── schema.sql                # DB 스키마 (테이블 · RLS · 인덱스)
│
├── styles/
│   └── globals.css               # CSS 변수 · 전역 스타일
│
└── auth.ts                       # NextAuth 설정 (providers · callbacks)
```

---

## 데이터베이스 스키마

```sql
users        -- 소셜 로그인 유저 (id · email · name · provider)
diaries      -- 날짜별 별 관측 일기 (content · photo_url · moon_phase · cloud_cover)
observations -- "오늘 별 봤어요" 체크 (date · location_name · lat · lng)
```

- 모든 테이블에 **Row Level Security(RLS)** 적용 — 본인 데이터만 접근 가능
- `diaries`, `observations` 모두 `(user_id, date)` 유니크 제약 — 날짜당 1개
- Supabase Storage `diary-photos` 버킷에 관측 사진 저장

---

## 외부 서비스 설정

### Supabase

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. SQL Editor → `supabase/schema.sql` 실행
3. Project URL, anon key, service_role key를 `.env.local`에 입력
4. Storage → `diary-photos` 버킷 확인 (schema.sql에 포함)

### 카카오 로그인

1. [developers.kakao.com](https://developers.kakao.com) → 앱 생성
2. 카카오 로그인 활성화
3. Redirect URI 추가: `http://localhost:3000/api/auth/callback/kakao`

### 구글 로그인

1. [console.cloud.google.com](https://console.cloud.google.com) → 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. Redirect URI 추가: `http://localhost:3000/api/auth/callback/google`

---

## 라이선스

MIT
