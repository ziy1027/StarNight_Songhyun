import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginButton from "@/components/LoginButton/LoginButton";

export const metadata: Metadata = {
  title: "로그인 | StarNight",
  description: "카카오 또는 구글로 로그인하세요",
};

export default async function LoginPage() {
  const session = await auth().catch(() => null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.id) redirect("/");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        gap: "var(--space-8)",
      }}
    >
      {/* 로고 + 타이틀 */}
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-4)",
        }}
      >
        <Image
          src="/logo_white.svg"
          alt="StarNight"
          width={180}
          height={56}
          priority
          style={{
            objectFit: "contain",
            width: "150px",
            height: "auto",
            filter: "drop-shadow(0 0 20px rgba(255,249,226,0.2))",
          }}
        />
        <div>
          <h1
            style={{
              fontFamily: "var(--font-logo)",
              fontSize: "var(--font-size-2xl)",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              marginBottom: "var(--space-2)",
              letterSpacing: "0.08em",
            }}
          >
            StarNight
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-sm)",
              lineHeight: 1.7,
            }}
          >
            별 관측 일기를 이용하려면
            <br />
            로그인이 필요해요
          </p>
        </div>
      </div>

      {/* 로그인 카드 */}
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          padding: "var(--space-6)",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-2xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <LoginButton />
      </div>

      <p
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-muted)",
          textAlign: "center",
          lineHeight: 1.7,
        }}
      >
        로그인하면 이용약관 및 개인정보 처리방침에
        <br />
        동의하는 것으로 간주됩니다
      </p>
    </div>
  );
}
