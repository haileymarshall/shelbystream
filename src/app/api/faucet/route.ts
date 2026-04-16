import { NextRequest } from "next/server";

const SHELBYUSD_FAUCET_URL =
  "https://faucet.shelbynet.shelby.xyz/fund?asset=shelbyusd";

export async function POST(req: NextRequest) {
  try {
    const { address, token } = await req.json();

    if (!address || !token) {
      return Response.json(
        { error: "Missing address or token type" },
        { status: 400 }
      );
    }

    if (token !== "APT" && token !== "ShelbyUSD") {
      return Response.json(
        { error: "Invalid token type. Must be APT or ShelbyUSD" },
        { status: 400 }
      );
    }

    const privateKey = process.env.APTOS_PRIVATE_KEY;
    if (!privateKey) throw new Error("APTOS_PRIVATE_KEY not configured");

    const { getShelbyNodeClient } = await import("@/lib/shelby-server");
    const { client } = await getShelbyNodeClient(privateKey);

    if (token === "APT") {
      const hash = await client.fundAccountWithAPT({
        address,
        amount: 100_000_000, // 1 APT
      });
      return Response.json({ hash, amount: "1 APT" });
    } else {
      // Call the ShelbyUSD faucet endpoint directly with a smaller amount
      const res = await fetch(SHELBYUSD_FAUCET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, amount: 1_000_000 }), // 1 ShelbyUSD
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`ShelbyUSD faucet failed: ${body}`);
      }

      const json = await res.json();
      const hash = json.txn_hashes?.[0] ?? "unknown";
      return Response.json({ hash, amount: "1 ShelbyUSD" });
    }
  } catch (err) {
    console.error("Faucet error:", err);
    const message = err instanceof Error ? err.message : "Faucet request failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
