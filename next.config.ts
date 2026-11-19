import type { NextConfig } from "next";
const preview = process.env.GITHUB_PAGES_PREVIEW === "true";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(preview ? {
    output: "export",
    basePath: "/CARDONES-",
    trailingSlash: true,
    images: { unoptimized: true },
  } : {}),
};
export default nextConfig;
