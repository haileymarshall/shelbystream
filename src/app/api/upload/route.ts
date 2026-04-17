import { NextRequest } from "next/server";
import { writeFile, readdir, readFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { del } from "@vercel/blob";

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  const videoId = randomUUID();
  const workDir = join(tmpdir(), `shelby-${videoId}`);

  // The client uploads the raw video directly to Vercel Blob (no 4.5 MB limit),
  // then sends us the blob URL + metadata as JSON.
  const { blobUrl, title, description, tags, creatorAddress } =
    (await req.json()) as {
      blobUrl: string;
      title: string;
      description: string;
      tags: string;
      creatorAddress: string;
    };

  if (!blobUrl || !creatorAddress) {
    return new Response(
      JSON.stringify({ error: "Missing blob URL or creator address" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(stage: string, message: string, videoId?: string) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ stage, message, videoId })}\n\n`
          )
        );
      }

      try {
        send("transcoding", "Downloading video from storage...");

        await mkdir(workDir, { recursive: true });
        const inputPath = join(workDir, "input.mp4");
        const outputDir = join(workDir, "output");
        await mkdir(outputDir, { recursive: true });

        // Download the raw video from Vercel Blob.
        // Public-access blobs are fetched directly; private blobs require the token header.
        const videoRes = await fetch(blobUrl, {
          headers: process.env.BLOB_READ_WRITE_TOKEN
            ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
            : {},
        });
        if (!videoRes.ok) {
          throw new Error(`Failed to download video from blob: ${videoRes.status}`);
        }
        const videoBytes = await videoRes.arrayBuffer();
        await writeFile(inputPath, Buffer.from(videoBytes));

        send("transcoding", "Transcoding to HLS...");

        const { join: pathJoin } = await import("path");
        const ffmpegBin = pathJoin(
          process.cwd(),
          "node_modules",
          "ffmpeg-static",
          process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
        );
        const { existsSync, chmodSync } = await import("fs");
        if (!existsSync(ffmpegBin))
          throw new Error(`ffmpeg binary not found at ${ffmpegBin}`);

        // Ensure the binary is executable — Vercel does not preserve file permissions.
        if (process.platform !== "win32") {
          chmodSync(ffmpegBin, 0o755);
        }

        const { spawn } = await import("child_process");
        const { mapNamesToDirs } = await import(
          "@shelby-protocol/media-prepare/node"
        );
        const { hlsCmaf } = await import("@shelby-protocol/media-prepare/core");

        const builder = hlsCmaf
          .planHlsCmaf()
          .input(inputPath)
          .outputDir(outputDir)
          .withLadder(hlsCmaf.presets.vodHd_1080p)
          .withVideoEncoder(hlsCmaf.x264({ preset: "fast" }))
          .withAudio(hlsCmaf.aac(), {
            language: "en",
            bitrateBps: 128_000,
            default: true,
          })
          .withSegmentsFixed(6)
          .hlsCmaf();

        const { args, variantNames } = builder.render.ffmpegArgs();

        const dirs = mapNamesToDirs(outputDir, variantNames);
        await Promise.all(dirs.map((d) => mkdir(d, { recursive: true })));

        await new Promise<void>((resolve, reject) => {
          const proc = spawn(ffmpegBin, args, {
            stdio: "ignore",
            cwd: outputDir,
          });
          proc.on("error", reject);
          proc.on("close", (code) =>
            code === 0
              ? resolve()
              : reject(new Error(`ffmpeg exited with code ${code}`))
          );
        });

        const thumbnailPath = join(outputDir, "thumbnail.jpg");
        await new Promise<void>((resolve, reject) => {
          const proc = spawn(
            ffmpegBin,
            ["-i", inputPath, "-ss", "1", "-vframes", "1", "-q:v", "2", thumbnailPath],
            { stdio: "ignore" }
          );
          proc.on("error", reject);
          proc.on("close", (code) =>
            code === 0
              ? resolve()
              : reject(new Error(`thumbnail extraction failed with code ${code}`))
          );
        });

        send("encoding", "Generating commitments...");

        const allFiles = await collectFiles(outputDir);

        const privateKey = process.env.APTOS_PRIVATE_KEY;
        if (!privateKey) throw new Error("APTOS_PRIVATE_KEY not configured");

        const { getShelbyNodeClient } = await import("@/lib/shelby-server");
        const { client, account } = await getShelbyNodeClient(privateKey);

        const expirationMicros = (Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000;

        send("registering", "Registering on Aptos...");

        const blobs = await Promise.all(
          allFiles.map(async (filePath) => {
            const relativePath = filePath
              .replace(outputDir + "/", "")
              .replace(outputDir + "\\", "")
              .replaceAll("\\", "/");
            const blobName = `videos/${videoId}/${relativePath}`;
            const blobData = await readFile(filePath);
            return { blobData, blobName };
          })
        );

        send("uploading", `Uploading ${blobs.length} files to Shelby...`);

        await client.batchUpload({
          blobs,
          signer: account,
          expirationMicros,
        });

        const metadataBlob = {
          title: title ?? "Untitled",
          description: description ?? "",
          tags: (tags ?? "")
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
          creator: creatorAddress,
          uploadedAt: Math.floor(Date.now() / 1000),
          duration: 0,
          qualities: ["1080p", "720p", "360p"],
          thumbnailBlob: `videos/${videoId}/thumbnail.jpg`,
          blobName: `videos/${videoId}/master.m3u8`,
        };

        const metadataBuffer = Buffer.from(JSON.stringify(metadataBlob));
        await client.upload({
          blobData: metadataBuffer,
          signer: account,
          blobName: `videos/${videoId}/metadata.json`,
          expirationMicros,
        });

        send("done", "Upload complete!", videoId);
      } catch (err) {
        console.error("Upload error:", err);
        const message = err instanceof Error ? err.message : "Upload failed";
        send("error", message);
      } finally {
        // Clean up /tmp workspace
        await rm(workDir, { recursive: true, force: true }).catch(() => {});
        // Delete the raw video from Vercel Blob — it's no longer needed
        await del(blobUrl).catch(() => {});
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}
