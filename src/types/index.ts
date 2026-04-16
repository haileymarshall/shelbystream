export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  creator: string;
  duration: number;
  uploadedAt: number;
  qualities: string[];
  thumbnailBlob: string;
  blobName: string;
  viewCount?: number;
  tags?: string[];
}

export interface BlobInfo {
  blobName: string;
  size: number;
  expirationMicros: number;
  createdAt?: number;
}

export interface UploadProgress {
  stage: "idle" | "confirming" | "transcoding" | "encoding" | "registering" | "uploading" | "done" | "error";
  progress: number;
  message: string;
  error?: string;
}

export interface WalletState {
  address: string | null;
  connected: boolean;
  connecting: boolean;
}
