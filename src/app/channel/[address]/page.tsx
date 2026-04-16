import ChannelPage from "@/components/channel/ChannelPage";
import type { Metadata } from "next";

type Props = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  return { title: `Channel · ${address.slice(0, 10)}...` };
}

export default async function Page({ params }: Props) {
  const { address } = await params;
  return <ChannelPage address={address} />;
}
