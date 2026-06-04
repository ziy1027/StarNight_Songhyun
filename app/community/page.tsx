import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "커뮤니티 | StarNight",
  description: "별과 달 관측 사진을 공유하는 커뮤니티",
};

export default function CommunityPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: "var(--space-10)" }}>
        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: 700,
            marginBottom: "var(--space-2)",
          }}
        >
          📸 커뮤니티
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          내가 찍은 별 · 달 사진을 자랑해보세요
        </p>
      </div>

      {/* 준비 중 카드 */}
      <div
        style={{
          padding: "var(--space-12) var(--space-8)",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-2xl)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-5)",
        }}
      >
        <div style={{ fontSize: "4rem", lineHeight: 1 }}>🌠</div>

        <div>
          <p
            style={{
              fontSize: "var(--font-size-lg)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: "var(--space-3)",
            }}
          >
            곧 만나요!
          </p>
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              lineHeight: 1.8,
            }}
          >
            별과 달 관측 사진을 올리고
            <br />
            다른 별지기들과 공유하는 공간을
            <br />
            열심히 만들고 있어요 ✨
          </p>
        </div>

        {/* 예정 기능 목록 */}
        <div
          style={{
            width: "100%",
            padding: "var(--space-4)",
            background: "var(--color-bg-secondary)",
            borderRadius: "var(--radius-xl)",
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-3)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            준비 중인 기능
          </p>
          {[
            "📷 관측 사진 업로드 & 공개 피드",
            "🌙 달 위상 태그 자동 추가",
            "❤️ 좋아요 & 댓글",
            "📍 관측 장소 공유",
          ].map((item) => (
            <div
              key={item}
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
                padding: "var(--space-2) 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <Link
          href="/"
          style={{
            padding: "var(--space-3) var(--space-8)",
            background: "rgba(107, 159, 255, 0.12)",
            border: "1px solid rgba(107, 159, 255, 0.25)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: "var(--color-accent-star)",
            textDecoration: "none",
          }}
        >
          달력 보러 가기
        </Link>
      </div>
    </main>
  );
}
