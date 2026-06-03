"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Connection,
  type PublicKey,
  type VersionedTransaction,
  type TransactionSignature,
} from "@solana/web3.js";

const SOLANA_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC ||
  "https://api.mainnet-beta.solana.com";

export const SOLANA_CHAIN_ID = 101;

/** Minimal provider interface for Phantom/Backpack/etc */
interface SolanaProvider {
  publicKey: { toBytes(): Uint8Array; toString(): string };
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction<T extends VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends VersionedTransaction>(txs: T[]): Promise<T[]>;
  signAndSendTransaction<T extends VersionedTransaction>(
    tx: T
  ): Promise<{ signature: TransactionSignature }>;
  signMessage(msg: Uint8Array): Promise<{ signature: Uint8Array }>;
  isConnected?: boolean;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
    phantom?: { solana: SolanaProvider };
  }
}

interface SolanaWalletState {
  provider: SolanaProvider | null;
  connection: Connection | null;
  publicKey: string | null;
  isReady: boolean;
  isConnected: boolean;
  error: string | null;
}

export function useSolanaWallet() {
  const [state, setState] = useState<SolanaWalletState>({
    provider: null,
    connection: null,
    publicKey: null,
    isReady: false,
    isConnected: false,
    error: null,
  });

  /** Detect Solana provider from window */
  useEffect(() => {
    const conn = new Connection(SOLANA_RPC);

    // Try Phantom first, then window.solana
    const provider: SolanaProvider | undefined =
      (window as any).phantom?.solana ?? (window as any).solana;

    if (!provider) {
      setState((prev) => ({
        ...prev,
        isReady: true,
        connection: conn,
        error: null, // not an error, just no wallet
      }));
      return;
    }

    const onConnect = () => {
      if (provider.publicKey) {
        setState((prev) => ({
          ...prev,
          provider,
          publicKey: provider.publicKey.toString(),
          isConnected: true,
          error: null,
        }));
      }
    };

    const onDisconnect = () => {
      setState((prev) => ({
        ...prev,
        publicKey: null,
        isConnected: false,
      }));
    };

    // Check if already connected
    if (provider.publicKey && provider.isConnected) {
      setState({
        provider,
        connection: conn,
        publicKey: provider.publicKey.toString(),
        isReady: true,
        isConnected: true,
        error: null,
      });
    } else {
      setState((prev) => ({
        ...prev,
        provider,
        connection: conn,
        isReady: true,
      }));
    }

    provider.on("connect", onConnect);
    provider.on("disconnect", onDisconnect);

    return () => {
      provider.off("connect", onConnect);
      provider.off("disconnect", onDisconnect);
    };
  }, []);

  /** Connect to Solana wallet (triggers Phantom popup) */
  const connect = useCallback(async () => {
    // Try phantom.solana first, fallback to window.solana
    const provider: SolanaProvider | undefined =
      (window as any).phantom?.solana ?? (window as any).solana;

    if (!provider) {
      setState((prev) => ({
        ...prev,
        error: "No Solana wallet detected. Install Phantom or Backpack.",
      }));
      return;
    }

    try {
      const { publicKey } = await provider.connect();
      setState((prev) => ({
        ...prev,
        provider,
        publicKey: publicKey.toString(),
        isConnected: true,
        error: null,
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connect failed";
      setState((prev) => ({
        ...prev,
        error: msg.includes("rejected") ? "Connection rejected" : msg,
      }));
    }
  }, []);

  /** Disconnect wallet */
  const disconnect = useCallback(async () => {
    if (!state.provider) return;
    try {
      await state.provider.disconnect();
    } catch {
      // ignore
    }
    setState((prev) => ({
      ...prev,
      publicKey: null,
      isConnected: false,
      error: null,
    }));
  }, [state.provider]);

  /** Sign and send a transaction */
  const signAndSendTx = useCallback(
    async (transaction: VersionedTransaction): Promise<string> => {
      if (!state.provider) throw new Error("Solana wallet not connected");

      const { signature } = await state.provider.signAndSendTransaction(
        transaction
      );
      return signature;
    },
    [state.provider]
  );

  /** Sign a transaction (returns signed transaction) */
  const signTx = useCallback(
    async <T extends VersionedTransaction>(transaction: T): Promise<T> => {
      if (!state.provider) throw new Error("Solana wallet not connected");
      return state.provider.signTransaction(transaction);
    },
    [state.provider]
  );

  const walletConnected = state.isConnected && !!state.publicKey;

  return {
    ...state,
    walletConnected,
    connect,
    disconnect,
    signAndSendTx,
    signTx,
  };
}
