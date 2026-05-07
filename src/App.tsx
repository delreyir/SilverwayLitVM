import React, { useState } from "react";
import { Copy, LogOut, Wallet, ChevronDown, Plus, Zap } from "lucide-react";
import { Toaster, toast } from "sonner";

// ==========================================
// 1. CONFIG & REGISTRY
// ==========================================
const LITVM_CHAIN_ID = "0x1159";
const LITVM_NETWORK_PARAMS = {
  chainId: LITVM_CHAIN_ID,
  chainName: "LitVM LiteForge",
  nativeCurrency: { name: "LitVM", symbol: "zkLTC", decimals: 18 },
  rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
  blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
};

// L-adresse dial DEX li saybna f Remix
const DEX_ROUTER_ADDRESS = "0xf74FafBE9a6D029fdc1aEba46C0f4Ab069C25F32";

// L-Tokens dialna
const TOKENS = [
  { symbol: "zkLTC", name: "LitVM Native", address: "native", decimals: 18 },
  { symbol: "USDC", name: "USD Coin", address: "0x6fefE517cAe9924EE3eFbd9423Fd707d55ED3bcA", decimals: 6 },
  { symbol: "WETH", name: "Wrapped Ethereum", address: "0xE5fb1Fb0915308cbeEE6443A58225A4B3DAeEe40", decimals: 18 },
  { symbol: "USDT", name: "Tether USD", address: "0xe5F7624eC757187a3cb89e55dc33eBdd39fF1662", decimals: 6 }
];

