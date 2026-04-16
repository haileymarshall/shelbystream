import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
