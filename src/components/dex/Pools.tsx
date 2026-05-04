import { POOLS } from "@/lib/dex-data";
import { TokenIcon } from "./TokenIcon";
import { TrendingUp, Plus } from "lucide-react";

const fmt = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(1)}K`);

export const Pools = () => (
  <div className="w-full max-w-5xl mx-auto animate-fade-up">
    <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
      <div>
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.035em]">Liquidity</h2>
        <p className="text-muted-foreground text-sm mt-1">Earn fees by providing liquidity to LitVM pools.</p>
      </div>
      <button className="btn-silver h-10 px-4 rounded-full text-[13px] font-medium inline-flex items-center gap-1.5">
        <Plus className="h-4 w-4" /> New position
      </button>
    </div>

    <div className="panel rounded-2xl overflow-hidden">
      <div className="hidden md:grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono border-b border-border/60">
        <div className="col-span-4">Pool</div>
        <div className="col-span-2 text-right">Fee</div>
        <div className="col-span-2 text-right">TVL</div>
        <div className="col-span-2 text-right">24h Volume</div>
        <div className="col-span-2 text-right">APR</div>
      </div>
      {POOLS.map((p, i) => (
        <div
          key={i}
          className="grid grid-cols-2 md:grid-cols-12 gap-2 px-6 py-4 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border/40 last:border-0"
        >
          <div className="col-span-2 md:col-span-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              <TokenIcon symbol={p.pair[0]} size={32} />
              <TokenIcon symbol={p.pair[1]} size={32} />
            </div>
            <div className="font-medium">{p.pair[0]} / {p.pair[1]}</div>
          </div>
          <div className="col-span-2 md:col-span-2 md:text-right">
            <span className="md:hidden text-[10px] uppercase font-mono text-muted-foreground mr-2">Fee</span>
            <span className="font-mono text-sm">{p.fee}%</span>
          </div>
          <div className="col-span-1 md:col-span-2 md:text-right">
            <div className="md:hidden text-[10px] uppercase font-mono text-muted-foreground">TVL</div>
            <span className="font-mono">{fmt(p.tvl)}</span>
          </div>
          <div className="col-span-1 md:col-span-2 md:text-right">
            <div className="md:hidden text-[10px] uppercase font-mono text-muted-foreground">Volume</div>
            <span className="font-mono">{fmt(p.volume24h)}</span>
          </div>
          <div className="col-span-2 md:col-span-2 md:text-right flex md:justify-end items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="font-mono font-semibold text-success">{p.apr}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
