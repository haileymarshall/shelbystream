import type { VideoMetadata } from "@/types";
import { SHELBY_RPC_ENDPOINT } from "./constants";

export async function fetchVideoMetadata(
  address: string,
  videoId: string
): Promise<VideoMetadata | null> {
  try {
    const blobName = `videos/${videoId}/metadata.json`;
    const url = `${SHELBY_RPC_ENDPOINT}/v1/blobs/${address}/${blobName}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return { ...data, id: videoId, creator: address } as VideoMetadata;
  } catch {
    return null;
  }
}

export async function fetchThumbnailUrl(
  address: string,
  videoId: string
): Promise<string> {
  return `${SHELBY_RPC_ENDPOINT}/v1/blobs/${address}/videos/${videoId}/thumbnail.jpg`;
}

export async function fetchMasterPlaylistUrl(
  address: string,
  videoId: string
): Promise<string> {
  return `${SHELBY_RPC_ENDPOINT}/v1/blobs/${address}/videos/${videoId}/master.m3u8`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
