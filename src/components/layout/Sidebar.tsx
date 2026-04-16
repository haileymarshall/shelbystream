"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Upload,
  LayoutDashboard,
  User,
  Zap,
  TrendingUp,
  Clock,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const mainLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/?sort=trending", label: "Trending", icon: TrendingUp },
  { href: "/?sort=recent", label: "Recent", icon: Clock },
];

const creatorLinks = [
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faucet", label: "Faucet", icon: Droplets },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { account, connected } = useWallet();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-60 hidden lg:flex flex-col border-r border-border bg-background/80 backdrop-blur-sm overflow-y-auto py-4 px-3">
      {/* Main nav */}
      <nav className="space-y-0.5">
        {mainLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-brand-muted text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="my-4 border-t border-border" />

      {/* Creator */}
      <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Creator
      </p>
      <nav className="space-y-0.5">
        {creatorLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-brand-muted text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {connected && account?.address && (
          <Link
            href={`/channel/${account.address}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/channel")
                ? "bg-brand-muted text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            )}
          >
            <User className="w-4 h-4 shrink-0" />
            My Channel
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-5 h-5 rounded gradient-brand flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" fill="white" />
          </div>
          <div>
            <p className="text-xs font-medium gradient-text">ShelbyStream</p>
            <p className="text-xs text-muted-foreground">Powered by Shelby Protocol</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
