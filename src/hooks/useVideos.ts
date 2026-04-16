"use client";

import { useQuery } from "@tanstack/react-query";
import type { VideoMetadata } from "@/types";
import { SHELBY_RPC_ENDPOINT, SHELBY_BLOB_INDEXER_URL, SHELBY_API_KEY } from "@/lib/constants";

interface BlobEntry {
  blob_name: string;
  owner: string;
  created_at: string;
  size: string;
}

async function fetchMetadataBlobs(): Promise<BlobEntry[]> {
  const res = await fetch(SHELBY_BLOB_INDEXER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SHELBY_API_KEY}`,
    },
    body: JSON.stringify({
      query: `
        query GetVideoBlobs {
          blobs(
            where: { blob_name: { _like: "%/metadata.json" } }
            order_by: { created_at: desc }
            limit: 100
          ) {
            blob_name
            owner
            created_at
            size
          }
        }
      `,
    }),
  });

  if (!res.ok) return [];
  const { data } = await res.json();
  return data?.blobs ?? [];
}

async function blobsToVideos(blobList: BlobEntry[]): Promise<VideoMetadata[]> {
  const videos = await Promise.allSettled(
    blobList.map(async (blob) => {
      const blobPath = blob.blob_name.replace(/^@[^/]+\//, "");
      const url = `${SHELBY_RPC_ENDPOINT}/v1/blobs/${blob.owner}/${blobPath}`;
      const metaRes = await fetch(url, { cache: "no-store" });
      if (!metaRes.ok) return null;
      const meta = await metaRes.json();

      const parts = blobPath.split("/");
      const videoId = parts[1];

      return {
        ...meta,
        id: videoId,
        creator: meta.creator ?? blob.owner,
      } as VideoMetadata;
    })
  );

  return videos
    .filter(
      (r): r is PromiseFulfilledResult<VideoMetadata> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}

async function fetchAllVideos(): Promise<VideoMetadata[]> {
  try {
    const blobList = await fetchMetadataBlobs();
    return blobsToVideos(blobList);
  } catch {
    return [];
  }
}

async function fetchAccountVideos(address: string): Promise<VideoMetadata[]> {
  try {
    // All blobs are owned by the server upload account, not individual wallets.
    // Fetch all metadata blobs, then filter by the creator field in the metadata.
    const blobList = await fetchMetadataBlobs();
    const allVideos = await blobsToVideos(blobList);
    return allVideos.filter(
      (v) => v.creator.toLowerCase() === address.toLowerCase()
    );
  } catch {
    return [];
  }
}

export function useVideos() {
  return useQuery({
    queryKey: ["videos"],
    queryFn: fetchAllVideos,
    staleTime: 60 * 1000,
  });
}

export function useAccountVideos(address: string | undefined) {
  return useQuery({
    queryKey: ["videos", address],
    queryFn: () => fetchAccountVideos(address!),
    enabled: !!address,
    staleTime: 30 * 1000,
  });
}
