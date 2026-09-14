import type { NextConfig } from "next";

const r2Host = (() => {
  const base = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.codista.in" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      ...(r2Host
        ? ([{ protocol: "https", hostname: r2Host }] as const)
        : ([
            { protocol: "https", hostname: "**.r2.dev" },
            { protocol: "https", hostname: "**.cloudflarestorage.com" },
          ] as const)),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
