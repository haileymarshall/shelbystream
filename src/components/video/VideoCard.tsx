"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2 } from "lucide-react";
import type { VideoMetadata } from "@/types";
import { formatDuration, formatTimeAgo, shortenAddress } from "@/lib/metadata";
import { SHELBY_RPC_ENDPOINT } from "@/lib/constants";
import { useState } from "react";

interface VideoCardProps {
  video: VideoMetadata;
  onDelete?: (video: VideoMetadata) => void;
}

export default function VideoCard({ video, onDelete }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `${SHELBY_RPC_ENDPOINT}/v1/blobs/${video.creator}/videos/${video.id}/thumbnail.jpg`;

  return (
    <Link
      href={`/watch/${video.creator}/${video.id}`}
      className="group block card-hover rounded-xl overflow-hidden border border-border bg-card"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface overflow-hidden">
        {!imgError ? (
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center gradient-brand opacity-40">
            <Play className="w-12 h-12 text-white" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 thumbnail-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center glow-brand">
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="secondary"
              className="bg-black/80 text-white border-0 text-xs font-mono px-1.5 py-0.5"
            >
              {formatDuration(video.duration)}
            </Badge>
          </div>
        )}

        {/* Quality badge */}
        {video.qualities?.includes("1080p") && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="secondary"
              className="bg-brand-muted text-primary border-primary/20 text-xs px-1.5 py-0.5"
            >
              HD
            </Badge>
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(video);
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            title="Delete video"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex gap-3">
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarFallback className="text-[10px] gradient-brand text-white">
            {video.creator.slice(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {shortenAddress(video.creator)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatTimeAgo(video.uploadedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
