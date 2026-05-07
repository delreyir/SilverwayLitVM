import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import { 
  ArrowUpRight, Wallet, LogOut, Copy, Check, ChevronDown, 
  Search, ArrowDown, Settings2, Loader2, Droplets, Activity, 
  Repeat, TrendingUp, Plus, Zap, ArrowRight, X 
} from "lucide-react";
import { Toaster, toast } from "sonner";

/* =====================================================================
   1. REAL WEB3 CONFIG & REGISTRY
   ===================================================================== */
const LITVM_CHAIN_ID = "0x1159"; 
const LITVM_NETWORK_PARAMS = {
  chainId: LITVM_CHAIN_ID,
  chainName: "LitVM LiteForge",
  nativeCurrency: { name: "LitVM", symbol: "zkLTC", decimals: 18 },
  rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
  blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
};

// ⚠️ Hada l-adresse dial Router mo2a9at bach t9bel lik MetaMask transaction
const DEX_ROUTER_ADDRESS = "0x644Bae19C0b65D733A48a0C1EAA45C49559Bdd5A"; 

export const TOKEN_REGISTRY = [
  { symbol: "zkLTC", name: "Native zkLTC", priceUsd: 85.50, icon: "Ł", isNative: true, decimals: 18 },
  { symbol: "USDC", name: "USD Coin", priceUsd: 1.00, icon: "$", isNative: false, address: "0x6fefE517cAe9924EE3eFbd9423Fd707d55ED3bcA", decimals: 6 },
  { symbol: "LVM", name: "LitVM Token", priceUsd: 2.30, icon: "V", isNative: false, address: "0xEDEB8183aCd8D93a0E0604c7AD5EdABBA71c45a6", decimals: 18 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", priceUsd: 64200.00, icon: "₿", isNative: false, address: "0x127Dc73f26D2DA4b6663e71C7Bd5120c77d68AA2", decimals: 8 },
  // Zedt WETH w USDT lli deployiti!
  { symbol: "WETH", name: "Wrapped Ethereum", priceUsd: 3100.00, icon: "Ξ", isNative: false, address: "0xE5fb1Fb0915308cbeEE6443A58225A4B3DAeEe40", decimals: 18 },
  { symbol: "USDT", name: "Tether USD", priceUsd: 1.00, icon: "₮", isNative: false, address: "0xe5F7624eC757187a3cb89e55dc33eBdd39fF1662", decimals: 6 },
];

export const getToken = (sym: string) => TOKEN_REGISTRY.find((t) => t.symbol === sym) || TOKEN_REGISTRY[0];

const POOLS = [
  { pair: ["zkLTC", "USDC"], fee: 0.3, tvl: 8500000, volume24h: 2100000, apr: 12.5 },
  { pair: ["LVM", "zkLTC"], fee: 0.3, tvl: 4200000, volume24h: 800000, apr: 24.2 },
  { pair: ["WETH", "USDT"], fee: 0.3, tvl: 2500000, volume24h: 500000, apr: 8.4 }
];

const STATS = { tvl: 15200000, volume24h: 3400000, trades24h: 12450, pairs: 24 };

/* =====================================================================
   2. WALLET CONTEXT & HOOKS (GLOBAL STATE)
   ===================================================================== */
const WalletContext = createContext<any>(null);

export const WalletProvider = ({ children }: any) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<{ wallet_address: string; chain_id: string } | null>(null);

  const switchNetwork = async (chainId: string, params: any) => {
    if (!(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({ method: "wallet_addEthereumChain", params: [params] });
        } catch (addError) {
          toast.error("Failed to add network.");
        }
      }
    }
  };

  const connect = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("Wallet not found!", { description: "Please install MetaMask or Rabby." }); return;
    }
    setLoading(true);
    try {
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });

      setIsConnected(true);
      setProfile({ wallet_address: accounts[0], chain_id: chainId });
      toast.success("Wallet connected!");

      if (chainId !== LITVM_CHAIN_ID) await switchNetwork(LITVM_CHAIN_ID, LITVM_NETWORK_PARAMS);
    } catch (error: any) {
      toast.error("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => { setIsConnected(false); setProfile(null); toast.info("Wallet disconnected"); };

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsConnected(true);
          setProfile((prev) => prev ? { ...prev, wallet_address: accounts[0] } : { wallet_address: accounts[0], chain_id: "" });
        } else disconnect();
      };
      const handleChainChanged = (chainId: string) => setProfile((prev) => prev ? { ...prev, chain_id: chainId } : null);

      (window as any).ethereum.request({ method: "eth_accounts" }).then(handleAccountsChanged);
      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);
    }
  }, []);

  return <WalletContext.Provider value={{ isConnected, profile, loading, connect, disconnect, switchNetwork }}>{children}</WalletContext.Provider>;
};

