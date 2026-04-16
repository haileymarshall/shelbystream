"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Copy, ExternalLink, Wallet } from "lucide-react";
import { shortenAddress } from "@/lib/metadata";
import { toast } from "sonner";
import Link from "next/link";

export default function WalletButton() {
  const { connect, disconnect, account, connected, isLoading, wallets } =
    useWallet();

  const handleConnect = () => {
    const petra = wallets?.find((w) => w.name === "Petra");
    if (petra) {
      connect(petra.name);
    } else {
      // Fallback: connect first available
      if (wallets?.[0]) connect(wallets[0].name);
      else toast.error("No wallet found. Please install Petra wallet.");
    }
  };

  const handleCopy = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      toast.success("Address copied!");
    }
  };

  if (!connected || !account) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        size="sm"
        variant="outline"
        className="h-9 border-border hover:border-primary/50 hover:bg-brand-muted hover:text-primary transition-colors"
      >
        <Wallet className="w-4 h-4 mr-1.5" />
        {isLoading ? "Connecting..." : "Connect"}
      </Button>
    );
  }

  const address = account.address.toString();
  const shortAddr = shortenAddress(address);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-border hover:border-primary/50 gap-2"
        />
      }>
        <Avatar className="h-5 w-5">
          <AvatarFallback className="text-[10px] gradient-brand text-white">
            {address.slice(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-mono text-xs hidden sm:block">{shortAddr}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground">Connected as</p>
          <p className="font-mono text-sm mt-0.5 text-foreground">{shortAddr}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={handleCopy}
          className="gap-2 cursor-pointer hover:bg-surface"
        >
          <Copy className="w-4 h-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href={`/channel/${address}`} />}
          className="gap-2 cursor-pointer hover:bg-surface"
        >
          <ExternalLink className="w-4 h-4" />
          My Channel
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="gap-2 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
