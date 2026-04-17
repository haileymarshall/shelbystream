import { NextRequest } from "next/server";
import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { join, extname } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { del } from "@vercel/blob";

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  const videoId = randomUUID();
  const workDir = join(tmpdir(), `shelby-${videoId}`);

  const { blobUrl, filename, title, description, tags, creatorAddress } =
    (await req.json()) as {
      blobUrl: string;
      filename?: string;
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

  const ext =
    (extname(filename ?? "") || extname(new URL(blobUrl).pathname) || ".mp4").toLowerCase();
  const videoFileName = `video${ext}`;
  const videoBlobPath = `videos/${videoId}/${videoFileName}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(
        stage: string,
        message: string,
        extra: { videoId?: string; creatorAddress?: string } = {}
      ) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ stage, message, ...extra })}\n\n`
          )
        );
      }

      try {
        send("transcoding", "Downloading video from storage...");

        await mkdir(workDir, { recursive: true });
        const inputPath = join(workDir, `input${ext}`);

        const videoRes = await fetch(blobUrl, {
          headers: process.env.BLOB_READ_WRITE_TOKEN
            ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
            : {},
        });
        if (!videoRes.ok) {
          throw new Error(`Failed to download video from blob: ${videoRes.status}`);
        }
        const videoBytes = await videoRes.arrayBuffer();
        const videoBuffer = Buffer.from(videoBytes);
        await writeFile(inputPath, videoBuffer);

        send("encoding", "Extracting thumbnail...");

        let thumbnailBuffer: Buffer | null = null;
        try {
          const ffmpegBin = join(
            process.cwd(),
            "node_modules",
            "ffmpeg-static",
            process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
          );
          const { existsSync, chmodSync } = await import("fs");
          if (existsSync(ffmpegBin)) {
            if (process.platform !== "win32") chmodSync(ffmpegBin, 0o755);
            const { spawn } = await import("child_process");
            const thumbnailPath = join(workDir, "thumbnail.jpg");
            await new Promise<void>((resolve, reject) => {
              const proc = spawn(
                ffmpegBin,
                [
                  "-y",
                  "-i",
                  inputPath,
                  "-ss",
                  "1",
                  "-vframes",
                  "1",
                  "-q:v",
                  "2",
                  thumbnailPath,
                ],
                { stdio: "ignore" }
              );
              proc.on("error", reject);
              proc.on("close", (code) =>
                code === 0
                  ? resolve()
                  : reject(new Error(`ffmpeg exited with code ${code}`))
              );
            });
            thumbnailBuffer = await readFile(thumbnailPath);
          }
        } catch (err) {
          console.error("Thumbnail extraction failed, continuing without:", err);
        }

        const privateKey = process.env.APTOS_PRIVATE_KEY;
        if (!privateKey) throw new Error("APTOS_PRIVATE_KEY not configured");

        const { getShelbyNodeClient } = await import("@/lib/shelby-server");
        const { client, account } = await getShelbyNodeClient(privateKey);
        const expirationMicros = (Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000;

        send("uploading", "Uploading video to Shelby...");

        const blobs: { blobData: Buffer; blobName: string }[] = [
          { blobData: videoBuffer, blobName: videoBlobPath },
        ];
        if (thumbnailBuffer) {
          blobs.push({
            blobData: thumbnailBuffer,
            blobName: `videos/${videoId}/thumbnail.jpg`,
          });
        }

        await client.batchUpload({ blobs, signer: account, expirationMicros });

        send("registering", "Registering metadata on Shelby...");

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
          qualities: ["original"],
          thumbnailBlob: thumbnailBuffer
            ? `videos/${videoId}/thumbnail.jpg`
            : "",
          blobName: videoBlobPath,
        };

        const metadataBuffer = Buffer.from(JSON.stringify(metadataBlob));
        await client.upload({
          blobData: metadataBuffer,
          signer: account,
          blobName: `videos/${videoId}/metadata.json`,
          expirationMicros,
        });

        send("done", "Upload complete!", {
          videoId,
          creatorAddress: account.accountAddress.toString(),
        });
      } catch (err) {
        console.error("Upload error:", err);
        const message = err instanceof Error ? err.message : "Upload failed";
        send("error", message);
      } finally {
        await rm(workDir, { recursive: true, force: true }).catch(() => {});
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
