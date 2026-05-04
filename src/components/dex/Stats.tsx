import { STATS, TOKENS } from "@/lib/dex-data";
import { Activity, Droplets, Repeat, TrendingUp } from "lucide-react";
import { TokenIcon } from "./TokenIcon";

const fmt = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(1)}K`);

export const Stats = () => {
  const cards = [
    { label: "Total value locked", value: fmt(STATS.tvl), icon: Droplets, change: "+12.4%" },
    { label: "24h volume", value: fmt(STATS.volume24h), icon: Activity, change: "+8.1%" },
    { label: "24h trades", value: STATS.trades24h.toLocaleString(), icon: Repeat, change: "+24.0%" },
    { label: "Active pairs", value: STATS.pairs.toString(), icon: TrendingUp, change: "+2" },
  ];
  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 animate-fade-up">
      <div>
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.035em]">Protocol</h2>
        <p className="text-muted-foreground text-sm mt-1">Real-time analytics for Silverway on LitVM.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="panel rounded-2xl p-5 hover:border-border transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-8 rounded-lg bg-secondary/80 border border-border/60 flex items-center justify-center">
                <c.icon className="h-3.5 w-3.5 text-foreground/70" />
              </div>
              <span className="text-[11px] font-mono text-success">{c.change}</span>
            </div>
            <div className="text-2xl font-semibold tracking-tight">{c.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1 uppercase font-mono tracking-wider">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="panel rounded-2xl p-2">
        <div className="px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">Top tokens</h3>
          <span className="text-[10px] uppercase font-mono tracking-[0.18em] text-muted-foreground">By volume</span>
        </div>
        <div className="hairline mb-1" />
        <div>
          {TOKENS.slice(0, 5).map((t, i) => (
            <div key={t.symbol} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-muted-foreground w-5">{String(i + 1).padStart(2, "0")}</span>
                <TokenIcon symbol={t.symbol} size={36} />
                <div>
                  <div className="font-medium">{t.symbol}</div>
                  <div className="text-[11px] text-muted-foreground">{t.name}</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="font-medium">${t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="text-[11px] text-success">+{(Math.random() * 8 + 1).toFixed(2)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
