"use client";

import { useAccountVideos } from "@/hooks/useVideos";
import VideoGrid from "@/components/video/VideoGrid";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, Upload, Zap } from "lucide-react";
import { shortenAddress } from "@/lib/metadata";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Link from "next/link";
import { toast } from "sonner";

interface ChannelPageProps {
  address: string;
}

export default function ChannelPage({ address }: ChannelPageProps) {
  const { data: videos = [], isLoading } = useAccountVideos(address);
  const { account } = useWallet();
  const isOwner = account?.address.toString().toLowerCase() === address.toLowerCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied!");
  };

  return (
    <div className="min-h-screen">
      {/* Channel header */}
      <div className="relative border-b border-border">
        {/* Banner gradient */}
        <div className="h-32 sm:h-40 gradient-brand opacity-20" />

        <div className="px-4 sm:px-6 pb-4">
          <div className="flex items-end justify-between -mt-10 sm:-mt-12">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background ring-2 ring-primary/20">
              <AvatarFallback className="text-2xl font-bold gradient-brand text-white">
                {address.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-2 pb-1">
              {isOwner && (
                <Button
                  render={<Link href="/upload" />}
                  nativeButton={false}
                  size="sm"
                  className="h-8 gradient-brand text-white border-0 hover:opacity-90"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-8 border-border hover:border-primary/40 hover:bg-brand-muted hover:text-primary"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy
              </Button>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-lg font-mono">
                {shortenAddress(address, 6)}
              </h1>
              {isOwner && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-brand-muted text-primary border-primary/20"
                >
                  You
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono break-all">
              {address}
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
                {isLoading ? "..." : videos.length} video{videos.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs">·</span>
              <span className="text-xs">Aptos · Shelby Protocol</span>
            </div>
          </div>
        </div>
      </div>

      {/* Videos */}
      <div className="px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg">Videos</h2>
        </div>
        <Separator className="bg-border mb-6" />
        <VideoGrid
          videos={videos}
          loading={isLoading}
          emptyMessage={
            isOwner
              ? "You haven't uploaded any videos yet."
              : "This channel hasn't uploaded any videos yet."
          }
        />
      </div>
    </div>
  );
}
