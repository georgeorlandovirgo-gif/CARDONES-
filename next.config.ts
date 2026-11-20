import type { NextConfig } from "next";
const preview = process.env.GITHUB_PAGES_PREVIEW === "true";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.CARDONES_DEV === "1" ? {distDir:".next-dev"}:{}),
  ...(preview ? {
    output: "export",
    basePath: "/CARDONES-",
    trailingSlash: true,
    images: { unoptimized: true },
  } : {}),
};
export default nextConfig;
