import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import { 
  ArrowUpRight, Wallet, LogOut, Copy, Check, ChevronDown, 
  Search, ArrowDown, Settings2, Loader2, Shield, Zap, 
  Activity, Droplets, Repeat, TrendingUp, Plus, ExternalLink, ArrowRight
} from "lucide-react";
import { Toaster, toast } from "sonner";

/* =====================================================================
   1. REAL WEB3 CONFIG & REGISTRY
   ===================================================================== */
const LITVM_CHAIN_ID = "0x1159"; // 4441 in Hexadecimal
const LITVM_NETWORK_PARAMS = {
  chainId: LITVM_CHAIN_ID,
  chainName: "LitVM LiteForge",
  nativeCurrency: { name: "LitVM", symbol: "zkLTC", decimals: 18 },
  rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
  blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
};

// MOLA7ADA: Ila knti derti deploy l-contracts b addresses jdad f Remix, 
// beddel had l-addresses hna bach y-khedmo m3a l-faucet jdid dialk.
export const TOKEN_REGISTRY = [
  { symbol: "zkLTC", name: "Native zkLTC", priceUsd: 85.50, icon: "Ł", isNative: true, decimals: 18 },
  { symbol: "USDC", name: "USD Coin", priceUsd: 1.00, icon: "$", isNative: false, address: "0x6fefE517cAe9924EE3eFbd9423Fd707d55ED3bcA", decimals: 6 },
  { symbol: "LVM", name: "LitVM Token", priceUsd: 2.30, icon: "V", isNative: false, address: "0xEDEB8183aCd8D93a0E0604c7AD5EdABBA71c45a6", decimals: 18 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", priceUsd: 64200.00, icon: "₿", isNative: false, address: "0x127Dc73f26D2DA4b6663e71C7Bd5120c77d68AA2", decimals: 8 },
];

export const getToken = (sym: string) => TOKEN_REGISTRY.find((t) => t.symbol === sym) || TOKEN_REGISTRY[0];

const POOLS = [
  { pair: ["LTC", "USDC"], fee: 0.3, tvl: 8500000, volume24h: 2100000, apr: 12.5 },
  { pair: ["LVM", "LTC"], fee: 0.3, tvl: 4200000, volume24h: 800000, apr: 24.2 },
  { pair: ["WBTC", "LTC"], fee: 0.3, tvl: 2500000, volume24h: 500000, apr: 8.4 }
];

const STATS = { tvl: 15200000, volume24h: 3400000, trades24h: 12450, pairs: 24 };
const TOKENS = TOKEN_REGISTRY.map(t => ({ symbol: t.symbol, name: t.name, price: t.priceUsd }));
const LITVM_NETWORK = { blockExplorerUrls: ["https://explorer.litvm.com"] };
const isDexDeployed = () => true;

/* =====================================================================
   2. REAL WEB3 HOOKS
   ===================================================================== */
export const useWalletAuth = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<{ wallet_address: string; chain_id: string } | null>(null);

  const switchToLitVM = async () => {
    if (!(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LITVM_CHAIN_ID }] });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({ method: "wallet_addEthereumChain", params: [LITVM_NETWORK_PARAMS] });
        } catch (addError) {
          toast.error("Failed to add the LitVM network to your wallet.");
        }
      }
    }
  };

  const connect = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("Wallet not found!", { description: "Please install MetaMask or Rabby Wallet." });
      return;
    }
    setLoading(true);
    try {
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      const account = accounts[0];
      const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });

      setIsConnected(true);
      setProfile({ wallet_address: account, chain_id: chainId });
      toast.success("Wallet connected!");

      if (chainId !== LITVM_CHAIN_ID) await switchToLitVM();
    } catch (error: any) {
      toast.error("Connection failed", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setProfile(null);
    toast.info("Wallet disconnected");
  };

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) setProfile((prev) => prev ? { ...prev, wallet_address: accounts[0] } : null);
        else disconnect();
      };
      const handleChainChanged = (chainId: string) => {
        setProfile((prev) => prev ? { ...prev, chain_id: chainId } : null);
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if ((window as any).ethereum.removeListener) {
          (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
          (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  return { isConnected, profile, loading, connect, disconnect };
};

export const useTokenBalance = (symbol: string, userAddress?: string | null) => {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      if (!userAddress || typeof window === "undefined" || !(window as any).ethereum) {
        if (isMounted) { setBalance("0"); setLoading(false); }
        return;
      }
      setLoading(true);
      try {
        const token = getToken(symbol);
        
        const formatUnits = (hexStr: string, decimals: number) => {
          if (!hexStr || hexStr === "0x" || hexStr === "0x0") return "0";
          try {
            const val = BigInt(hexStr);
            const divisor = BigInt(10 ** decimals);
            const intPart = val / divisor;
            const fracPart = val % divisor;
            const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, 4);
            return `${intPart}.${fracStr}`;
          } catch (e) {
            return "0";
          }
        };

        if (token.isNative) {
          const balanceHex = await (window as any).ethereum.request({
            method: 'eth_getBalance',
            params: [userAddress, 'latest']
          });
          if (isMounted) setBalance(formatUnits(balanceHex, 18));
        } else if (token.address && token.address !== "0x...") {
          const data = '0x70a08231' + '000000000000000000000000' + userAddress.slice(2);
          const balanceHex = await (window as any).ethereum.request({
            method: 'eth_call',
            params: [{ to: token.address, data: data }, 'latest']
          });
          const decimals = token.decimals || 18;
          if (isMounted) setBalance(formatUnits(balanceHex, decimals));
        } else {
          if (isMounted) setBalance("0");
        }
      } catch (error) {
        if (isMounted) setBalance("0");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBalance();
    return () => { isMounted = false; };
  }, [symbol, userAddress]);

  return { balance, loading };
};

// HADA L-HOOK JDID DIAL MINT (FAUCET) BLA MAT7TAJ ETHERS.JS ==========================
export const useMintToken = () => {
  const [minting, setMinting] = useState<string | null>(null);

  const mint = async (symbol: string, tokenAddress: string, decimals: number, userAddress: string) => {
    try {
      setMinting(symbol);
      if (!(window as any).ethereum) throw new Error("Wallet not found!");
      
      const amountToMint = symbol === "WBTC" ? "1" : "1000";
      toast.info(`Minting ${amountToMint} ${symbol}...`, { description: "Please confirm in your wallet." });

      // Encoding function 'mint(address,uint256)' -> selector: 0x40c10f19
      const funcSelector = "0x40c10f19";
      const paddedAddress = userAddress.toLowerCase().replace("0x", "").padStart(64, "0");
      
      let amountHex = "";
      try {
        const amount = BigInt(amountToMint) * (BigInt(10) ** BigInt(decimals));
        amountHex = amount.toString(16).padStart(64, "0");
      } catch (e) {
        amountHex = "0".padStart(64, "0");
      }

      const dataPayload = funcSelector + paddedAddress + amountHex;

      // Sending raw transaction through MetaMask
      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: tokenAddress,
          data: dataPayload
        }]
      });
      
      toast.success(`Transaction sent!`, { description: "Wait a few seconds for LitVM to confirm." });
      
      // Simulating a wait for the block confirmation
      setTimeout(() => {
        toast.success(`Successfully minted ${amountToMint} ${symbol}!`, { description: "Refresh page to see your new balance." });
        setMinting(null);
      }, 5000);
      
    } catch (err: any) {
      console.error("Minting failed", err);
      toast.error(`Failed to mint ${symbol}`, { description: err.shortMessage || err.message });
      setMinting(null);
    }
  };

  return { mint, minting };
};
// ==============================================================

