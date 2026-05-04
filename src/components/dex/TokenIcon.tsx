import { getToken, TOKEN_REGISTRY } from "@/lib/chain";

export const TokenIcon = ({ symbol, size = 32 }: { symbol: string; size?: number }) => {
  const token = TOKEN_REGISTRY.find((t) => t.symbol === symbol) ?? getToken(symbol);
  if (!token) return null;
  return (
    <div
      className="relative flex items-center justify-center rounded-full text-foreground font-semibold ring-1 ring-border/80 overflow-hidden"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background:
          "radial-gradient(circle at 30% 25%, hsl(0 0% 22%), hsl(0 0% 8%) 70%)",
      }}
    >
      <span className="relative z-10 text-silver">{token.icon}</span>
      <span
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(0 0% 100% / 0.15), transparent 60%)",
        }}
      />
    </div>
  );
};