export const useWalletAuth = () => useContext(WalletContext);

export const useTokenBalance = (symbol: string, userAddress?: string | null) => {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      if (!userAddress || !(window as any).ethereum) { if (isMounted) { setBalance("0"); setLoading(false); } return; }
      setLoading(true);
      try {
        const token = getToken(symbol);
        if (token.isNative) {
          const hex = await (window as any).ethereum.request({ method: 'eth_getBalance', params: [userAddress, 'latest'] });
          if (isMounted) setBalance((Number(BigInt(hex)) / 1e18).toFixed(4));
        } else if (token.address) {
          const data = '0x70a08231000000000000000000000000' + userAddress.replace("0x", "");
          const hex = await (window as any).ethereum.request({ method: 'eth_call', params: [{ to: token.address, data }, 'latest'] });
          if (isMounted) setBalance((Number(BigInt(hex)) / (10 ** token.decimals)).toFixed(4));
        }
      } catch (e) { if (isMounted) setBalance("0"); } finally { if (isMounted) setLoading(false); }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [symbol, userAddress]);

  return { balance, loading };
};

export const useMintToken = () => {
  const [minting, setMinting] = useState<string | null>(null);
  
  const mint = async (symbol: string, tokenAddress: string, decimals: number, userAddress: string) => {
    try {
      // 1. N-t2kdou mn l-réseau 9bel kolchi!
      const currentChainId = await (window as any).ethereum.request({ method: "eth_chainId" });
      
      if (currentChainId !== LITVM_CHAIN_ID) {
        toast.info("Switching to LitVM LiteForge...");
        try {
          await (window as any).ethereum.request({ 
            method: "wallet_switchEthereumChain", 
            params: [{ chainId: LITVM_CHAIN_ID }] 
          });
        } catch (switchError: any) {
          // Ila makanch 3ndo l-réseau ga3, n-ziydouh lih
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({ 
              method: "wallet_addEthereumChain", 
              params: [LITVM_NETWORK_PARAMS] 
            });
          } else {
            throw new Error("Please switch to LitVM network to mint.");
          }
        }
      }

      // 2. L-Minting process (Ila kan f réseau s7i7)
      setMinting(symbol);
      const amountToMint = symbol === "WBTC" || symbol === "WETH" ? "1" : "1000";
      toast.info(`Minting ${amountToMint} ${symbol}...`, { description: "Confirm in your wallet." });
      
      const dataPayload = "0x40c10f19" + userAddress.replace("0x", "").padStart(64, "0") + (BigInt(amountToMint) * (BigInt(10) ** BigInt(decimals))).toString(16).padStart(64, "0");
      
      await (window as any).ethereum.request({ 
        method: 'eth_sendTransaction', 
        params: [{ from: userAddress, to: tokenAddress, data: dataPayload }] 
      });
      
      setTimeout(() => { 
        toast.success(`Minted ${amountToMint} ${symbol}!`); 
        setMinting(null); 
      }, 4000);
      
    } catch (err: any) { 
      toast.error(err.message || `Failed to mint`); 
      setMinting(null); 
    }
  };
  
  return { mint, minting };
};

/* =====================================================================
   3. CUSTOM UI COMPONENTS
   ===================================================================== */
const RouterContext = createContext({ route: '/', navigate: (route: string) => {} });
const Link = ({ to, children, className }: any) => { const { navigate } = useContext(RouterContext); return <a href={to} className={className} onClick={(e) => { e.preventDefault(); navigate(to); }}>{children}</a>; };
const NavLink = ({ to, children, className }: any) => { const { route, navigate } = useContext(RouterContext); const isActive = route === to || (to !== '/' && route.startsWith(to)); const classes = typeof className === 'function' ? className({ isActive }) : className; return <a href={to} className={classes} onClick={(e) => { e.preventDefault(); navigate(to); }}>{children}</a>; };

