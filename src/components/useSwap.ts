import { useEffect, useState, useCallback } from "react";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { publicClient, getWalletClient, getToken, litvmChain } from "@/lib/chain";
import {
  UNISWAP_V2_ROUTER_ABI,
} from "@/lib/abis";
import { DEX_CONFIG, isDexDeployed } from "@/lib/dex-config";
import { toast } from "sonner";

// Loose typing: viem's overloaded generics are noisy here; we wrap once.
const readContract = (args: unknown) =>
  (publicClient as unknown as { readContract: (a: unknown) => Promise<unknown> }).readContract(args);
const writeContract = (
  wallet: NonNullable<ReturnType<typeof getWalletClient>>,
  args: unknown
) =>
  (wallet as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract(args);

/**
 * Resolve the on-chain address for a token.
 * - Native (zkLTC) maps to the WETH (WLTC) wrapper for path building.
 * - ERC20 tokens use their registry address.
 */
const resolveAddress = (symbol: string): `0x${string}` | null => {
  const t = getToken(symbol);
  if (t.address) return t.address;
  if (t.symbol === "zkLTC" || t.symbol === "WLTC") return DEX_CONFIG.weth;
  return null;
};

const isNative = (symbol: string) => getToken(symbol).symbol === "zkLTC";

export type Quote = {
  amountOut: string;       // formatted
  amountOutWei: bigint;
  minOut: string;          // formatted, after slippage
  minOutWei: bigint;
  priceImpact: number;     // unused for now (needs reserves) — placeholder
};

export const useSwapQuote = (
  fromSym: string,
  toSym: string,
  amountIn: string,
  slippagePct: number
) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDexDeployed() || !amountIn || parseFloat(amountIn) <= 0) {
      setQuote(null);
      setError(null);
      return;
    }
    const router = DEX_CONFIG.router!;
    const tokenIn = resolveAddress(fromSym);
    const tokenOut = resolveAddress(toSym);
    const fromToken = getToken(fromSym);
    const toToken = getToken(toSym);
    if (!tokenIn || !tokenOut) {
      setError("Token not configured");
      setQuote(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const amountInWei = parseUnits(amountIn, fromToken.decimals);
        const path = [tokenIn, tokenOut] as `0x${string}`[];

        const amounts = (await readContract({
          address: router,
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: "getAmountsOut",
          args: [amountInWei, path],
        })) as bigint[];

        const out = amounts[amounts.length - 1];
        const minOut = (out * BigInt(Math.floor((1 - slippagePct / 100) * 10_000))) / 10_000n;

        if (cancelled) return;
        setQuote({
          amountOut: formatUnits(out, toToken.decimals),
          amountOutWei: out,
          minOut: formatUnits(minOut, toToken.decimals),
          minOutWei: minOut,
          priceImpact: 0,
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Quote failed";
        setError(msg);
        setQuote(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [fromSym, toSym, amountIn, slippagePct]);

  return { quote, loading, error };
};

export const useSwap = () => {
  const [pending, setPending] = useState(false);

  const swap = useCallback(async (params: {
    fromSym: string;
    toSym: string;
    amountIn: string;
    minOutWei: bigint;
    account: `0x${string}`;
  }) => {
    if (!isDexDeployed()) {
      toast.error("DEX not deployed yet", {
        description: "Run the Hardhat deploy script and fill src/lib/dex-config.ts.",
      });
      return;
    }
    const wallet = getWalletClient();
    if (!wallet) {
      toast.error("No wallet provider");
      return;
    }
    const router = DEX_CONFIG.router!;
    const weth = DEX_CONFIG.weth!;
    const fromToken = getToken(params.fromSym);
    const toToken = getToken(params.toSym);
    const tokenIn = resolveAddress(params.fromSym)!;
    const tokenOut = resolveAddress(params.toSym)!;
    const amountInWei = parseUnits(params.amountIn, fromToken.decimals);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    const path = [tokenIn, tokenOut] as `0x${string}`[];

    setPending(true);
    try {
      // 1. ERC20 approve if non-native
      if (!isNative(params.fromSym)) {
        toast.loading("Approving token…", { id: "swap" });
        const allowance = (await readContract({
          address: tokenIn,
          abi: erc20Abi,
          functionName: "allowance",
          args: [params.account, router],
        })) as bigint;
        if (allowance < amountInWei) {
          const approveHash = await writeContract(wallet, {
            account: params.account,
            chain: litvmChain,
            address: tokenIn,
            abi: erc20Abi,
            functionName: "approve",
            args: [router, amountInWei],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // 2. Swap
      toast.loading("Submitting swap…", { id: "swap" });
      let hash: `0x${string}`;
      if (isNative(params.fromSym)) {
        // ETH (zkLTC) → token via WETH path
        const ethPath = [weth, tokenOut] as `0x${string}`[];
        hash = await writeContract(wallet, {
          account: params.account,
          chain: litvmChain,
          address: router,
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: "swapExactETHForTokens",
          args: [params.minOutWei, ethPath, params.account, deadline],
          value: amountInWei,
        });
      } else if (toToken.symbol === "zkLTC") {
        const ethPath = [tokenIn, weth] as `0x${string}`[];
        hash = await writeContract(wallet, {
          account: params.account,
          chain: litvmChain,
          address: router,
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: "swapExactTokensForETH",
          args: [amountInWei, params.minOutWei, ethPath, params.account, deadline],
        });
      } else {
        hash = await writeContract(wallet, {
          account: params.account,
          chain: litvmChain,
          address: router,
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: "swapExactTokensForTokens",
          args: [amountInWei, params.minOutWei, path, params.account, deadline],
        });
      }

      toast.loading("Confirming…", { id: "swap" });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      toast.success("Swap confirmed", {
        id: "swap",
        description: `Block ${receipt.blockNumber}`,
      });
      return receipt;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Swap failed";
      toast.error("Swap failed", { id: "swap", description: msg.slice(0, 120) });
    } finally {
      setPending(false);
    }
  }, []);

  return { swap, pending };
};
