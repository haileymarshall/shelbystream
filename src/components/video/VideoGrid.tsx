"use client";

import VideoCard from "./VideoCard";
import { VideoGridSkeleton } from "./VideoSkeleton";
import type { VideoMetadata } from "@/types";
import { VideoOff } from "lucide-react";

interface VideoGridProps {
  videos: VideoMetadata[];
  loading?: boolean;
  emptyMessage?: string;
  onDelete?: (video: VideoMetadata) => void;
}

export default function VideoGrid({
  videos,
  loading = false,
  emptyMessage = "No videos found",
  onDelete,
}: VideoGridProps) {
  if (loading) {
    return <VideoGridSkeleton />;
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
          <VideoOff className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard key={`${video.creator}-${video.id}`} video={video} onDelete={onDelete} />
      ))}
    </div>
  );
}
