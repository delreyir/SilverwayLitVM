import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";
import { TOKEN_REGISTRY, getToken, type TokenMeta } from "@/lib/chain";
import { TokenIcon } from "./TokenIcon";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWalletAuth } from "@/hooks/useWalletAuth";

const Row = ({
  token,
  address,
  onPick,
}: {
  token: TokenMeta;
  address?: string | null;
  onPick: () => void;
}) => {
  const { balance } = useTokenBalance(token.symbol, address);
  const num = parseFloat(balance);
  const usd = (num * (token.priceUsd ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <button
      onClick={onPick}
      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 transition-colors"
    >
      <div className="flex items-center gap-3">
        <TokenIcon symbol={token.symbol} size={36} />
        <div className="text-left">
          <div className="font-medium text-[14px]">{token.symbol}</div>
          <div className="text-[11px] text-muted-foreground">{token.name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[13px]">
          {num.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </div>
        <div className="text-[11px] text-muted-foreground font-mono">${usd}</div>
      </div>
    </button>
  );
};

export const TokenSelect = ({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (s: string) => void;
  exclude?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { profile } = useWalletAuth();
  const addr = profile?.wallet_address ?? null;

  const token = getToken(value);
  const filtered = TOKEN_REGISTRY.filter(
    (t) =>
      t.symbol !== exclude &&
      (t.symbol.toLowerCase().includes(q.toLowerCase()) ||
        t.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-card border border-border/60 hover:border-border transition-colors">
          <TokenIcon symbol={token.symbol} size={26} />
          <span className="font-medium text-[14px]">{token.symbol}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md panel border-border/80">
        <DialogHeader>
          <DialogTitle className="font-semibold tracking-tight">Select a token</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or symbol"
            className="pl-9 bg-secondary/60 border-border/50 rounded-xl h-10"
          />
        </div>
        <div className="max-h-80 overflow-y-auto -mx-6 px-2">
          {filtered.map((t) => (
            <Row
              key={t.symbol}
              token={t}
              address={addr}
              onPick={() => {
                onChange(t.symbol);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
