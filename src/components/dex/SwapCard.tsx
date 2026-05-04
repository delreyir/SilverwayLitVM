import { useMemo, useState } from "react";
import { ArrowDown, Settings2, Loader2 } from "lucide-react";
import { TokenSelect } from "./TokenSelect";
import { TOKEN_REGISTRY, getToken } from "@/lib/chain";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useSwap, useSwapQuote } from "@/hooks/useSwap";
import { isDexDeployed } from "@/lib/dex-config";
import { toast } from "sonner";

export const SwapCard = () => {
  const { profile, isConnected, connect, loading: authLoading } = useWalletAuth();
  const addr = profile?.wallet_address ?? null;

  const [from, setFrom] = useState(TOKEN_REGISTRY[0].symbol);
  const [to, setTo] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);

  const fromToken = getToken(from);
  const toToken = getToken(to);

  const { balance: fromBalance } = useTokenBalance(from, addr);
  const { balance: toBalance } = useTokenBalance(to, addr);

  const fromPrice = fromToken.priceUsd ?? 0;
  const toPrice = toToken.priceUsd ?? 1;
  const fallbackRate = useMemo(() => fromPrice / toPrice, [fromPrice, toPrice]);

  // On-chain quote (only if router is deployed). Falls back to USD-price estimate.
  const onChain = isDexDeployed();
  const { quote, loading: quoting } = useSwapQuote(from, to, amount, slippage);
  const { swap, pending: swapping } = useSwap();

  const output = onChain && quote
    ? parseFloat(quote.amountOut).toFixed(6)
    : amount ? (parseFloat(amount) * fallbackRate * (1 - 0.003)).toFixed(6) : "";
  const rate = onChain && quote && amount
    ? parseFloat(quote.amountOut) / parseFloat(amount)
    : fallbackRate;
  const usdValue = amount ? parseFloat(amount) * fromPrice : 0;
  const minReceived = onChain && quote
    ? parseFloat(quote.minOut).toFixed(6)
    : output ? (parseFloat(output) * (1 - slippage / 100)).toFixed(6) : "0";

  const flip = () => {
    setFrom(to);
    setTo(from);
    setAmount(output || "");
  };

  return (
    <div className="relative w-full max-w-[440px] mx-auto">
      {/* Soft chrome glow behind card */}
      <div className="absolute -inset-px rounded-[28px] bg-gradient-to-b from-foreground/[0.08] via-transparent to-transparent" />

      <div className="relative panel rounded-[28px] p-5">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5 pl-1">
          <h2 className="font-semibold text-[17px] tracking-tight">Swap</h2>
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-secondary/60 border border-border/50">
            {[0.1, 0.5, 1].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-full transition-all ${
                  slippage === s
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}%
              </button>
            ))}
            <button className="ml-0.5 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors">
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* From */}
        <div className="rounded-2xl bg-secondary/40 border border-border/50 p-4 transition-colors hover:bg-secondary/60">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-2 font-mono uppercase tracking-wider">
            <span>Pay</span>
            <button
              onClick={() => setAmount(fromBalance)}
              className="hover:text-foreground transition-colors normal-case"
            >
              {parseFloat(fromBalance).toFixed(4)} <span className="text-foreground font-semibold">MAX</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-[34px] font-medium tracking-tight outline-none placeholder:text-muted-foreground/30 min-w-0"
            />
            <TokenSelect value={from} onChange={setFrom} exclude={to} />
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-mono">
            ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Flip */}
        <div className="flex justify-center -my-2.5 relative z-10">
          <button
            onClick={flip}
            className="h-9 w-9 rounded-xl bg-card border-[3px] border-background hover:bg-foreground hover:text-background transition-all duration-300 flex items-center justify-center group"
          >
            <ArrowDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
          </button>
        </div>

        {/* To */}
        <div className="rounded-2xl bg-secondary/40 border border-border/50 p-4 transition-colors hover:bg-secondary/60">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-2 font-mono uppercase tracking-wider">
            <span>Receive</span>
            <span className="normal-case">{parseFloat(toBalance).toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              readOnly
              value={output}
              placeholder="0"
              className="flex-1 bg-transparent text-[34px] font-medium tracking-tight outline-none placeholder:text-muted-foreground/30 min-w-0"
            />
            <TokenSelect value={to} onChange={setTo} exclude={from} />
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-mono">
            ${(parseFloat(output || "0") * toPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Route info */}
        {amount && (
          <div className="mt-3 px-1 space-y-1.5 text-[11px] font-mono">
            <Row label="Rate" value={`1 ${from} = ${rate.toFixed(4)} ${to}`} />
            <Row label={`Min received (${slippage}%)`} value={`${minReceived} ${to}`} />
            <Row label="Fee (0.3%)" value={`${(parseFloat(amount) * 0.003).toFixed(6)} ${from}`} />
            <Row label="Network" value="LitVM" highlight />
          </div>
        )}

        {!isConnected ? (
          <button
            onClick={connect}
            disabled={authLoading}
            className="btn-silver w-full mt-4 h-12 rounded-2xl text-[14px] font-medium tracking-tight inline-flex items-center justify-center gap-2"
          >
            {authLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {authLoading ? "Signing…" : "Connect wallet"}
          </button>
        ) : (
          <button
            onClick={async () => {
              if (!onChain) {
                toast.info("On-chain router pending", {
                  description: "Deploy V2 contracts (see /contracts) and fill src/lib/dex-config.ts.",
                });
                return;
              }
              if (!quote || !addr) return;
              await swap({
                fromSym: from,
                toSym: to,
                amountIn: amount,
                minOutWei: quote.minOutWei,
                account: addr as `0x${string}`,
              });
            }}
            disabled={!amount || parseFloat(amount) <= 0 || swapping || (onChain && (quoting || !quote))}
            className="btn-silver w-full mt-4 h-12 rounded-2xl text-[14px] font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {swapping && <Loader2 className="h-4 w-4 animate-spin" />}
            {!amount
              ? "Enter an amount"
              : swapping
              ? "Swapping…"
              : onChain && quoting
              ? "Quoting…"
              : "Swap"}
          </button>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={highlight ? "text-foreground" : "text-foreground/80"}>{value}</span>
  </div>
);
