import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // korean-lunar-calendar는 CommonJS 패키지라 Next.js 서버 번들러가 변환 시 문제가 생김.
  // serverExternalPackages에 등록하면 번들링 없이 Node.js require()로 직접 불러옴.
  serverExternalPackages: ["korean-lunar-calendar"],
};

export default nextConfig;