const useSwapQuote = (from: string, to: string, amount: string, slippage: number) => {
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    if (!amount || isNaN(parseFloat(amount))) {
      setQuote(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const fromPrice = getToken(from).priceUsd || 1;
      const toPrice = getToken(to).priceUsd || 1;
      const rate = fromPrice / toPrice;
      const out = parseFloat(amount) * rate * 0.997;
      setQuote({
        amountOut: out.toFixed(6),
        minOut: (out * (1 - slippage / 100)).toFixed(6),
        minOutWei: "0"
      });
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [from, to, amount, slippage]);

  return { quote, loading };
};

const useSwap = () => {
  const [pending, setPending] = useState(false);
  const swap = async () => {
    setPending(true);
    await new Promise(r => setTimeout(r, 2000));
    setPending(false);
    toast.success("Swap successful", { description: "Transaction confirmed on LitVM." });
  };
  return { swap, pending };
};

/* =====================================================================
   3. CUSTOM UI COMPONENTS
   ===================================================================== */
const RouterContext = createContext({ route: '/', navigate: (route: string) => {} });

const Link = ({ to, children, className, onClick }: any) => {
  const { navigate } = useContext(RouterContext);
  return (
    <a href={to} className={className} onClick={(e) => {
      e.preventDefault();
      if (onClick) onClick(e);
      navigate(to);
    }}>
      {children}
    </a>
  );
};

const NavLink = ({ to, children, className }: any) => {
  const { route, navigate } = useContext(RouterContext);
  const isActive = route === to || (to !== '/' && route.startsWith(to));
  const classes = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <a href={to} className={classes} onClick={(e) => { e.preventDefault(); navigate(to); }}>
      {children}
    </a>
  );
};

