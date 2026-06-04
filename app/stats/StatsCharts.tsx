// ============================================================
// app/stats/StatsCharts.tsx
// 통계 차트 클라이언트 컴포넌트
// - 월별 바 차트 (recharts BarChart)
// - 연간 히트맵 (GitHub 잔디 스타일, CSS Grid)
// ============================================================

"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface MonthlyDataItem {
  month: string;
  count: number;
}

interface StatsChartsProps {
  monthlyData:  MonthlyDataItem[];
  checkedDates: string[];       // ["2026-01-05", ...]
  currentYear:  number;
}

// 관측 날짜 → 색상
function countToColor(count: number): string {
  if (count === 0) return "var(--color-bg-secondary)";
  return "var(--color-score-excellent)";
}

// 연간 히트맵: 올해 1월 1일부터 오늘까지의 날짜를 주 단위로 배열
function buildHeatmapDays(year: number, checkedSet: Set<string>) {
  const start = new Date(year, 0, 1);
  const end   = new Date(year, 11, 31);

  // 첫 번째 일요일부터 시작
  const offset = start.getDay(); // 0=일
  const weeks: { date: string; checked: boolean; inYear: boolean }[][] = [];
  let week: { date: string; checked: boolean; inYear: boolean }[] = [];

  // 빈 칸 채우기 (1월 1일이 일요일이 아니면)
  for (let i = 0; i < offset; i++) {
    week.push({ date: "", checked: false, inYear: false });
  }

  const cur = new Date(start);
  while (cur <= end) {
    const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    week.push({ date: dateStr, checked: checkedSet.has(dateStr), inYear: true });

    if (cur.getDay() === 6) {
      weeks.push(week);
      week = [];
    }

    cur.setDate(cur.getDate() + 1);
  }
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: "", checked: false, inYear: false });
    weeks.push(week);
  }

  return weeks;
}

const MONTHS_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

export default function StatsCharts({ monthlyData, checkedDates, currentYear }: StatsChartsProps) {
  const checkedSet = new Set(checkedDates);
  const weeks      = buildHeatmapDays(currentYear, checkedSet);
  const maxCount   = Math.max(...monthlyData.map((d) => d.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>

      {/* ── 월별 바 차트 ── */}
      <section>
        <h2 style={{
          fontSize: "var(--font-size-base)", fontWeight: 600,
          color: "var(--color-text-secondary)", marginBottom: "var(--space-4)",
        }}>
          📅 {currentYear}년 월별 관측 횟수
        </h2>
        <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "var(--space-5)" }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, maxCount + 1]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text-primary)",
                  fontSize: 12,
                }}
                formatter={(v) => [`${v ?? 0}회`, "관측 횟수"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.count > 0 ? "var(--color-score-excellent)" : "var(--color-bg-secondary)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── 연간 히트맵 ── */}
      <section>
        <h2 style={{
          fontSize: "var(--font-size-base)", fontWeight: 600,
          color: "var(--color-text-secondary)", marginBottom: "var(--space-4)",
        }}>
          🌿 {currentYear}년 관측 히트맵
        </h2>
        <div style={{
          background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)", padding: "var(--space-5)",
          overflowX: "auto",
        }}>
          {/* 월 레이블 */}
          <div style={{ display: "flex", marginLeft: 20, marginBottom: 4 }}>
            {MONTHS_KO.map((m, i) => (
              <span key={i} style={{
                width: `${(weeks.length / 12 * 14)}px`,
                fontSize: 10,
                color: "var(--color-text-muted)",
                flexShrink: 0,
              }}>
                {m}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 3 }}>
            {/* 요일 레이블 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 4 }}>
              {["일","월","화","수","목","금","토"].map((d) => (
                <span key={d} style={{ fontSize: 9, color: "var(--color-text-muted)", height: 11, lineHeight: "11px" }}>
                  {d}
                </span>
              ))}
            </div>

            {/* 주 그리드 */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={cell.date || undefined}
                    style={{
                      width: 11, height: 11,
                      borderRadius: 2,
                      background: !cell.inYear
                        ? "transparent"
                        : countToColor(cell.checked ? 1 : 0),
                      transition: "background 0.2s",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* 범례 */}
          <div style={{
            display: "flex", alignItems: "center", gap: "var(--space-2)",
            marginTop: "var(--space-4)", fontSize: 10, color: "var(--color-text-muted)",
            justifyContent: "flex-end",
          }}>
            <span>적음</span>
            {["var(--color-bg-secondary)", "rgba(74,222,128,0.3)", "rgba(74,222,128,0.6)", "var(--color-score-excellent)"].map((c, i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
            ))}
            <span>많음</span>
          </div>
        </div>
      </section>
    </div>
  );
}
