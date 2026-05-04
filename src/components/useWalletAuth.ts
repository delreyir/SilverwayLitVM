import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { ensureLitVMNetwork, LITVM_CHAIN_ID } from "@/lib/network";

type EthProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthProvider;
  }
}

export type WalletProfile = {
  user_id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
  chain_id: number | null;
};

export const useWalletAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Auth state listener — set up FIRST, then fetch session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("user_id, wallet_address, display_name, avatar_url, chain_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as WalletProfile);
      });
  }, [user]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("No wallet detected", {
        description: "Install MetaMask wla wallet okhra m3a EIP-1193.",
      });
      return;
    }
    setLoading(true);
    try {
      // 1. Request accounts
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts?.[0];
      if (!address) throw new Error("No account selected");

      // 2. Ensure wallet is on LitVM LiteForge (switch or add network)
      const chainId = await ensureLitVMNetwork(window.ethereum);
      if (chainId !== LITVM_CHAIN_ID) {
        throw new Error("Please switch to LitVM LiteForge to continue");
      }

      // 3. Get nonce + SIWE message from server
      const { data: nonceData, error: nonceErr } = await supabase.functions.invoke("siwe-nonce", {
        body: {
          address,
          chainId,
          domain: window.location.host,
          uri: window.location.origin,
        },
      });
      if (nonceErr || !nonceData?.message) {
        throw new Error(nonceErr?.message || "Failed to get nonce");
      }

      const message = nonceData.message as string;

      // 4. Sign the message
      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;

      // 5. Verify on server → receive a hashed_token to redeem session
      const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
        "siwe-verify",
        { body: { message, signature } }
      );
      if (verifyErr || !verifyData?.success) {
        throw new Error(verifyErr?.message || verifyData?.error || "Verification failed");
      }

      // 6. Exchange the hashed token for a session
      const { error: otpErr } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: verifyData.hashed_token,
      });
      if (otpErr) throw otpErr;

      toast.success("Wallet connected", {
        description: `${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      // User rejected signature
      if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("denied")) {
        toast.error("Signature rejected");
      } else {
        toast.error("Connection failed", { description: msg });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await supabase.auth.signOut();
    toast.success("Disconnected");
  }, []);

  return { session, user, profile, loading, connect, disconnect, isConnected: !!session };
};
