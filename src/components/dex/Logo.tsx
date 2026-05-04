export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div className="relative h-8 w-8">
      <div className="absolute inset-0 rounded-full chrome-ring opacity-90" />
      <div className="absolute inset-[2px] rounded-full bg-background flex items-center justify-center">
        <span className="text-silver font-semibold text-base leading-none">Ł</span>
      </div>
    </div>
    <div className="flex items-baseline gap-1.5 leading-none">
      <span className="font-semibold text-[17px] tracking-tight">Silverway</span>
      <span className="text-[10px] font-mono text-muted-foreground tracking-[0.2em] uppercase">LitVM</span>
    </div>
  </div>
);