const DropdownContext = createContext<any>(null);
const DropdownMenu = ({ children }: any) => { const [open, setOpen] = useState(false); return <DropdownContext.Provider value={{open, setOpen}}><div className="relative">{children}</div></DropdownContext.Provider>; };
const DropdownMenuTrigger = ({ children }: any) => { const { setOpen } = useContext(DropdownContext); return React.cloneElement(children, { onClick: () => setOpen((p: boolean) => !p) }); };
const DropdownMenuContent = ({ children, className }: any) => { const { open } = useContext(DropdownContext); if (!open) return null; return <div className={`absolute right-0 top-full mt-2 z-50 rounded-2xl bg-popover/90 backdrop-blur-xl border border-border/80 shadow-[var(--shadow-elevated)] overflow-hidden animate-fade-up ${className}`}>{children}</div>; };
const DropdownMenuItem = ({ children, onClick, className, disabled }: any) => { const { setOpen } = useContext(DropdownContext); return <button disabled={disabled} onClick={(e) => { if(!disabled) { setOpen(false); if(onClick) onClick(e); } }} className={`w-full relative flex cursor-pointer items-center px-3 py-2 text-[13px] transition-colors disabled:opacity-50 ${disabled ? 'cursor-not-allowed' : 'hover:bg-secondary/60'} ${className}`}>{children}</button>; };
const DropdownMenuSeparator = () => <div className="h-px bg-border/50 mx-2 my-1" />;

const Dialog = ({ open, onOpenChange, children }: any) => <>{React.Children.map(children, child => React.cloneElement(child, { open, onOpenChange }))}</>;
const DialogTrigger = ({ children, onOpenChange }: any) => React.cloneElement(children, { onClick: () => onOpenChange(true) });
const DialogContent = ({ children, open, onOpenChange, className }: any) => { if (!open) return null; return <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`w-full max-w-md panel border border-border/80 p-6 shadow-[var(--shadow-elevated)] animate-fade-up relative ${className}`}><button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">X</button>{children}</div></div>; };
const DialogTitle = ({ children }: any) => <h2 className="text-lg font-semibold tracking-tight mb-4">{children}</h2>;
const Input = ({ className, ...props }: any) => <input className={`flex h-10 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-border transition-colors ${className}`} {...props} />;

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <div className="relative h-8 w-8"><div className="absolute inset-0 rounded-full chrome-ring opacity-90" /><div className="absolute inset-[2px] rounded-full bg-background flex items-center justify-center"><span className="text-silver font-semibold text-base leading-none">Ł</span></div></div>
    <div className="flex items-baseline gap-1.5 leading-none"><span className="font-semibold text-[17px] tracking-tight">Silverway</span><span className="text-[10px] font-mono text-muted-foreground tracking-[0.2em] uppercase">LitVM</span></div>
  </div>
);

const TokenIcon = ({ symbol, size = 32 }: { symbol: string, size?: number }) => {
  const token = getToken(symbol);
  if (!token) return null;
  return (
    <div className="relative flex items-center justify-center rounded-full text-foreground font-semibold ring-1 ring-border/80 overflow-hidden shrink-0" style={{ width: size, height: size, fontSize: size * 0.42, background: "radial-gradient(circle at 30% 25%, hsl(0 0% 22%), hsl(0 0% 8%) 70%)" }}>
      <span className="relative z-10 text-silver">{token.icon}</span><span className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(0 0% 100% / 0.15), transparent 60%)" }} />
    </div>
  );
};
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/* =====================================================================
   4. APP COMPONENTS
   ===================================================================== */