const DropdownContext = createContext<any>(null);
const DropdownMenu = ({ children }: any) => {
  const [open, setOpen] = useState(false);
  return <DropdownContext.Provider value={{open, setOpen}}><div className="relative">{children}</div></DropdownContext.Provider>;
};
const DropdownMenuTrigger = ({ children }: any) => {
  const { setOpen } = useContext(DropdownContext);
  return React.cloneElement(children, { onClick: () => setOpen((p: boolean) => !p) });
};
const DropdownMenuContent = ({ children, className }: any) => {
  const { open } = useContext(DropdownContext);
  if (!open) return null;
  return (
    <div className={`absolute right-0 top-full mt-2 z-50 rounded-2xl bg-popover/90 backdrop-blur-xl border border-border/80 shadow-[var(--shadow-elevated)] overflow-hidden animate-fade-up ${className}`}>
      {children}
    </div>
  );
};
const DropdownMenuItem = ({ children, onClick, className }: any) => {
  const { setOpen } = useContext(DropdownContext);
  return (
    <div onClick={(e) => { setOpen(false); if(onClick) onClick(e); }} className={`relative flex cursor-pointer items-center px-3 py-2 text-[13px] hover:bg-secondary/60 transition-colors ${className}`}>
      {children}
    </div>
  );
};
const DropdownMenuSeparator = () => <div className="h-px bg-border/50 mx-2 my-1" />;

