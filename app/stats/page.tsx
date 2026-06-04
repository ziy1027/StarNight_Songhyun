// ============================================================
// app/stats/page.tsx
// 별 관측 통계 페이지
// - 월별 관측 횟수 바 차트 (recharts)
// - 연간 관측 히트맵 (GitHub 잔디 스타일, CSS Grid)
// - 총 관측 횟수, 가장 많이 관측한 달
// 로그인 필요 (middleware.ts로 보호됨)
// ============================================================

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createServerClient,
  toObservation,
  ObservationRow,
} from "@/lib/supabase";
import type { Observation } from "@/types";
import StatsCharts from "./StatsCharts";

export const metadata: Metadata = {
  title: "관측 통계 | StarNight",
  description: "나의 별 관측 통계 — 월별 차트와 연간 히트맵",
};

export default async function StatsPage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/login");

  // 전체 관측 기록 조회
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("observations")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  const observations: Observation[] = error
    ? []
    : (data as ObservationRow[]).map(toObservation);

  // ── 통계 계산 (서버에서) ─────────────────────────────
  const total = observations.length;

  // 월별 집계 (현재 연도)
  const currentYear = new Date().getFullYear();
  const monthlyMap = new Map<number, number>();
  for (let m = 1; m <= 12; m++) monthlyMap.set(m, 0);

  observations.forEach((o) => {
    const d = new Date(o.date + "T00:00:00");
    if (d.getFullYear() === currentYear) {
      monthlyMap.set(
        d.getMonth() + 1,
        (monthlyMap.get(d.getMonth() + 1) ?? 0) + 1,
      );
    }
  });

  const monthlyData = Array.from(monthlyMap.entries()).map(
    ([month, count]) => ({
      month: `${month}월`,
      count,
    }),
  );

  // 가장 많이 관측한 달
  const bestMonth = [...monthlyMap.entries()].reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    [0, 0],
  );

  // 히트맵용: 날짜별 Set
  const checkedDates = new Set(observations.map((o) => o.date));

  return (
    <main style={{ maxWidth: 780, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: 700,
          marginBottom: "var(--space-8)",
        }}
      >
        📊 관측 통계
      </h1>

      {/* ── 요약 카드 ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "var(--space-4)",
          marginBottom: "var(--space-8)",
        }}
      >
        <StatCard label="총 관측 횟수" value={`${total}회`} emoji="⭐" />
        <StatCard
          label={`${currentYear}년 가장 많이 관측한 달`}
          value={
            bestMonth[1] > 0
              ? `${bestMonth[0]}월 (${bestMonth[1]}회)`
              : "기록 없음"
          }
          emoji="🌙"
        />
      </div>

      {/* ── 차트 + 히트맵 (클라이언트 컴포넌트) ── */}
      <StatsCharts
        monthlyData={monthlyData}
        checkedDates={[...checkedDates]}
        currentYear={currentYear}
      />
    </main>
  );
}

function StatCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <div
      style={{
        padding: "var(--space-5)",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
      }}
    >
      <p
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-muted)",
          marginBottom: "var(--space-2)",
        }}
      >
        {emoji} {label}
      </p>
      <p
        style={{
          fontSize: "var(--font-size-xl)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
