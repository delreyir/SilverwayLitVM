import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 grid-pattern opacity-60" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

    {/* Chrome orb */}
    <div className="absolute left-1/2 -translate-x-1/2 top-32 h-[480px] w-[480px] rounded-full bg-gradient-to-b from-foreground/[0.08] to-transparent blur-3xl pointer-events-none" />

    <div className="container relative pt-20 pb-16 md:pt-32 md:pb-24">
      <div className="max-w-4xl mx-auto text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/60 border border-border/60 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-8">
          <span className="h-1 w-1 rounded-full bg-foreground/80" />
          Native AMM · LitVM LiteForge
        </div>

        <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] mb-6">
          Liquidity, refined.
          <br />
          <span className="text-silver">Built on Litecoin.</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
          A precision DEX for the Litecoin Virtual Machine. Trustless swaps,
          deep liquidity, settled by zero-knowledge.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="btn-silver h-11 px-5 rounded-full font-medium text-sm inline-flex items-center gap-1.5"
          >
            Open exchange
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <a
            href="https://docs.litvm.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-5 rounded-full font-medium text-sm inline-flex items-center gap-1.5 bg-secondary/60 border border-border/60 hover:border-border transition-colors"
          >
            Read docs
          </a>
        </div>
      </div>
    </div>

    <div className="hairline" />
  </section>
);
