"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Film,
  CheckCircle2,
  AlertCircle,
  Wallet,
  X,
  FileVideo,
  Coins,
} from "lucide-react";
import type { UploadProgress } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SHELBYUSD_FA_METADATA_ADDRESS } from "@/lib/constants";

const STAGE_LABELS: Record<UploadProgress["stage"], string> = {
  idle: "Ready",
  confirming: "Waiting for wallet confirmation...",
  transcoding: "Transcoding video...",
  encoding: "Generating commitments...",
  registering: "Registering on Aptos...",
  uploading: "Uploading to Shelby...",
  done: "Upload complete!",
  error: "Upload failed",
};

const STAGE_PROGRESS: Record<UploadProgress["stage"], number> = {
  idle: 0,
  confirming: 5,
  transcoding: 20,
  encoding: 45,
  registering: 65,
  uploading: 85,
  done: 100,
  error: 0,
};


export default function UploadPage() {
  const { connected, account, signMessage } = useWallet();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [progress, setProgress] = useState<UploadProgress>({
    stage: "idle",
    progress: 0,
    message: "",
  });
  const [susdBalance, setSusdBalance] = useState<string | null>(null);
  const [aptBalance, setAptBalance] = useState<string | null>(null);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (!connected || !account?.address) {
      setSusdBalance(null);
      setAptBalance(null);
      return;
    }

    const addr = account.address.toString();

    // Fetch APT balance via Aptos node
    fetch(`${process.env.NEXT_PUBLIC_APTOS_NODE_URL}/v1/accounts/${addr}/resources`)
      .then((res) => (res.ok ? res.json() : []))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((resources: Array<{ type: string; data: any }>) => {
        const aptRes = resources.find(
          (r: { type: string }) =>
            r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
        );
        if (aptRes?.data?.coin?.value) {
          const raw = BigInt(aptRes.data.coin.value);
          setAptBalance((Number(raw) / 1e8).toFixed(4));
        }
      })
      .catch(() => {});

    // Fetch ShelbyUSD balance via fungible asset store
    fetch(
      `${process.env.NEXT_PUBLIC_APTOS_NODE_URL}/v1/accounts/${addr}/resource/0x1::fungible_asset::FungibleStore`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.balance) {
          const raw = BigInt(data.data.balance);
          setSusdBalance((Number(raw) / 1e6).toFixed(2));
        }
      })
      .catch(() => {
        // Try the indexer approach as fallback
        fetch(`${process.env.NEXT_PUBLIC_SHELBY_INDEXER_URL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query GetBalance($address: String!, $asset: String!) {
              current_fungible_asset_balances(
                where: {
                  owner_address: { _eq: $address }
                  asset_type: { _eq: $asset }
                }
              ) { amount }
            }`,
            variables: {
              address: addr,
              asset: SHELBYUSD_FA_METADATA_ADDRESS,
            },
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((json) => {
            const bal = json?.data?.current_fungible_asset_balances?.[0]?.amount;
            if (bal !== undefined) {
              setSusdBalance((Number(bal) / 1e6).toFixed(2));
            } else {
              setSusdBalance("0.00");
            }
          })
          .catch(() => setSusdBalance("0.00"));
      });
  }, [connected, account?.address]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"] },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    disabled: progress.stage !== "idle" && progress.stage !== "error",
  });

  const handleUpload = async () => {
    if (!file || !title.trim() || !connected || !account) return;

    try {
      // Step 1: Wallet transaction — user signs a ShelbyUSD storage fee payment
      setProgress({
        stage: "confirming",
        progress: 5,
        message: "Please sign the upload authorization in your wallet...",
      });

      const nonce = Date.now().toString();
      const signResult = await signMessage({
        message: `ShelbyStream Upload Authorization\n\nTitle: ${title.trim()}\nWallet: ${account.address.toString()}\nTimestamp: ${nonce}`,
        nonce,
      });

      const signature =
        typeof signResult === "object" && signResult !== null && "signature" in signResult
          ? String(signResult.signature)
          : String(signResult);

      toast.success("Upload authorized!");

      // Step 2: Proceed with server-side upload
      setProgress({ stage: "transcoding", progress: 20, message: "Starting upload..." });

      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("tags", tags);
      formData.append("creatorAddress", account.address.toString());
      formData.append("signature", signature);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let finalVideoId: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/m);
          if (!match) continue;
          const event = JSON.parse(match[1]) as {
            stage: UploadProgress["stage"];
            message: string;
            videoId?: string;
          };

          if (event.videoId) finalVideoId = event.videoId;

          if (event.stage === "error") {
            throw new Error(event.message);
          }

          setProgress({
            stage: event.stage,
            progress: STAGE_PROGRESS[event.stage],
            message: event.message,
          });
        }
      }

      if (!finalVideoId) throw new Error("Upload completed but no video ID returned");

      setProgress({ stage: "done", progress: 100, message: "Upload complete!" });
      toast.success("Video uploaded successfully!");

      setTimeout(() => {
        router.push(`/watch/${account.address}/${finalVideoId}`);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setProgress({ stage: "error", progress: 0, message, error: message });
      toast.error(message);
    }
  };

  const isUploading =
    progress.stage !== "idle" &&
    progress.stage !== "done" &&
    progress.stage !== "error";

  const canUpload =
    !!file && title.trim().length > 0 && connected && !isUploading;

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-brand mx-auto flex items-center justify-center mb-6 glow-brand">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect your wallet</h2>
        <p className="text-muted-foreground">
          You need to connect your Petra wallet to upload videos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Upload Video</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Your video will be transcoded, stored on Shelby Protocol, and registered on Aptos.
        </p>
      </div>

      <div className="space-y-6">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-primary bg-brand-muted"
              : "border-border hover:border-primary/50 hover:bg-surface",
            file && "border-primary/40 bg-surface",
            isUploading && "cursor-not-allowed opacity-60"
          )}
        >
          <input {...getInputProps()} />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center">
                <FileVideo className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="ml-auto p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm mb-1">
                {isDragActive ? "Drop your video here" : "Drag & drop your video"}
              </p>
              <p className="text-xs text-muted-foreground">
                MP4, MOV, AVI, MKV, WebM · Max 2GB
              </p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a title..."
              className="bg-surface border-border focus-visible:border-primary/50"
              disabled={isUploading}
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your video..."
              className="bg-surface border-border focus-visible:border-primary/50 resize-none"
              rows={3}
              disabled={isUploading}
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="web3, aptos, shelby (comma separated)"
              className="bg-surface border-border focus-visible:border-primary/50"
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Wallet Balance & Fee */}
        {connected && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">ShelbyUSD:</span>
                <span className="text-sm font-mono font-medium">
                  {susdBalance ?? "..."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">APT:</span>
                <span className="text-sm font-mono font-medium">
                  {aptBalance ?? "..."}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Wallet signature required
            </div>
          </div>
        )}

        {/* Progress */}
        {progress.stage !== "idle" && (
          <div className="space-y-3 p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{STAGE_LABELS[progress.stage]}</span>
              {progress.stage !== "error" && (
                <span className="text-muted-foreground font-mono text-xs">
                  {STAGE_PROGRESS[progress.stage]}%
                </span>
              )}
            </div>
            {progress.stage !== "error" && (
              <Progress
                value={STAGE_PROGRESS[progress.stage]}
                className="h-1.5 bg-border"
              />
            )}
            {progress.stage === "done" && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Redirecting to your video...
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {progress.stage === "error" && (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{progress.error}</AlertDescription>
          </Alert>
        )}

        {/* Submit */}
        <Button
          onClick={handleUpload}
          disabled={!canUpload}
          className="w-full h-11 gradient-brand text-white border-0 hover:opacity-90 glow-brand disabled:opacity-40 disabled:cursor-not-allowed"
          size="lg"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {STAGE_LABELS[progress.stage]}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Video
            </span>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Uploading requires wallet authorization. You&apos;ll sign a message to
          confirm your upload. Need tokens for gas?{" "}
          <a href="/faucet" className="text-primary hover:underline">
            Get from faucet
          </a>
        </p>
      </div>
    </div>
  );
}
