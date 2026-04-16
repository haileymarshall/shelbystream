import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/providers/Providers";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ShelbyStream",
    template: "%s · ShelbyStream",
  },
  description:
    "Decentralized video streaming powered by Shelby Protocol on Aptos. Upload, stream, and monetize your content — fully on-chain.",
  keywords: ["decentralized", "video streaming", "Shelby", "Aptos", "Web3"],
  openGraph: {
    title: "ShelbyStream",
    description: "Decentralized video streaming on Shelby Protocol",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Providers>
          <Navbar />
          <div className="flex flex-1 pt-14">
            <Sidebar />
            <main className="flex-1 min-w-0 lg:ml-60">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
