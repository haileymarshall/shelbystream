"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useAccountVideos } from "@/hooks/useVideos";
import { useQueryClient } from "@tanstack/react-query";
import VideoGrid from "@/components/video/VideoGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Film,
  Upload,
  Wallet,
  LayoutDashboard,
  Zap,
  HardDrive,
} from "lucide-react";
import Link from "next/link";
import { shortenAddress } from "@/lib/metadata";
import { toast } from "sonner";
import type { VideoMetadata } from "@/types";

export default function DashboardPage() {
  const { connected, account } = useWallet();
  const address = account?.address.toString();
  const { data: videos = [], isLoading } = useAccountVideos(address);
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (video: VideoMetadata) => {
    if (!address) return;
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;

    setDeleting(video.id);
    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          creatorAddress: address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");

      toast.success(`Deleted "${video.title}" (${data.deletedCount} blobs removed)`);
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  if (!connected || !address) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-brand mx-auto flex items-center justify-center mb-6 glow-brand">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect your wallet</h2>
        <p className="text-muted-foreground">
          Connect your Petra wallet to access your creator dashboard.
        </p>
      </div>
    );
  }

  const totalDuration = videos.reduce((sum, v) => sum + (v.duration ?? 0), 0);

  const stats = [
    {
      label: "Total Videos",
      value: isLoading ? "..." : videos.length,
      icon: Film,
    },
    {
      label: "Total Duration",
      value: isLoading
        ? "..."
        : totalDuration > 0
        ? `${Math.floor(totalDuration / 60)}m`
        : "—",
      icon: Zap,
    },
    {
      label: "Storage Used",
      value: "On Shelby",
      icon: HardDrive,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-xs text-muted-foreground font-mono">
              {shortenAddress(address)}
            </p>
          </div>
        </div>
        <Button
          render={<Link href="/upload" />}
          nativeButton={false}
          className="gradient-brand text-white border-0 hover:opacity-90 glow-brand"
          size="sm"
        >
          <Upload className="w-4 h-4 mr-1.5" />
          Upload Video
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-primary" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="bg-border mb-8" />

      {/* Video list */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-lg">Your Videos</h2>
      </div>

      <VideoGrid
        videos={deleting ? videos.map(v => v.id === deleting ? { ...v, title: `Deleting ${v.title}...` } : v) : videos}
        loading={isLoading}
        emptyMessage="You haven't uploaded any videos yet. Hit 'Upload Video' to get started."
        onDelete={handleDelete}
      />
    </div>
  );
}
