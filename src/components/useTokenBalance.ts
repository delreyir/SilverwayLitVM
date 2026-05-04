import { useEffect, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { publicClient, getToken } from "@/lib/chain";

/**
 * Read a wallet's balance for a given token symbol from LitVM.
 * - Native (address === null) → eth_getBalance
 * - ERC20 → balanceOf
 * Returns formatted string + raw bigint. Refreshes every `pollMs` (default 15s).
 */
export const useTokenBalance = (symbol: string, address?: string | null, pollMs = 15_000) => {
  const [balance, setBalance] = useState<string>("0");
  const [raw, setRaw] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBalance("0");
      setRaw(0n);
      return;
    }
    const token = getToken(symbol);
    let cancelled = false;

    const read = async () => {
      try {
        setLoading(true);
        let value: bigint = 0n;
        if (token.address === null) {
          value = await publicClient.getBalance({ address: address as `0x${string}` });
        } else {
          value = (await (publicClient as unknown as {
            readContract: (args: unknown) => Promise<bigint>;
          }).readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          })) as bigint;
        }
        if (cancelled) return;
        setRaw(value);
        setBalance(formatUnits(value, token.decimals));
      } catch {
        if (cancelled) return;
        setRaw(0n);
        setBalance("0");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    read();
    const id = setInterval(read, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, address, pollMs]);

  return { balance, raw, loading };
};