const Header = () => {
  const { isConnected, profile, loading, connect, disconnect } = useWalletAuth();
  const { mint, minting } = useMintToken();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!profile?.wallet_address) return;
    navigator.clipboard.writeText(profile.wallet_address);
    setCopied(true); toast.success("Address copied"); setTimeout(() => setCopied(false), 1500);
  };

  const NAV = [
    { to: "/", label: "Swap" },
    { to: "/pools", label: "Pools" },
    { to: "/stats", label: "Stats" },
    { to: "/dashboard", label: "Portfolio" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-2xl">
      <div className="absolute inset-x-0 bottom-0 hairline" />
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="Silverway home"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }: any) => `px-3.5 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200 ${isActive ? "text-foreground bg-secondary/80 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.06)]" : "text-muted-foreground hover:text-foreground"}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {isConnected && profile && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/60 hover:border-border transition-colors text-[12px] font-medium text-muted-foreground hover:text-foreground">
                  <Droplets className="h-3.5 w-3.5" /> Faucet
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52">
                <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Testnet Tokens</div>
                {TOKEN_REGISTRY.filter(t => !t.isNative && t.address).map(t => (
                  <DropdownMenuItem key={t.symbol} disabled={minting === t.symbol} onClick={() => mint(t.symbol, t.address!, t.decimals || 18, profile.wallet_address)} className="justify-between">
                    <div className="flex items-center gap-2"><TokenIcon symbol={t.symbol} size={18} /> <span className="font-medium">{t.symbol}</span></div>
                    {minting === t.symbol ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <span className="text-[10px] text-muted-foreground uppercase">+ Mint</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-secondary/60 border border-border/60">
            <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" /></span>
            <span className="text-[11px] font-mono text-muted-foreground tracking-wide">LiteForge</span>
          </div>

          {isConnected && profile?.wallet_address ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="font-mono text-[13px] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/60 hover:border-border transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />{shortAddr(profile.wallet_address)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <div className="px-3 py-3"><div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-1.5">Connected</div><div className="font-mono text-xs break-all text-foreground/90">{profile.wallet_address}</div></div>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Link to="/dashboard" className="flex-1">Portfolio</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={copyAddress} className="gap-2">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy address</DropdownMenuItem>
                <DropdownMenuItem onClick={disconnect} className="gap-2 text-destructive focus:text-destructive hover:!text-destructive hover:!bg-destructive/10"><LogOut className="h-3.5 w-3.5" /> Disconnect</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button onClick={connect} disabled={loading} className="btn-silver h-9 px-4 rounded-full font-medium text-[13px] gap-1.5 flex items-center">
              <Wallet className="h-3.5 w-3.5" /> {loading ? "Signing…" : "Connect"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

/* =====================================================================
   🔥 PRO SWAP & POOLS COMPONENTS 
   ===================================================================== */
const TokenSelect = ({ value, onChange, exclude }: any) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { profile } = useWalletAuth();
  
  const token = getToken(value);
  const filtered = TOKEN_REGISTRY.filter((t) => t.symbol !== exclude && (t.symbol.toLowerCase().includes(q.toLowerCase()) || t.name.toLowerCase().includes(q.toLowerCase())));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full bg-card border border-border/60 hover:border-border transition-colors shrink-0 shadow-sm">
          <TokenIcon symbol={token.symbol} size={24} />
          <span className="font-semibold text-[15px]">{token.symbol}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="!p-0 border-border/80 panel overflow-hidden w-full max-w-sm">
        <div className="p-4 border-b border-border/50">
          <DialogTitle>Select a token</DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e: any) => setQ(e.target.value)} placeholder="Search name or symbol" className="pl-9 bg-secondary/40 border-border/50 rounded-xl h-11" />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map((t) => {
            const TokenRow = ({ t }: any) => {
              const { balance } = useTokenBalance(t.symbol, profile?.wallet_address);
              return (
                <button onClick={() => { onChange(t.symbol); setOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <TokenIcon symbol={t.symbol} size={36} />
                    <div className="text-left"><div className="font-semibold text-[15px]">{t.symbol}</div><div className="text-[12px] text-muted-foreground">{t.name}</div></div>
                  </div>
                  <div className="font-mono text-[14px]">{parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
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
  const { profile, isConnected, connect, switchNetwork } = useWalletAuth();
  const addr = profile?.wallet_address ?? null;

  const [from, setFrom] = useState("zkLTC");
  const [to, setTo] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);

  const fromToken = getToken(from);
  const toToken = getToken(to);

  const { balance: fromBalance } = useTokenBalance(from, addr);
  const { balance: toBalance } = useTokenBalance(to, addr);

  // Quote Simulation (x*y=k logic)
  const [swapping, setSwapping] = useState(false);
  const [approving, setApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(fromToken.isNative); 

  // Reset approval if token changes
  useEffect(() => { setIsApproved(fromToken.isNative); }, [fromToken.symbol]);

  const fromPrice = fromToken.priceUsd ?? 0;
  const toPrice = toToken.priceUsd ?? 1;
  const fallbackRate = fromPrice / toPrice;

  // Calculate Output & Price Impact
  const parsedAmount = parseFloat(amount) || 0;
  const outputRaw = parsedAmount * fallbackRate * 0.997; // 0.3% fee
  const output = amount ? outputRaw.toFixed(6) : "";
  const minReceived = output ? (outputRaw * (1 - slippage / 100)).toFixed(6) : "0";
  const usdValue = parsedAmount * fromPrice;
  
  // Fake price impact based on trade size
  const priceImpact = usdValue > 10000 ? ((usdValue / 1000000) * 100).toFixed(2) : "< 0.01";

  const flip = () => { setFrom(to); setTo(from); setAmount(output || ""); };

  const isWrongNetwork = profile?.chain_id && profile.chain_id !== LITVM_CHAIN_ID;

  // 1. APPROVE LOGIC
  const handleApprove = async () => {
    setApproving(true);
    try {
      if (!fromToken.address) throw new Error("Native token doesn't need approval");
      
      toast.info(`Approving ${fromToken.symbol}...`, { description: "Please confirm in your wallet." });
      
      const funcSelector = "0x095ea7b3";
      const spender = DEX_ROUTER_ADDRESS.replace("0x", "").padStart(64, "0");
      const maxAmount = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const txData = funcSelector + spender + maxAmount;

      await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: profile.wallet_address, to: fromToken.address, data: txData }]
      });

      setIsApproved(true);
      toast.success(`${fromToken.symbol} Approved!`, { description: "You can now proceed to swap." });
    } catch (e: any) { 
      console.error(e); toast.error("Approval failed", { description: e.message }); 
    } finally { 
      setApproving(false); 
    }
  };

  // 2. SWAP LOGIC
  const handleSwap = async () => {
    setSwapping(true);
    try {
      toast.info(`Swapping ${amount} ${from} for ${to}...`, { description: "Please confirm in your wallet." });
      
      let txData = ""; let txValue = "0x0";

      if (from === "zkLTC") {
        txData = "0xb6f9de95"; 
        txValue = "0x" + BigInt(parseFloat(amount) * 1e18).toString(16);
      } else {
        const amountInUnits = BigInt(parseFloat(amount) * 1e6).toString(16);
        txData = "0x7f92c8a6" + amountInUnits.padStart(64, "0");
      }

      await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: profile.wallet_address, to: DEX_ROUTER_ADDRESS, value: txValue, data: txData }]
      });

      toast.success("Swap Confirmed!", { description: `Received ${output} ${to}` });
      setAmount("");
    } catch (e: any) { 
      console.error(e); toast.error("Swap failed", { description: e.message }); 
    } finally { 
      setSwapping(false); 
    }
  };

  return (
    <div className="relative w-full max-w-[460px] mx-auto animate-fade-up">
      <div className="absolute -inset-px rounded-[32px] bg-gradient-to-b from-foreground/[0.08] via-transparent to-transparent" />
      <div className="relative panel rounded-[32px] p-2 bg-card">
        
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-semibold text-lg tracking-tight">Swap</h2>
          <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/60 border border-border/50">
            {[0.1, 0.5, 1].map((s) => (
              <button key={s} onClick={() => setSlippage(s)} className={`px-2.5 py-1 text-[11px] font-mono rounded-full transition-all ${slippage === s ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                {s}%
              </button>
            ))}
            <button className="ml-0.5 p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"><Settings2 className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="rounded-3xl bg-secondary/30 border border-border/40 p-4 pb-5 transition-colors hover:bg-secondary/50">
          <div className="flex justify-between text-[12px] font-medium text-muted-foreground mb-3">
            <span>You pay</span>
            <div className="flex items-center gap-1.5">
              <span>{parseFloat(fromBalance).toFixed(4)}</span>
              <button onClick={() => setAmount(fromBalance)} className="text-primary hover:brightness-125 transition-colors uppercase text-[10px] font-bold tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">Max</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="w-1/2 bg-transparent text-[40px] font-semibold tracking-tight outline-none placeholder:text-muted-foreground/30 text-foreground" />
            <TokenSelect value={from} onChange={setFrom} exclude={to} />
          </div>
          <div className="text-[12px] text-muted-foreground mt-2 font-mono">${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>

        <div className="flex justify-center -my-3.5 relative z-10">
          <button onClick={flip} className="h-10 w-10 rounded-2xl bg-card border-[4px] border-background hover:bg-secondary transition-all duration-300 flex items-center justify-center text-foreground hover:text-primary">
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-3xl bg-secondary/30 border border-border/40 p-4 pb-5 transition-colors hover:bg-secondary/50">
          <div className="flex justify-between text-[12px] font-medium text-muted-foreground mb-3">
            <span>You receive</span>
            <span>{parseFloat(toBalance).toFixed(4)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <input readOnly value={output} placeholder="0.0" className="w-1/2 bg-transparent text-[40px] font-semibold tracking-tight outline-none placeholder:text-muted-foreground/30 text-foreground" />
            <TokenSelect value={to} onChange={setTo} exclude={from} />
          </div>
          <div className="text-[12px] text-muted-foreground mt-2 font-mono">${(parsedAmount * toPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>

        {amount && parsedAmount > 0 && (
          <div className="mt-3 mx-2 p-3 rounded-2xl border border-border/40 bg-secondary/10 space-y-2.5 text-[12px] font-medium">
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Rate</span><span>1 {from} = {fallbackRate.toFixed(4)} {to}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Price Impact</span><span className={`${parseFloat(priceImpact) > 1 ? 'text-destructive' : 'text-success'}`}>{priceImpact}%</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Minimum Received</span><span>{minReceived} {to}</span></div>
            <div className="hairline my-1 opacity-50" />
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Network Fee</span><span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3 text-warning"/> ~ $0.01</span></div>
          </div>
        )}

        <div className="mt-3">
          {!isConnected ? (
            <button onClick={connect} className="btn-silver w-full h-14 rounded-2xl text-[16px] font-semibold tracking-tight">Connect Wallet</button>
          ) : isWrongNetwork ? (
            <button onClick={() => switchNetwork(LITVM_CHAIN_ID, LITVM_NETWORK_PARAMS)} className="w-full h-14 rounded-2xl text-[16px] font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">Switch to LitVM</button>
          ) : !amount || parsedAmount <= 0 ? (
            <button disabled className="w-full h-14 rounded-2xl text-[16px] font-semibold bg-secondary text-muted-foreground cursor-not-allowed">Enter an amount</button>
          ) : !isApproved ? (
            <button onClick={handleApprove} disabled={approving} className="w-full h-14 rounded-2xl text-[16px] font-semibold bg-primary text-primary-foreground hover:brightness-110 flex justify-center items-center gap-2 transition-all shadow-[var(--shadow-glow)]">
              {approving && <Loader2 className="h-5 w-5 animate-spin" />} Approve {from}
            </button>
          ) : (
            <button onClick={handleSwap} disabled={swapping} className="btn-silver w-full h-14 rounded-2xl text-[16px] font-semibold tracking-tight flex justify-center items-center gap-2">
              {swapping && <Loader2 className="h-5 w-5 animate-spin" />} Swap
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

/* =====================================================================
   5. OTHER PAGES (MODIFIED POOLS WITH NEW STATES)
   ===================================================================== */
const Pools = () => {
  const { isConnected, connect, profile } = useWalletAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [tokenA, setTokenA] = useState("WETH");
  const [tokenB, setTokenB] = useState("USDT");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const { balance: balA } = useTokenBalance(tokenA, profile?.wallet_address);
  const { balance: balB } = useTokenBalance(tokenB, profile?.wallet_address);

  const fmt = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(1)}K`);

  const handleAddLiquidity = async () => {
    setIsApproving(true);
    toast.info("Approving Tokens...", { description: "Please confirm in wallet." });
    setTimeout(() => {
      toast.success("Liquidity Added!");
      setIsApproving(false);
      setShowAdd(false);
      setAmountA("");
      setAmountB("");
    }, 2000); // 💡 Mock logic for now, we will replace this with real contract call later
  };

  if (showAdd) {
    return (
      <div className="relative w-full max-w-[460px] mx-auto animate-fade-up mt-8">
        <div className="absolute -inset-px rounded-[32px] bg-gradient-to-b from-foreground/[0.08] via-transparent to-transparent" />
        <div className="relative panel rounded-[32px] p-2 bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="font-semibold text-lg tracking-tight">Add Liquidity</h2>
            <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors bg-secondary/60 border border-border/50"><X className="h-4 w-4" /></button>
          </div>

          <div className="rounded-3xl bg-secondary/30 border border-border/40 p-4 pb-5 transition-colors hover:bg-secondary/50 mb-2">
            <div className="flex justify-between text-[12px] font-medium text-muted-foreground mb-3">
              <span>Deposit</span><span>Balance: {parseFloat(balA).toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input type="number" value={amountA} onChange={(e) => setAmountA(e.target.value)} placeholder="0.0" className="w-1/2 bg-transparent text-[40px] font-semibold tracking-tight outline-none placeholder:text-muted-foreground/30 text-foreground" />
              <TokenSelect value={tokenA} onChange={setTokenA} exclude={tokenB} />
            </div>
          </div>

          <div className="flex justify-center -my-4 relative z-10">
            <div className="h-10 w-10 rounded-2xl bg-card border-[4px] border-background flex items-center justify-center text-muted-foreground">
              <Plus className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-3xl bg-secondary/30 border border-border/40 p-4 pb-5 transition-colors hover:bg-secondary/50">
            <div className="flex justify-between text-[12px] font-medium text-muted-foreground mb-3">
              <span>Deposit</span><span>Balance: {parseFloat(balB).toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input type="number" value={amountB} onChange={(e) => setAmountB(e.target.value)} placeholder="0.0" className="w-1/2 bg-transparent text-[40px] font-semibold tracking-tight outline-none placeholder:text-muted-foreground/30 text-foreground" />
              <TokenSelect value={tokenB} onChange={setTokenB} exclude={tokenA} />
            </div>
          </div>

          <div className="mt-3">
             {!isConnected ? (
                <button onClick={connect} className="btn-silver w-full h-14 rounded-2xl text-[16px] font-semibold tracking-tight">Connect Wallet</button>
             ) : !amountA || !amountB ? (
                <button disabled className="w-full h-14 rounded-2xl text-[16px] font-semibold bg-secondary text-muted-foreground cursor-not-allowed">Enter amounts</button>
             ) : (
                <button onClick={handleAddLiquidity} disabled={isApproving} className="w-full h-14 rounded-2xl text-[16px] font-semibold bg-primary text-primary-foreground hover:brightness-110 flex justify-center items-center gap-2 transition-all">
                  {isApproving && <Loader2 className="h-5 w-5 animate-spin" />} Approve & Add
                </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-up">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div><h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.035em]">Liquidity</h2><p className="text-muted-foreground text-sm mt-1">Earn fees by providing liquidity.</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-silver h-10 px-4 rounded-full text-[13px] font-medium inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> New position</button>
      </div>
      <div className="panel rounded-3xl overflow-hidden border-border/40">
        <div className="hidden md:grid grid-cols-12 px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-mono border-b border-border/40 bg-secondary/20">
          <div className="col-span-4">Pool</div><div className="col-span-2 text-right">Fee</div><div className="col-span-2 text-right">TVL</div><div className="col-span-2 text-right">24h Volume</div><div className="col-span-2 text-right">APR</div>
        </div>
        {POOLS.map((p, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-12 gap-2 px-6 py-5 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border/30 last:border-0 items-center">
            <div className="col-span-2 md:col-span-4 flex items-center gap-3">
              <div className="flex -space-x-2"><TokenIcon symbol={p.pair[0]} size={36} /><TokenIcon symbol={p.pair[1]} size={36} /></div>
              <div className="font-semibold text-[15px]">{p.pair[0]} / {p.pair[1]}</div>
            </div>
            <div className="col-span-2 md:col-span-2 md:text-right font-medium"><span className="md:hidden text-muted-foreground text-xs mr-2">Fee</span>{p.fee}%</div>
            <div className="col-span-1 md:col-span-2 md:text-right font-medium"><div className="md:hidden text-muted-foreground text-xs">TVL</div>{fmt(p.tvl)}</div>
            <div className="col-span-1 md:col-span-2 md:text-right font-medium"><div className="md:hidden text-muted-foreground text-xs">Volume</div>{fmt(p.volume24h)}</div>
            <div className="col-span-2 md:col-span-2 md:text-right flex md:justify-end items-center gap-1 text-success font-semibold"><TrendingUp className="h-4 w-4" />{p.apr}%</div>
          </div>
        ))}
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
  ];
  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 animate-fade-up">
      <div><h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.035em]">Protocol</h2><p className="text-muted-foreground text-sm mt-1">Real-time analytics for Silverway on LitVM.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="panel rounded-3xl p-6 border-border/40 hover:border-border transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-2xl bg-secondary/80 border border-border/60 flex items-center justify-center"><c.icon className="h-5 w-5 text-foreground/80" /></div>
              <span className="text-[12px] font-mono text-success bg-success/10 px-2 py-1 rounded-full">{c.change}</span>
            </div>
            <div className="text-3xl font-bold tracking-tight">{c.value}</div>
            <div className="text-[12px] text-muted-foreground mt-2 uppercase font-mono tracking-wider">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { isConnected, profile } = useWalletAuth();
  const addr = profile?.wallet_address ?? null;

  if (!isConnected || !addr) {
    return (
      <div className="max-w-md mx-auto text-center panel rounded-[32px] p-12 animate-fade-up border-border/40 mt-10">
        <div className="h-16 w-16 mx-auto rounded-full bg-secondary/80 border flex items-center justify-center mb-6"><Wallet className="h-6 w-6 text-foreground/70" /></div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Portfolio</h2>
        <p className="text-sm text-muted-foreground mb-8">Sign in with your wallet to see your LitVM balances.</p>
      </div>
    );
  }

  const Row = ({ symbol, address }: any) => {
    const token: any = getToken(symbol);
    const { balance, loading } = useTokenBalance(symbol, address);
    const usd = (parseFloat(balance) * (token.priceUsd ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });
    
    return (
      <div className="flex items-center justify-between p-5 rounded-2xl hover:bg-secondary/40 transition-colors border border-transparent hover:border-border/30">
        <div className="flex items-center gap-4"><TokenIcon symbol={token.symbol} size={44} /><div><div className="font-semibold text-lg">{token.symbol}</div><div className="text-[13px] text-muted-foreground">{token.name}</div></div></div>
        <div className="text-right">
          <div className="font-mono text-lg font-medium">{loading ? "…" : parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
          <div className="text-[12px] text-muted-foreground font-mono">${usd}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      <div className="flex items-end justify-between mb-8">
        <div><h1 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight mb-2">Portfolio</h1><p className="text-[13px] text-muted-foreground font-mono bg-secondary/40 px-3 py-1.5 rounded-lg inline-block border border-border/50">{addr}</p></div>
      </div>
      <div className="panel rounded-[32px] p-3 border-border/40">
        <div className="px-5 py-4"><h2 className="font-semibold text-lg">Your Assets</h2></div>
        <div className="hairline mb-2 opacity-50" />
        <div className="space-y-1">{TOKEN_REGISTRY.map((t) => <Row key={t.symbol} symbol={t.symbol} address={addr} />)}</div>
      </div>
    </div>
  );
};

/* =====================================================================
   6. MAIN APP WIRING
   ===================================================================== */
export default function App() {
  const [currentRoute, setCurrentRoute] = useState("/");

  return (
    <WalletProvider>
      <RouterContext.Provider value={{ route: currentRoute, navigate: setCurrentRoute }}>
        <style>{`
          :root {
            --background: 0 0% 2%; --foreground: 0 0% 98%;
            --card: 0 0% 4%; --popover: 0 0% 5%;
            --primary: 220 10% 92%; --primary-foreground: 0 0% 4%; 
            --secondary: 0 0% 8%; --muted: 0 0% 8%; --muted-foreground: 0 0% 60%;
            --success: 145 65% 50%; --warning: 38 92% 60%; --destructive: 0 75% 55%;
            --border: 0 0% 12%; 
            --gradient-primary: linear-gradient(135deg, hsl(0 0% 100%), hsl(220 12% 80%));
            --shadow-glow: 0 0 60px hsl(220 10% 80% / 0.05);
            --transition-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          body {
            background-color: hsl(var(--background)); color: hsl(var(--foreground));
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            margin: 0; background-image: radial-gradient(ellipse at top, hsl(0 0% 12% / 0.4), transparent 50%);
          }
          .panel { background-color: hsl(var(--card)); box-shadow: 0 20px 40px -20px rgba(0,0,0,0.8); }
          .btn-silver { background: var(--gradient-primary); color: #000; transition: transform 0.2s var(--transition-spring), opacity 0.2s; }
          .btn-silver:hover { opacity: 0.9; transform: translateY(-1px); }
          .btn-silver:active { transform: translateY(0); }
          .hairline { height: 1px; background: linear-gradient(90deg, transparent, hsl(var(--border)), transparent); }
          .chrome-ring { background: conic-gradient(#555, #fff, #555, #ccc, #555); animation: spin 4s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .animate-fade-up { animation: fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        
        <Toaster theme="dark" position="bottom-right" />
        
        <div className="min-h-screen flex flex-col relative z-10">
          <Header />
          <div className="flex-1">
            {currentRoute === "/" && (
              <main className="container max-w-7xl mx-auto py-20 px-4">
                <div className="text-center mb-12 animate-fade-up">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Trade with precision.</h1>
                  <p className="text-muted-foreground">The most liquid AMM on LitVM LiteForge.</p>
                </div>
                <SwapCard />
              </main>
            )}
            {currentRoute === "/pools" && <main className="container py-20 px-4"><Pools /></main>}
            {currentRoute === "/stats" && <main className="container py-20 px-4"><Stats /></main>}
            {currentRoute === "/dashboard" && <main className="container py-20 px-4"><DashboardPage /></main>}
          </div>
        </div>
      </RouterContext.Provider>
    </WalletProvider>
  );
}