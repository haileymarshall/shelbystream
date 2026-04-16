import UploadPage from "@/components/upload/UploadPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Video",
};

export default function Upload() {
  return <UploadPage />;
}
