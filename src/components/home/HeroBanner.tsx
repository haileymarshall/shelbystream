"use client";

import { Button } from "@/components/ui/button";
import { Zap, Play, Shield, Globe } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  { icon: Shield, label: "On-chain provenance" },
  { icon: Zap, label: "Pay-per-stream" },
  { icon: Globe, label: "Decentralized storage" },
];

export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden border-b border-border">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-muted border border-primary/20 text-primary text-xs font-medium mb-6">
            <Zap className="w-3 h-3" fill="currentColor" />
            Powered by Shelby Protocol on Aptos
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Video streaming,{" "}
            <span className="gradient-text">truly decentralized</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Upload, stream, and monetize your content on-chain. Every video is
            stored on Shelby Protocol with cryptographic provenance and
            micropayment-based delivery.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              render={<Link href="/upload" />}
              nativeButton={false}
              size="lg"
              className="gradient-brand text-white border-0 hover:opacity-90 glow-brand h-11 px-6"
            >
              <Play className="w-4 h-4 mr-2" fill="white" />
              Start Uploading
            </Button>
            <Button
              render={<Link href="#feed" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-11 px-6 border-border hover:border-primary/40 hover:bg-brand-muted hover:text-primary"
            >
              Explore Videos
            </Button>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mt-10 flex-wrap"
        >
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Icon className="w-3.5 h-3.5 text-primary" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
