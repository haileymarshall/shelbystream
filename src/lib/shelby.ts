"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { SHELBY_API_KEY } from "./constants";

let clientInstance: import("@shelby-protocol/sdk/browser").ShelbyClient | null = null;

export function getShelbyNetwork(): Network.SHELBYNET | Network.TESTNET {
  const net = process.env.NEXT_PUBLIC_SHELBY_NETWORK ?? "shelbynet";
  if (net === "testnet") return Network.TESTNET;
  return Network.SHELBYNET;
}

export async function getShelbyClient() {
  if (clientInstance) return clientInstance;

  const { ShelbyClient } = await import("@shelby-protocol/sdk/browser");
  const network = getShelbyNetwork();

  clientInstance = new ShelbyClient({ network, apiKey: SHELBY_API_KEY });
  return clientInstance;
}

export async function getShelbyNodeClient(privateKey: string) {
  const { ShelbyNodeClient } = await import("@shelby-protocol/sdk/node");
  const { Ed25519PrivateKey, PrivateKey, PrivateKeyVariants, Account, Network } =
    await import("@aptos-labs/ts-sdk");

  const network = getShelbyNetwork();

  const client = new ShelbyNodeClient({
    network,
    apiKey: process.env.SHELBY_API_KEY ?? "",
  });

  const formattedKey = PrivateKey.formatPrivateKey(
    privateKey,
    PrivateKeyVariants.Ed25519
  );
  const ed25519Key = new Ed25519PrivateKey(formattedKey);
  const account = Account.fromPrivateKey({ privateKey: ed25519Key });

  return { client, account };
}
