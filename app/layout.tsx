import type { Metadata } from "next";
import "@/styles/globals.css";
import SessionProvider from "@/components/Providers/SessionProvider";
import Header from "@/components/Header/Header";
import BottomNav from "@/components/BottomNav/BottomNav";
import { auth } from "@/auth";
import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: "StarNight — 별 관측 최적일 캘린더",
    template: "%s | StarNight",
  },
  description:
    "달의 위상과 날씨를 결합해 별 관측 최적일을 알려주는 캘린더. 음력, 달 위상, 별 관측 지수를 한눈에 확인하세요.",
  keywords: [
    "별관측",
    "달력",
    "음력",
    "달위상",
    "천문",
    "별보기",
    "stargazing",
    "StarNight",
  ],
  authors: [{ name: "StarNight" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "StarNight — 별 관측 최적일 캘린더",
    description: "달의 위상과 날씨를 결합해 별 관측 최적일을 알려주는 캘린더",
    siteName: "StarNight",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth().catch(() => null);

  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#112138" />
      </head>
      <body>
        <Providers>
          <SessionProvider session={session}>
            {/* ── 헤더 ── */}
            <Header />

            {/* ── 페이지 콘텐츠 ── */}
            <main
              style={{
                minHeight:
                  "calc(100vh - var(--header-height) - var(--bottom-nav-height))",
                padding: "var(--space-5) var(--space-4)",
                paddingBottom:
                  "calc(var(--bottom-nav-height) + var(--space-5))",
              }}
            >
              {children}
            </main>

            {/* ── 하단 탭바 ── */}
            <BottomNav />
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}
