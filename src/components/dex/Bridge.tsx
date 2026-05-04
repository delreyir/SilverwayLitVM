import { useState } from "react";
import { ArrowRight, Shield, Zap } from "lucide-react";
import { toast } from "sonner";

export const Bridge = () => {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"to" | "from">("to");

  const fromChain = direction === "to" ? "Litecoin" : "LitVM";
  const toChain = direction === "to" ? "LitVM" : "Litecoin";

  return (
    <div className="w-full max-w-[440px] mx-auto animate-fade-up">
      <div className="panel rounded-[28px] p-6">
        <h2 className="text-[22px] font-semibold tracking-tight">Grail Bridge</h2>
        <p className="text-[13px] text-muted-foreground mb-6">Trustless ZK bridge powered by BitcoinOS.</p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 mb-5">
          <div className="rounded-2xl bg-secondary/40 border border-border/50 p-3.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">From</div>
            <div className="font-medium">{fromChain}</div>
          </div>
          <button
            onClick={() => setDirection(direction === "to" ? "from" : "to")}
            className="h-9 w-9 rounded-xl bg-card border border-border hover:bg-foreground hover:text-background transition-all flex items-center justify-center"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="rounded-2xl bg-secondary/40 border border-border/50 p-3.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">To</div>
            <div className="font-medium">{toChain}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-secondary/40 border border-border/50 p-4 mb-4">
          <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">Amount (LTC)</div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-[34px] font-medium tracking-tight outline-none placeholder:text-muted-foreground/30"
          />
        </div>

        <div className="space-y-1.5 mb-5 text-[11px] font-mono">
          <Row icon={<Shield className="h-3 w-3" />} label="Security" value="ZK Proofs · Trustless" />
          <Row icon={<Zap className="h-3 w-3" />} label="Est. time" value="~ 12 min" />
          <Row label="Bridge fee" value="0.05%" />
        </div>

        <button
          onClick={() => toast.success("Bridge initiated", { description: `${amount} LTC ${fromChain} → ${toChain}` })}
          disabled={!amount}
          className="btn-silver w-full h-12 rounded-2xl text-[14px] font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {amount ? `Bridge ${amount} LTC` : "Enter an amount"}
        </button>
      </div>
    </div>
  );
};

const Row = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between px-1 py-1">
    <span className="text-muted-foreground inline-flex items-center gap-1.5">{icon}{label}</span>
    <span className="text-foreground/90">{value}</span>
  </div>
);
