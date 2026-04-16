import { Suspense } from "react";
import HomeFeed from "@/components/home/HomeFeed";
import HeroBanner from "@/components/home/HeroBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShelbyStream — Decentralized Video Streaming",
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroBanner />
      <div className="px-4 sm:px-6 py-6">
        <Suspense fallback={null}>
          <HomeFeed />
        </Suspense>
      </div>
    </div>
  );
}
