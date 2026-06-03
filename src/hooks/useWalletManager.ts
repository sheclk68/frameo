"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import type { ChainKey } from "@/lib/swap";

export type WalletType = "evm" | "solana";

/**
 * Unified wallet manager — wraps both EVM (useWallet) and Solana (useSolanaWallet)
 * so pages can switch between them without duplicating logic.
 *
 * Key features:
 * - `activeType` / `address` / `shortAddress` / `isConnected` — always point to the active wallet
 * - `bothConnected` — true when both EVM and Solana wallets are connected
 * - `switchTo(type)` — switch active wallet without re-connecting
 * - `ensureWalletForChain(chainKey)` — call when user changes chain
 * - Underlying `evmWallet` / `solanaWallet` exposed for advanced usage (sendTransaction etc.)
 */
export function useWalletManager() {
  const evmWallet = useWallet();
  const solanaWallet = useSolanaWallet();
  const [preferredType, setPreferredType] = useState<WalletType | null>(null);

  // Auto-detect active wallet type
  const activeType = useMemo<WalletType | null>(() => {
    if (preferredType === "evm" && evmWallet.walletConnected) return "evm";
    if (preferredType === "solana" && solanaWallet.walletConnected) return "solana";
    if (evmWallet.walletConnected) return "evm";
    if (solanaWallet.walletConnected) return "solana";
    return null;
  }, [preferredType, evmWallet.walletConnected, solanaWallet.walletConnected]);

  // Auto-set preferred on first connect
  useEffect(() => {
    if (!preferredType) {
      if (evmWallet.walletConnected) setPreferredType("evm");
      else if (solanaWallet.walletConnected) setPreferredType("solana");
    }
  }, [evmWallet.walletConnected, solanaWallet.walletConnected, preferredType]);

  const address = useMemo(() => {
    if (activeType === "evm") return evmWallet.address;
    if (activeType === "solana") return solanaWallet.publicKey;
    return null;
  }, [activeType, evmWallet.address, solanaWallet.publicKey]);

  const shortAddress = useMemo(() => {
    if (!address) return null;
    return `${String(address).slice(0, 6)}...${String(address).slice(-4)}`;
  }, [address]);

  const isConnected = activeType !== null;
  const bothConnected = evmWallet.walletConnected && solanaWallet.walletConnected;

  /** Connect a wallet type (opens provider popup) */
  const connect = useCallback(
    async (type: WalletType) => {
      if (type === "solana") {
        await solanaWallet.connect();
        setPreferredType("solana");
      } else {
        await evmWallet.connectBrowserWallet();
        setPreferredType("evm");
      }
    },
    [evmWallet, solanaWallet]
  );

  /** Disconnect the active wallet */
  const disconnect = useCallback(() => {
    if (activeType === "solana") {
      solanaWallet.disconnect();
    } else {
      evmWallet.disconnectBrowserWallet();
    }
    setPreferredType(null);
  }, [activeType, evmWallet, solanaWallet]);

  /**
   * Switch active wallet (without re-connecting).
   * Returns false if the target type is not connected.
   */
  const switchTo = useCallback(
    (type: WalletType): boolean => {
      if (type === "solana" && solanaWallet.walletConnected) {
        setPreferredType("solana");
        return true;
      }
      if (type === "evm" && evmWallet.walletConnected) {
        setPreferredType("evm");
        return true;
      }
      return false;
    },
    [evmWallet.walletConnected, solanaWallet.walletConnected]
  );

  /**
   * Call when user changes chain — activates the matching wallet if already connected.
   * Returns true if the wallet was already connected and activated.
   */
  const ensureWalletForChain = useCallback(
    (chainKey: ChainKey): boolean => {
      if (chainKey === "solana") {
        if (solanaWallet.walletConnected) {
          setPreferredType("solana");
          return true;
        }
      } else {
        if (evmWallet.walletConnected) {
          setPreferredType("evm");
          return true;
        }
      }
      return false;
    },
    [evmWallet.walletConnected, solanaWallet.walletConnected]
  );

  return {
    // Active wallet info
    activeType,
    address,
    shortAddress,
    isConnected,
    bothConnected,

    // Underlying wallets (passthrough for sendTransaction etc.)
    evmWallet,
    solanaWallet,

    // Actions
    connect,
    disconnect,
    switchTo,
    ensureWalletForChain,
    setPreferredType,
  };
}
