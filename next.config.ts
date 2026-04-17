import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include the ffmpeg-static binary in the upload API route's function bundle.
  // Without this, Vercel's file tracer omits native binaries and the binary
  // is not found at runtime (process.cwd()/node_modules/ffmpeg-static/ffmpeg).
  outputFileTracingIncludes: {
    "/api/upload": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.shelbynet.shelby.xyz",
      },
      {
        protocol: "https",
        hostname: "api.testnet.shelby.xyz",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      // Polyfill Node.js modules that may be required by Shelby/Aptos SDKs
      fs: { browser: "./src/lib/empty.ts" },
      path: { browser: "./src/lib/empty.ts" },
      os: { browser: "./src/lib/empty.ts" },
    },
  },
};

export default nextConfig;
