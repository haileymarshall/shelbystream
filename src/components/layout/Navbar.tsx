"use client";

import Link from "next/link";
import { Search, Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WalletButton from "@/components/wallet/WalletButton";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-border flex items-center px-4 gap-4">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 shrink-0 group"
      >
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center glow-brand group-hover:scale-105 transition-transform">
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <span className="font-bold text-lg tracking-tight hidden sm:block gradient-text">
          ShelbyStream
        </span>
      </Link>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex-1 max-w-xl mx-auto flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos..."
            className="pl-9 bg-surface border-border focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 h-9"
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="h-9 px-4 hidden sm:flex"
        >
          Search
        </Button>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          render={<Link href="/upload" />}
          nativeButton={false}
          size="sm"
          className="h-9 gradient-brand text-white border-0 hover:opacity-90 glow-brand hidden sm:flex"
        >
          <Upload className="w-4 h-4 mr-1.5" />
          Upload
        </Button>
        <WalletButton />
      </div>
    </header>
  );
}
