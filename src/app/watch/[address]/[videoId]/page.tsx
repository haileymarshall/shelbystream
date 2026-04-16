import WatchPage from "@/components/watch/WatchPage";
import type { Metadata } from "next";
import { fetchVideoMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ address: string; videoId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address, videoId } = await params;
  const video = await fetchVideoMetadata(address, videoId);
  return {
    title: video?.title ?? "Watch Video",
    description: video?.description ?? "Watch on ShelbyStream",
  };
}

export default async function Page({ params }: Props) {
  const { address, videoId } = await params;
  return <WatchPage address={address} videoId={videoId} />;
}