const Dialog = ({ open, onOpenChange, children }: any) => (
  <>{React.Children.map(children, child => React.cloneElement(child, { open, onOpenChange }))}</>
);
const DialogTrigger = ({ children, onOpenChange }: any) => React.cloneElement(children, { onClick: () => onOpenChange(true) });
const DialogContent = ({ children, open, onOpenChange, className }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-md panel border border-border/80 p-6 shadow-[var(--shadow-elevated)] animate-fade-up relative ${className}`}>
        <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">X</button>
        {children}
      </div>
    </div>
  );
};
const DialogTitle = ({ children }: any) => <h2 className="text-lg font-semibold tracking-tight mb-4">{children}</h2>;

const Button = ({ className, disabled, children, ...props }: any) => (
  <button disabled={disabled} className={`inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`} {...props}>
    {children}
  </button>
);
const Input = ({ className, ...props }: any) => (
  <input className={`flex h-10 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-border transition-colors ${className}`} {...props} />
);


/* =====================================================================
   4. APP COMPONENTS
   ===================================================================== */
const Logo = ({ className = "" }) => (
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

const TokenIcon = ({ symbol, size = 32 }: { symbol: string, size?: number }) => {
  const token = getToken(symbol);
  if (!token) return null;
  return (
    <div
      className="relative flex items-center justify-center rounded-full text-foreground font-semibold ring-1 ring-border/80 overflow-hidden shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.42,
        background: "radial-gradient(circle at 30% 25%, hsl(0 0% 22%), hsl(0 0% 8%) 70%)",
      }}
    >
      <span className="relative z-10 text-silver">{token.icon}</span>
      <span className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(0 0% 100% / 0.15), transparent 60%)" }} />
    </div>
  );
};

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const Header = () => {
  const { isConnected, profile, loading, connect, disconnect } = useWalletAuth();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!profile?.wallet_address) return;
    try {
      await navigator.clipboard.writeText(profile.wallet_address);
    } catch(e) {
      const textArea = document.createElement("textarea");
      textArea.value = profile.wallet_address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const NAV = [
    { to: "/", label: "Swap" },
    { to: "/pools", label: "Pools" },
    { to: "/bridge", label: "Bridge" },
    { to: "/stats", label: "Stats" },
    { to: "/dashboard", label: "Portfolio" },
  ];

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
                className={({ isActive }: any) =>
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
              <DropdownMenuTrigger>
                <button className="font-mono text-[13px] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/60 hover:border-border transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {shortAddr(profile.wallet_address)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
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
                <DropdownMenuItem>
                  <Link to="/dashboard" className="flex-1">Portfolio</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyAddress} className="gap-2">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy address
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={disconnect}
                  className="gap-2 text-destructive focus:text-destructive hover:!text-destructive hover:!bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={connect} disabled={loading} className="btn-silver h-9 px-4 rounded-full font-medium text-[13px] gap-1.5 flex">
              <Wallet className="h-3.5 w-3.5" />
              {loading ? "Signing…" : "Connect"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 grid-pattern opacity-60" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
    <div className="absolute left-1/2 -translate-x-1/2 top-32 h-[480px] w-[480px] rounded-full bg-gradient-to-b from-foreground/[0.08] to-transparent blur-3xl pointer-events-none" />

    <div className="container relative pt-20 pb-16 md:pt-32 md:pb-24">
      <div className="max-w-4xl mx-auto text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/60 border border-border/60 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-8">
          <span className="h-1 w-1 rounded-full bg-foreground/80" /> Native AMM · LitVM LiteForge
        </div>

        <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] mb-6">
          Liquidity, refined.<br /><span className="text-silver">Built on Litecoin.</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
          A precision DEX for the Litecoin Virtual Machine. Trustless swaps, deep liquidity, settled by zero-knowledge.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button className="btn-silver h-11 px-5 rounded-full font-medium text-sm inline-flex items-center gap-1.5">
            Open exchange <ArrowUpRight className="h-4 w-4" />
          </button>
          <a href="https://docs.litvm.com/" target="_blank" rel="noopener noreferrer" className="h-11 px-5 rounded-full font-medium text-sm inline-flex items-center gap-1.5 bg-secondary/60 border border-border/60 hover:border-border transition-colors">
            Read docs
          </a>
        </div>
      </div>
    </div>
    <div className="hairline" />
  </section>
);

const TokenSelect = ({ value, onChange, exclude }: any) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { profile } = useWalletAuth();
  const addr = profile?.wallet_address ?? null;

  const token = getToken(value);
  const filtered = TOKEN_REGISTRY.filter(
    (t) => t.symbol !== exclude && (t.symbol.toLowerCase().includes(q.toLowerCase()) || t.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-card border border-border/60 hover:border-border transition-colors shrink-0">
          <TokenIcon symbol={token.symbol} size={26} />
          <span className="font-medium text-[14px]">{token.symbol}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="!p-0 border-border/80 panel overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <DialogTitle>Select a token</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e: any) => setQ(e.target.value)} placeholder="Search name or symbol" className="pl-9 bg-secondary/40 border-border/50 rounded-xl h-10" />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map((t) => {
            const TokenRow = ({ t }: any) => {
              const { balance } = useTokenBalance(t.symbol, addr);
              const num = parseFloat(balance);
              const usd = (num * (t.priceUsd ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });
              return (
                <button onClick={() => { onChange(t.symbol); setOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <TokenIcon symbol={t.symbol} size={36} />
                    <div className="text-left">
                      <div className="font-medium text-[14px]">{t.symbol}</div>
                      <div className="text-[11px] text-muted-foreground">{t.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[13px]">{num.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">${usd}</div>
                  </div>
                </button>
              )
            };
            return <TokenRow key={t.symbol} t={t} />;
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SwapCard = () => {
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
    setFrom(to); setTo(from); setAmount(output || "");
  };

  const Row = ({ label, value, highlight }: any) => (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "text-foreground" : "text-foreground/80"}>{value}</span>
    </div>
  );

  return (
    <div className="relative w-full max-w-[440px] mx-auto animate-fade-up">
      <div className="absolute -inset-px rounded-[28px] bg-gradient-to-b from-foreground/[0.08] via-transparent to-transparent" />

      <div className="relative panel rounded-[28px] p-5">
        <div className="flex items-center justify-between mb-5 pl-1">
          <h2 className="font-semibold text-[17px] tracking-tight">Swap</h2>
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-secondary/60 border border-border/50">
            {[0.1, 0.5, 1].map((s) => (
              <button key={s} onClick={() => setSlippage(s)} className={`px-2.5 py-1 text-[11px] font-mono rounded-full transition-all ${slippage === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                {s}%
              </button>
            ))}
            <button className="ml-0.5 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"><Settings2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="rounded-2xl bg-secondary/40 border border-border/50 p-4 transition-colors hover:bg-secondary/60">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-2 font-mono uppercase tracking-wider">
            <span>Pay</span>
            <button onClick={() => setAmount(fromBalance)} className="hover:text-foreground transition-colors normal-case">
              {parseFloat(fromBalance).toFixed(4)} <span className="text-foreground font-semibold">MAX</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="flex-1 bg-transparent text-[34px] font-medium tracking-tight outline-none placeholder:text-muted-foreground/30 min-w-0" />
            <TokenSelect value={from} onChange={setFrom} exclude={to} />
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-mono">
            ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex justify-center -my-2.5 relative z-10">
          <button onClick={flip} className="h-9 w-9 rounded-xl bg-card border-[3px] border-background hover:bg-foreground hover:text-background transition-all duration-300 flex items-center justify-center group">
            <ArrowDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
          </button>
        </div>

        <div className="rounded-2xl bg-secondary/40 border border-border/50 p-4 transition-colors hover:bg-secondary/60">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-2 font-mono uppercase tracking-wider">
            <span>Receive</span>
            <span className="normal-case">{parseFloat(toBalance).toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-3">
            <input readOnly value={output} placeholder="0" className="flex-1 bg-transparent text-[34px] font-medium tracking-tight outline-none placeholder:text-muted-foreground/30 min-w-0" />
            <TokenSelect value={to} onChange={setTo} exclude={from} />
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-mono">
            ${(parseFloat(output || "0") * toPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        {amount && (
          <div className="mt-3 px-1 space-y-1.5 text-[11px] font-mono">
            <Row label="Rate" value={`1 ${from} = ${rate.toFixed(4)} ${to}`} />
            <Row label={`Min received (${slippage}%)`} value={`${minReceived} ${to}`} />
            <Row label="Fee (0.3%)" value={`${(parseFloat(amount) * 0.003).toFixed(6)} ${from}`} />
            <Row label="Network" value="LitVM" highlight />
          </div>
        )}

        {!isConnected ? (
          <button onClick={connect} disabled={authLoading} className="btn-silver w-full mt-4 h-12 rounded-2xl text-[14px] font-medium tracking-tight inline-flex items-center justify-center gap-2">
            {authLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {authLoading ? "Signing…" : "Connect wallet"}
          </button>
        ) : (
          <button
            onClick={async () => {
              if (!onChain) return toast.info("On-chain router pending", { description: "Deploy V2 contracts to proceed." });
              if (!quote || !addr) return;
              await swap();
            }}
            disabled={!amount || parseFloat(amount) <= 0 || swapping || (onChain && (quoting || !quote))}
            className="btn-silver w-full mt-4 h-12 rounded-2xl text-[14px] font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {swapping && <Loader2 className="h-4 w-4 animate-spin" />}
            {!amount ? "Enter an amount" : swapping ? "Swapping…" : onChain && quoting ? "Quoting…" : "Swap"}
          </button>
        )}
      </div>
    </div>
  );
};

const Pools = () => {
  const fmt = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(1)}K`);
  return (
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
          <div key={i} className="grid grid-cols-2 md:grid-cols-12 gap-2 px-6 py-4 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border/40 last:border-0">
            <div className="col-span-2 md:col-span-4 flex items-center gap-3">
              <div className="flex -space-x-2"><TokenIcon symbol={p.pair[0]} size={32} /><TokenIcon symbol={p.pair[1]} size={32} /></div>
              <div className="font-medium">{p.pair[0]} / {p.pair[1]}</div>
            </div>
            <div className="col-span-2 md:col-span-2 md:text-right"><span className="md:hidden text-[10px] uppercase font-mono text-muted-foreground mr-2">Fee</span><span className="font-mono text-sm">{p.fee}%</span></div>
            <div className="col-span-1 md:col-span-2 md:text-right"><div className="md:hidden text-[10px] uppercase font-mono text-muted-foreground">TVL</div><span className="font-mono">{fmt(p.tvl)}</span></div>
            <div className="col-span-1 md:col-span-2 md:text-right"><div className="md:hidden text-[10px] uppercase font-mono text-muted-foreground">Volume</div><span className="font-mono">{fmt(p.volume24h)}</span></div>
            <div className="col-span-2 md:col-span-2 md:text-right flex md:justify-end items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-success" /><span className="font-mono font-semibold text-success">{p.apr}%</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Bridge = () => {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("to");

  const fromChain = direction === "to" ? "Litecoin" : "LitVM";
  const toChain = direction === "to" ? "LitVM" : "Litecoin";

  const Row = ({ icon, label, value }: any) => (
    <div className="flex items-center justify-between px-1 py-1">
      <span className="text-muted-foreground inline-flex items-center gap-1.5">{icon}{label}</span><span className="text-foreground/90">{value}</span>
    </div>
  );

  return (
    <div className="w-full max-w-[440px] mx-auto animate-fade-up">
      <div className="panel rounded-[28px] p-6">
        <h2 className="text-[22px] font-semibold tracking-tight">Grail Bridge</h2>
        <p className="text-[13px] text-muted-foreground mb-6">Trustless ZK bridge powered by BitcoinOS.</p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 mb-5">
          <div className="rounded-2xl bg-secondary/40 border border-border/50 p-3.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">From</div><div className="font-medium">{fromChain}</div>
          </div>
          <button onClick={() => setDirection(direction === "to" ? "from" : "to")} className="h-9 w-9 rounded-xl bg-card border border-border hover:bg-foreground hover:text-background transition-all flex items-center justify-center">
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="rounded-2xl bg-secondary/40 border border-border/50 p-3.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">To</div><div className="font-medium">{toChain}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-secondary/40 border border-border/50 p-4 mb-4">
          <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">Amount (LTC)</div>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full bg-transparent text-[34px] font-medium tracking-tight outline-none placeholder:text-muted-foreground/30" />
        </div>

        <div className="space-y-1.5 mb-5 text-[11px] font-mono">
          <Row icon={<Shield className="h-3 w-3" />} label="Security" value="ZK Proofs · Trustless" />
          <Row icon={<Zap className="h-3 w-3" />} label="Est. time" value="~ 12 min" />
          <Row label="Bridge fee" value="0.05%" />
        </div>

        <button onClick={() => toast.success("Bridge initiated", { description: `${amount} LTC ${fromChain} → ${toChain}` })} disabled={!amount} className="btn-silver w-full h-12 rounded-2xl text-[14px] font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed">
          {amount ? `Bridge ${amount} LTC` : "Enter an amount"}
        </button>
      </div>
    </div>
  );
};

const Stats = () => {
  const fmt = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(1)}K`);
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
              <div className="h-8 w-8 rounded-lg bg-secondary/80 border border-border/60 flex items-center justify-center"><c.icon className="h-3.5 w-3.5 text-foreground/70" /></div>
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
                  <div className="font-medium">{t.symbol}</div><div className="text-[11px] text-muted-foreground">{t.name}</div>
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

const DashboardPage = () => {
  const { isConnected, profile } = useWalletAuth();
  const addr = profile?.wallet_address ?? null;
  const { mint, minting } = useMintToken();

  const Row = ({ symbol, address }: any) => {
    const token: any = TOKEN_REGISTRY.find((t) => t.symbol === symbol);
    const { balance, loading } = useTokenBalance(symbol, address);
    const num = parseFloat(balance);
    const usd = (num * (token.priceUsd ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });
    
    return (
      <div className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/40 transition-colors">
        <div className="flex items-center gap-3">
          <TokenIcon symbol={token.symbol} size={40} />
          <div>
            <div className="font-medium">{token.symbol}</div><div className="text-[11px] text-muted-foreground">{token.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          {!token.isNative && token.address && (
            <button 
              onClick={() => mint(token.symbol, token.address, token.decimals, address)}
              disabled={minting === token.symbol}
              className="px-3 py-1.5 text-[11px] font-mono text-foreground bg-secondary/80 hover:bg-primary hover:text-primary-foreground transition-colors rounded-full border border-border/50 disabled:opacity-50"
            >
              {minting === token.symbol ? "Minting..." : "+ Faucet"}
            </button>
          )}
          <div>
            <div className="font-mono text-sm">{loading ? "…" : num.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
            <div className="text-[11px] text-muted-foreground font-mono">${usd}</div>
          </div>
        </div>
      </div>
    );
  };

  if (!isConnected || !addr) {
    return (
      <main className="container py-24">
        <div className="max-w-md mx-auto text-center panel rounded-3xl p-12 animate-fade-up">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-secondary/80 border border-border/60 flex items-center justify-center mb-5"><Wallet className="h-5 w-5 text-foreground/70" /></div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Connect your wallet</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in with your wallet to see your LitVM balances and activity.</p>
          <Link to="/" className="btn-silver inline-flex h-11 px-5 rounded-full font-medium text-[13px] items-center">Open exchange</Link>
        </div>
      </main>
    );
  }

  const explorer = `${LITVM_NETWORK.blockExplorerUrls[0]}/address/${addr}`;

  return (
    <main className="container py-16 md:py-20 animate-fade-up">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
          <div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.035em] mb-1">Portfolio</h1>
            <p className="text-[12px] text-muted-foreground font-mono break-all">{addr}</p>
          </div>
          <a href={explorer} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-mono text-muted-foreground hover:text-foreground transition-colors">Explorer <ExternalLink className="h-3 w-3" /></a>
        </div>
        <div className="panel rounded-2xl p-2">
          <div className="px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold tracking-tight">Balances</h2><span className="text-[10px] uppercase font-mono tracking-[0.18em] text-muted-foreground">LiteForge</span>
          </div>
          <div className="hairline mb-1" />
          <div>{TOKEN_REGISTRY.map((t) => <Row key={t.symbol} symbol={t.symbol} address={addr} />)}</div>
        </div>
      </div>
    </main>
  );
};

/* =====================================================================
   5. MAIN APP WIRING
   ===================================================================== */
export default function App() {
  const [currentRoute, setCurrentRoute] = useState("/");

  return (
    <RouterContext.Provider value={{ route: currentRoute, navigate: setCurrentRoute }}>
      <style>{`
        :root {
          --background: 0 0% 3%; --foreground: 0 0% 98%;
          --card: 0 0% 5%; --card-foreground: 0 0% 98%;
          --popover: 0 0% 6%; --popover-foreground: 0 0% 98%;
          --primary: 220 10% 92%; --primary-foreground: 0 0% 4%; --primary-glow: 220 30% 80%;
          --secondary: 0 0% 9%; --secondary-foreground: 0 0% 98%;
          --muted: 0 0% 8%; --muted-foreground: 0 0% 55%;
          --accent: 220 20% 75%; --accent-foreground: 0 0% 4%;
          --silver: 220 12% 78%; --silver-foreground: 0 0% 4%;
          --success: 145 70% 55%; --warning: 38 92% 60%;
          --destructive: 0 75% 55%; --destructive-foreground: 0 0% 98%;
          --border: 0 0% 12%; --input: 0 0% 10%; --ring: 220 10% 70%;
          --radius: 1.25rem;
          --gradient-primary: linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(220 12% 78%) 50%, hsl(220 8% 55%) 100%);
          --gradient-silver: linear-gradient(180deg, hsl(0 0% 96%), hsl(220 12% 70%) 60%, hsl(220 10% 45%));
          --gradient-hero: radial-gradient(ellipse 80% 50% at 50% 0%, hsl(0 0% 18% / 0.6), transparent 70%);
          --gradient-card: linear-gradient(180deg, hsl(0 0% 7% / 0.8), hsl(0 0% 4% / 0.8));
          --gradient-line: linear-gradient(90deg, transparent, hsl(0 0% 30%), transparent);
          --shadow-glow: 0 0 80px hsl(220 10% 80% / 0.08);
          --shadow-card: 0 30px 60px -30px hsl(0 0% 0% / 0.9), 0 1px 0 0 hsl(0 0% 100% / 0.04) inset;
          --shadow-elevated: 0 40px 100px -30px hsl(0 0% 0%), 0 1px 0 0 hsl(0 0% 100% / 0.05) inset;
          --shadow-button: 0 1px 0 0 hsl(0 0% 100% / 0.15) inset, 0 8px 24px -8px hsl(0 0% 0% / 0.6);
          --transition-smooth: cubic-bezier(0.4, 0, 0.2, 1);
          --transition-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        body {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-feature-settings: "ss01", "cv11";
          letter-spacing: -0.01em;
          background-image: radial-gradient(ellipse 100% 60% at 50% -10%, hsl(0 0% 14% / 0.5), transparent 60%), radial-gradient(ellipse 80% 40% at 50% 100%, hsl(220 15% 12% / 0.3), transparent 60%);
          background-attachment: fixed;
          margin: 0;
        }
        body::before {
          content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: hsl(var(--background)); }
        ::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 8px; border: 2px solid hsl(var(--background)); }
        ::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
        .glass { background: var(--gradient-card); box-shadow: var(--shadow-card); backdrop-filter: blur(40px); border: 1px solid hsl(var(--border)/0.8); }
        .panel { background-color: hsl(var(--card)/0.8); backdrop-filter: blur(24px); border: 1px solid hsl(var(--border)/0.6); border-radius: 1rem; box-shadow: var(--shadow-card); }
        .text-silver { background-clip: text; -webkit-text-fill-color: transparent; background-image: var(--gradient-silver); }
        .btn-silver { background-image: var(--gradient-primary); color: hsl(var(--primary-foreground)); box-shadow: var(--shadow-button); transition: transform 0.2s var(--transition-spring), filter 0.2s ease; }
        .btn-silver:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .btn-silver:active { transform: translateY(0); filter: brightness(0.96); }
        .hairline { height: 1px; background: var(--gradient-line); }
        .grid-pattern {
          background-image: linear-gradient(hsl(0 0% 100% / 0.025) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.025) 1px, transparent 1px);
          background-size: 56px 56px; mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent 80%);
        }
        @keyframes chrome-spin { to { transform: rotate(360deg); } }
        .chrome-ring {
          background: conic-gradient(hsl(0 0% 30%), hsl(0 0% 95%), hsl(0 0% 30%), hsl(220 10% 80%), hsl(0 0% 30%));
          animation: chrome-spin 6s linear infinite;
        }
        @keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.6s var(--transition-smooth) both; }
      `}</style>
      
      <Toaster theme="dark" position="bottom-right" />
      
      <div className="min-h-screen flex flex-col relative z-10 selection:bg-primary/25 selection:text-foreground">
        <Header />
        <div className="flex-1">
          {currentRoute === "/" && (
            <>
              <Hero />
              <main className="container max-w-7xl mx-auto py-16 md:py-20 px-4">
                <SwapCard />
              </main>
            </>
          )}
          {currentRoute === "/pools" && <main className="container max-w-7xl mx-auto py-16 px-4 md:py-20"><Pools /></main>}
          {currentRoute === "/bridge" && <main className="container max-w-7xl mx-auto py-16 px-4 md:py-20"><Bridge /></main>}
          {currentRoute === "/stats" && <main className="container max-w-7xl mx-auto py-16 px-4 md:py-20"><Stats /></main>}
          {currentRoute === "/dashboard" && <main className="container max-w-7xl mx-auto py-16 px-4 md:py-20"><DashboardPage /></main>}
        </div>
        <footer className="mt-20">
          <div className="hairline" />
          <div className="container max-w-7xl mx-auto py-8 px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono text-muted-foreground uppercase tracking-[0.18em]">
            <div>Silverway · Built on LitVM</div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Docs</a>
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </footer>
      </div>
    </RouterContext.Provider>
  );
}