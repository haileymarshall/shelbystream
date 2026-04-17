import { handleUpload, type HandleUploadBody } from "@vercel/blob/next";
import { NextRequest } from "next/server";

// Generates a client-side upload token for Vercel Blob.
// The browser calls this first, then uploads the video directly to Blob
// (bypassing the 4.5 MB function body limit) using the returned token.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
        "video/webm",
        "video/*",
      ],
      maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    }),
    onUploadCompleted: async () => {
      // No-op — processing is triggered separately by the client.
    },
  });

  return Response.json(jsonResponse);
}
