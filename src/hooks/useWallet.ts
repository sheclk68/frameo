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
  stringToHex,
  concat,
} from "viem";
import { base, arbitrum, bsc, polygon, avalanche, optimism, mainnet, type Chain } from "viem/chains";
import { sdk } from "@farcaster/miniapp-sdk";

/** Base Builder Code for on-chain attribution (ERC-8021) */
const BUILDER_CODE = "bc_o0qmzl3v";
const BUILDER_CODE_SUFFIX = stringToHex(BUILDER_CODE);

const SUPPORTED_CHAINS: Record<number, Chain> = {
  1: mainnet,
  10: optimism,
  56: bsc,
  137: polygon,
  8453: base,
  42161: arbitrum,
  43114: avalanche,
};

interface WalletState {
  client: WalletClient | null;
  publicClient: PublicClient | null;
  address: Address | null;
  chainId: number | null;
  isReady: boolean;
  isBrowserWallet: boolean; // true = regular browser wallet (MetaMask), false = Farcaster SDK
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    client: null,
    publicClient: null,
    address: null,
    chainId: null,
    isReady: false,
    isBrowserWallet: false,
    error: null,
  });

  /** Auto-connect via Farcaster SDK (inside Warpcast) */
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
            isBrowserWallet: false,
            error: address ? null : "No address returned from wallet",
          });
        }
      } catch (e: unknown) {
        // Farcaster SDK failed — that's fine, user can use browser wallet
        if (!cancelled) {
          setState((prev) => ({ ...prev, isReady: true, error: null }));
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Manual connect via browser wallet (MetaMask / Rabby / Coinbase Wallet) */
  const connectBrowserWallet = useCallback(async () => {
    if (typeof window === "undefined") {
      setState((prev) => ({ ...prev, error: "No wallet detected. Install MetaMask or Rabby." }));
      return;
    }

    // Phantom injects window.ethereum too — ignore it, we want real EVM wallets
    const isPhantomEth = (window as any).ethereum?.isPhantom;
    if (!(window as any).ethereum || isPhantomEth) {
      setState((prev) => ({ ...prev, error: isPhantomEth ? "Phantom detected — use MetaMask/Rabby for EVM chains" : "No wallet detected. Install MetaMask or Rabby." }));
      return;
    }

    try {
      const provider = window.ethereum;

      // Request accounts (triggers MetaMask popup)
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      const address = accounts[0] as Address;
      if (!address) {
        setState((prev) => ({ ...prev, error: "No account selected" }));
        return;
      }

      // Get chain ID
      let chainId = 8453;
      try {
        const hexChainId: string = await provider.request({ method: "eth_chainId" });
        chainId = parseInt(hexChainId, 16);
      } catch {
        // use default Base
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

      setState({
        client: walletClient as unknown as WalletClient,
        publicClient: publicClient as unknown as PublicClient,
        address,
        chainId,
        isReady: true,
        isBrowserWallet: true,
        error: null,
      });

      // Listen for account/chain changes
      provider.on("accountsChanged", (newAccounts: string[]) => {
        if (newAccounts.length === 0) {
          // User disconnected
          setState((prev) => ({
            ...prev,
            address: null,
            client: null,
            publicClient: null,
            error: "Wallet disconnected",
          }));
        } else {
          setState((prev) => ({ ...prev, address: newAccounts[0] as Address }));
        }
      });

      provider.on("chainChanged", () => {
        // Reload on chain change (simplest approach)
        window.location.reload();
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connect failed";
      setState((prev) => ({ ...prev, error: msg.includes("rejected") ? "Connection rejected" : msg }));
    }
  }, []);

  const disconnectBrowserWallet = useCallback(() => {
    setState((prev) => ({
      ...prev,
      client: null,
      publicClient: null,
      address: null,
      error: null,
    }));
  }, []);

  const sendTransaction = useCallback(
    async (to: Address, data: Hash, value: bigint = 0n): Promise<Hash> => {
      if (!state.client || !state.address) {
        throw new Error("Wallet not connected");
      }

      const chain = state.chainId && SUPPORTED_CHAINS[state.chainId]
        ? SUPPORTED_CHAINS[state.chainId]
        : base;

      // Append Base Builder Code (ERC-8021) for on-chain attribution
      const isBaseChain = chain.id === 8453;
      const dataWithAttribution = isBaseChain
        ? (concat([data, BUILDER_CODE_SUFFIX]) as Hash)
        : data;

      const hash = await state.client.sendTransaction({
        to,
        data: dataWithAttribution,
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

  const walletConnected = !!state.address;

  return {
    ...state,
    walletConnected,
    connectBrowserWallet,
    disconnectBrowserWallet,
    sendTransaction,
    waitForReceipt,
    isBase: state.chainId === 8453,
    isArbitrum: state.chainId === 42161,
  };
}
