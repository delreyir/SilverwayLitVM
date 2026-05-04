import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { Link, NavLink } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const NAV = [
  { to: "/", label: "Swap", end: true },
  { to: "/pools", label: "Pools" },
  { to: "/bridge", label: "Bridge" },
  { to: "/stats", label: "Stats" },
  { to: "/dashboard", label: "Portfolio" },
];

export const Header = () => {
  const { isConnected, profile, loading, connect, disconnect } = useWalletAuth();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!profile?.wallet_address) return;
    await navigator.clipboard.writeText(profile.wallet_address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-2xl">
      <div className="absolute inset-x-0 bottom-0 hairline" />
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="Silverway home">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200 ${
                    isActive
                      ? "text-foreground bg-secondary/80 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.06)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            <span className="text-[11px] font-mono text-muted-foreground tracking-wide">LiteForge</span>
          </div>

          {isConnected && profile?.wallet_address ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="font-mono text-[13px] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/60 hover:border-border transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {shortAddr(profile.wallet_address)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 panel border-border/80">
                <div className="px-3 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-1.5">Connected</div>
                  <div className="font-mono text-xs break-all text-foreground/90">{profile.wallet_address}</div>
                  {profile.chain_id && (
                    <div className="text-[11px] text-muted-foreground mt-2 font-mono">
                      Chain · <span className="text-foreground">{profile.chain_id}</span>
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/dashboard">Portfolio</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyAddress} className="gap-2 cursor-pointer">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy address
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={disconnect}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={connect}
              disabled={loading}
              className="btn-silver h-9 px-4 rounded-full font-medium text-[13px] gap-1.5"
            >
              <Wallet className="h-3.5 w-3.5" />
              {loading ? "Signing…" : "Connect"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
