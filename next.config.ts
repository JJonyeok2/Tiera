import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { dirs: ["app", "lib", "components", "prisma"] },
};

export default nextConfig;
