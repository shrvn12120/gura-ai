import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['10d6-124-195-202-155.ngrok-free.app'],
  experimental: {
    hideLogsAfterAbort: true,
  },
  cacheComponents: true,
  transpilePackages: [
  "@assandha-ai/widget",
],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],
  },
};

export default nextConfig;
