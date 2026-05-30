"use client";

import { useEffect, useState, useCallback } from "react";
import {
  createWalletClient,
  createPublicClient,
  custom,
  type WalletClient,
  type PublicClient,
  type Address,
  type Hash,
} from "viem";
import { base, arbitrum, type Chain } from "viem/chains";
import { sdk } from "@farcaster/miniapp-sdk";

const SUPPORTED_CHAINS: Record<number, Chain> = {
  8453: base,
  42161: arbitrum,
};

interface WalletState {
  client: WalletClient | null;
  publicClient: PublicClient | null;
  address: Address | null;
  chainId: number | null;
  isReady: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    client: null,
    publicClient: null,
    address: null,
    chainId: null,
    isReady: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const provider = await sdk.wallet.getEthereumProvider();
        if (!provider || cancelled) return;

        // Detect current chain; default to Base if unknown
        const client = createWalletClient({
          chain: base,
          transport: custom(provider),
        });

        let chainId: number;
        try {
          chainId = await client.getChainId();
        } catch {
          chainId = 8453; // fallback to Base
        }

        const chain = SUPPORTED_CHAINS[chainId] ?? base;

        const walletClient = createWalletClient({
          chain,
          transport: custom(provider),
        });

        const publicClient = createPublicClient({
          chain,
          transport: custom(provider),
        });

        // Request accounts
        let address: string | undefined;
        try {
          const [addr] = await walletClient.requestAddresses();
          address = addr;
        } catch {
          // Wallet may reject if not in Farcaster context
        }

        if (!cancelled) {
          setState({
            client: walletClient as unknown as WalletClient,
            publicClient: publicClient as unknown as PublicClient,
            address: (address as Address) || null,
            chainId,
            isReady: true,
            error: address ? null : "No address returned from wallet",
          });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Wallet init failed";
          setState((prev) => ({ ...prev, isReady: true, error: msg }));
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendTransaction = useCallback(
    async (to: Address, data: Hash, value: bigint = 0n): Promise<Hash> => {
      if (!state.client || !state.address) {
        throw new Error("Wallet not connected");
      }

      const chain = state.chainId && SUPPORTED_CHAINS[state.chainId]
        ? SUPPORTED_CHAINS[state.chainId]
        : base;

      const hash = await state.client.sendTransaction({
        to,
        data,
        value,
        account: state.address,
        chain,
      });

      return hash;
    },
    [state.client, state.address, state.chainId]
  );

  const waitForReceipt = useCallback(
    async (hash: Hash) => {
      if (!state.publicClient) throw new Error("Wallet not connected");
      return state.publicClient.waitForTransactionReceipt({ hash });
    },
    [state.publicClient]
  );

  return {
    ...state,
    sendTransaction,
    waitForReceipt,
    isBase: state.chainId === 8453,
    isArbitrum: state.chainId === 42161,
  };
}
