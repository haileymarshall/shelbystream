import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { APTOS_NODE_URL, SHELBY_API_KEY } from "./constants";

let aptosInstance: Aptos | null = null;

export function getAptosClient(): Aptos {
  if (aptosInstance) return aptosInstance;

  const network = process.env.NEXT_PUBLIC_SHELBY_NETWORK ?? "shelbynet";

  if (network === "testnet") {
    aptosInstance = new Aptos(
      new AptosConfig({
        network: Network.TESTNET,
        clientConfig: { API_KEY: SHELBY_API_KEY },
      })
    );
  } else {
    // Shelbynet — custom fullnode
    aptosInstance = new Aptos(
      new AptosConfig({
        network: Network.CUSTOM,
        fullnode: APTOS_NODE_URL,
        clientConfig: { API_KEY: SHELBY_API_KEY },
      })
    );
  }

  return aptosInstance;
}