export default function App() {
  // --- States ---
  const [walletAddress, setWalletAddress] = useState("");
  const [activeTab, setActiveTab] = useState("swap"); // 'swap' wla 'pools'

  // Swap States
  const [amount, setAmount] = useState("");
  const [fromToken, setFromToken] = useState(TOKENS[1]); // USDC par defaut
  const [toToken, setToToken] = useState(TOKENS[0]); // zkLTC par defaut
  const [isSwapping, setIsSwapping] = useState(false);

  // Pools States
  const [poolTokenA, setPoolTokenA] = useState(TOKENS[2]); // WETH
  const [poolTokenB, setPoolTokenB] = useState(TOKENS[3]); // USDT
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);

  // ==========================================
  // 2. WALLET LOGIC
  // ==========================================
  const connectWallet = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        toast.success("Wallet connected!");
        
        // Nbedlou réseau l LitVM
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [LITVM_NETWORK_PARAMS],
        });
      } catch (error: any) {
        toast.error("Connection failed", { description: error.message });
      }
    } else {
      toast.error("MetaMask/Rabby not found");
    }
  };

  // ==========================================
  // 3. SWAP LOGIC
  // ==========================================
  const handleSwap = async () => {
    if (!walletAddress) return toast.error("Connect wallet first!");
    setIsSwapping(true);
    
    try {
      toast.info(`Swapping ${amount} ${fromToken.symbol}...`, { description: "Confirm in wallet." });
      
      let txData = "";
      let txValue = "0x0";

      if (fromToken.symbol === "zkLTC") {
        txData = "0xb6f9de95"; // swapExactETHForTokens
        txValue = "0x" + BigInt(parseFloat(amount) * 1e18).toString(16);
      } else {
        const amountInUnits = BigInt(parseFloat(amount) * (10 ** fromToken.decimals)).toString(16);
        txData = "0x7f92c8a6" + amountInUnits.padStart(64, "0"); // swapExactTokensForETH
      }

      await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: DEX_ROUTER_ADDRESS,
          value: txValue, 
          data: txData 
        }]
      });

      toast.success("Swap Confirmed!");
      setAmount("");
    } catch (e: any) { 
      console.error(e);
      toast.error("Swap failed", { description: e.message }); 
    } finally { 
      setIsSwapping(false); 
    }
  };

  // ==========================================
  // 4. POOLS LOGIC (ADD LIQUIDITY)
  // ==========================================
  const handleAddLiquidity = async () => {
    if (!walletAddress) return toast.error("Connect wallet first!");
    toast.info("Approving & Adding Liquidity...");
    // Hna ghadi n-saybou l-logic d l-approve mn b3d
  };

  // ==========================================
  // UI RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/10">
      <Toaster theme="dark" position="bottom-right" />
      
      {/* HEADER */}
      <header className="flex justify-between items-center p-6 border-b border-white/5">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold tracking-tighter">Silverway<span className="text-gray-500">DEX</span></h1>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
            <button onClick={() => setActiveTab("swap")} className={`transition-colors hover:text-white ${activeTab === 'swap' ? 'text-white' : ''}`}>Swap</button>
            <button onClick={() => setActiveTab("pool")} className={`transition-colors hover:text-white ${activeTab === 'pool' ? 'text-white' : ''}`}>Pools</button>
          </nav>
        </div>
        
        {walletAddress ? (
          <div className="flex items-center gap-3 bg-[#111] border border-white/10 rounded-full px-4 py-2">
            <span className="text-sm font-mono text-gray-300">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
            <button onClick={() => setWalletAddress("")} className="text-gray-500 hover:text-white"><LogOut size={16} /></button>
          </div>
        ) : (
          <button onClick={connectWallet} className="bg-white text-black px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2">
            <Wallet size={16} /> Connect
          </button>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-md mx-auto mt-20 px-4">
        
        {/* TABS MENU */}
        <div className="flex gap-4 mb-6 bg-[#111] p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab("swap")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'swap' ? 'bg-[#222] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Swap
          </button>
          <button 
            onClick={() => setActiveTab("pool")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'pool' ? 'bg-[#222] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Liquidity
          </button>
        </div>

        {/* SWAP SECTION */}
        {activeTab === "swap" && (
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-2xl relative">
            <div className="bg-[#1a1a1a] p-4 rounded-2xl mb-2 border border-white/5 transition-all focus-within:border-white/20">
              <span className="text-sm text-gray-500 font-medium">You pay</span>
              <div className="flex justify-between items-center mt-2">
                <input 
                  type="number" placeholder="0" 
                  className="bg-transparent text-4xl text-white outline-none w-full font-light"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                />
                <select className="bg-[#222] border border-white/10 text-white px-4 py-2 rounded-full text-sm font-bold outline-none cursor-pointer"
                  value={fromToken.symbol} onChange={(e) => setFromToken(TOKENS.find(t => t.symbol === e.target.value)!)}>
                  {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-center -my-5 relative z-10">
              <div className="bg-[#111] p-2 rounded-xl border border-white/5 hover:border-white/20 cursor-pointer transition-colors">
                <ChevronDown className="text-gray-400" size={20} />
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-2xl mb-4 border border-white/5">
              <span className="text-sm text-gray-500 font-medium">You receive</span>
              <div className="flex justify-between items-center mt-2">
                <input type="number" placeholder="0" className="bg-transparent text-4xl text-gray-500 outline-none w-full font-light" disabled />
                <select className="bg-[#222] border border-white/10 text-white px-4 py-2 rounded-full text-sm font-bold outline-none cursor-pointer"
                  value={toToken.symbol} onChange={(e) => setToToken(TOKENS.find(t => t.symbol === e.target.value)!)}>
                  {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleSwap} disabled={isSwapping || !amount}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSwapping ? <Zap className="animate-pulse" /> : "Swap"}
            </button>
          </div>
        )}

        {/* POOLS SECTION */}
        {activeTab === "pool" && (
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-2xl relative">
            <div className="mb-6 flex items-center justify-between">
               <h2 className="text-xl font-bold text-white">Add Liquidity</h2>
               <span className="text-xs font-mono bg-[#222] px-2 py-1 rounded text-gray-400 border border-white/5">ERC20 Pair</span>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-2xl mb-2 border border-white/5 transition-all focus-within:border-white/20">
              <span className="text-sm text-gray-500 font-medium">Deposit {poolTokenA.symbol}</span>
              <div className="flex justify-between items-center mt-2">
                <input 
                  type="number" placeholder="0.0" 
                  className="bg-transparent text-3xl text-white outline-none w-full font-light"
                  value={amountA} onChange={(e) => setAmountA(e.target.value)}
                />
                <select className="bg-[#222] border border-white/10 text-white px-4 py-2 rounded-full text-sm font-bold outline-none cursor-pointer"
                  value={poolTokenA.symbol} onChange={(e) => setPoolTokenA(TOKENS.find(t => t.symbol === e.target.value)!)}>
                  {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-center -my-5 relative z-10">
              <div className="bg-[#111] p-2 rounded-xl border border-white/5">
                <Plus className="text-gray-400" size={20} />
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-2xl mb-6 border border-white/5 transition-all focus-within:border-white/20">
              <span className="text-sm text-gray-500 font-medium">Deposit {poolTokenB.symbol}</span>
              <div className="flex justify-between items-center mt-2">
                <input 
                  type="number" placeholder="0.0" 
                  className="bg-transparent text-3xl text-white outline-none w-full font-light"
                  value={amountB} onChange={(e) => setAmountB(e.target.value)}
                />
                <select className="bg-[#222] border border-white/10 text-white px-4 py-2 rounded-full text-sm font-bold outline-none cursor-pointer"
                  value={poolTokenB.symbol} onChange={(e) => setPoolTokenB(TOKENS.find(t => t.symbol === e.target.value)!)}>
                  {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleAddLiquidity} disabled={isAddingLiquidity || !amountA || !amountB}
              className="w-full bg-[#333] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#444] transition-colors disabled:opacity-50"
            >
              Approve & Add Liquidity
            </button>
          </div>
        )}
      </main>
    </div>
  );
}