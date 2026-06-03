"use client";

import { useEffect, useState } from "react";
import type { WalletClient, PublicClient, Address } from "viem";

export type WalletType = "evm" | "solana";

export interface ConnectedWallet {
  type: WalletType;
  address: string;
  label: string;
  icon: string;
}

// Icons
const metamaskIcon = (
  <svg viewBox="0 0 35 33" fill="none" className="w-5 h-5">
    <path d="M32.958.001l-14.08 10.46L20.61 4.01 32.958.001z" fill="#E17726" stroke="#E17726" strokeWidth=".2"/>
    <path d="M2.662.001l13.97 10.56L14.01 4.01 2.662.001z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M28.19 23.72l-3.74 5.73 8.02 2.22 2.31-7.82-6.59-.13z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M.402 23.85l2.29 7.82 8.02-2.22-3.74-5.73-6.57.13z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M10.13 14.47l-2.23 3.37 7.97.36-.29-8.57-5.45 4.84z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M24.49 14.47l-5.53-4.88-.2 8.6 7.96-.36-2.23-3.36z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M10.33 29.45l4.83-2.34-4.16-3.26-.67 5.6z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M20.05 27.11l4.83 2.34-.68-5.6-4.15 3.26z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M24.88 29.45l-4.83-2.34.39 3.14-.04 1.33 4.48-2.13z" fill="#D7BFDC" stroke="#D7BFDC" strokeWidth=".2"/>
    <path d="M10.33 29.45l4.49 2.13-.03-1.33.38-3.14-4.84 2.34z" fill="#D7BFDC" stroke="#D7BFDC" strokeWidth=".2"/>
    <path d="M14.64 22.12l-4.02-1.18 2.84-1.3 1.18 2.48z" fill="#233447" stroke="#233447" strokeWidth=".2"/>
    <path d="M20.56 22.12l1.18-2.48 2.85 1.3-4.03 1.18z" fill="#233447" stroke="#233447" strokeWidth=".2"/>
    <path d="M10.33 29.45l.7-5.73-4.43.13 3.73 5.6z" fill="#CC6228" stroke="#CC6228" strokeWidth=".2"/>
    <path d="M24.17 23.72l.7 5.73 3.73-5.6-4.43-.13z" fill="#CC6228" stroke="#CC6228" strokeWidth=".2"/>
    <path d="M28.19 23.72l-3.97-3.1.62-1.58 3.35-.5v-1.06l-3.35-.5-.75-1.5 2.23-3.37L24.49 14.47l4.71 3.8 1.16 5.45z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M6.8 23.72l1.16-5.45 4.71-3.8-2.23-3.36 2.23 3.37-.75 1.5-3.35.5v1.06l3.35.5.62 1.58-3.97 3.1z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M9.9 20.62l-2.1 3.1 6.59.28-.26-6.86-4.23 3.48z" fill="#CC6228" stroke="#CC6228" strokeWidth=".2"/>
    <path d="M24.3 20.62l-4.33-3.48-.17 6.86 6.6-.28-2.1-3.1z" fill="#CC6228" stroke="#CC6228" strokeWidth=".2"/>
    <path d="M17.67 17.17l.27 4.1.7 4.18h2.12l-1.18-2.48 2.85-1.3 1.18 2.48 1.1-1.65-2.1-3.1-4.43-.23h-.51z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
    <path d="M12.38 20.62l-2.1 3.1 1.1 1.65 1.18-2.48 2.85 1.3-1.18 2.48h2.12l.7-4.18.26-4.1-.51.01-4.42.22z" fill="#E27625" stroke="#E27625" strokeWidth=".2"/>
  </svg>
);

const phantomIcon = (
  <svg viewBox="0 0 128 128" className="w-5 h-5">
    <circle cx="64" cy="64" r="64" fill="#AB9FF2"/>
    <path d="M82.7 45.2c-2.7 0-4.9 2.2-4.9 4.9s2.2 4.9 4.9 4.9 4.9-2.2 4.9-4.9-2.2-4.9-4.9-4.9zm-20.6 0c-2.7 0-4.9 2.2-4.9 4.9s2.2 4.9 4.9 4.9 4.9-2.2 4.9-4.9-2.2-4.9-4.9-4.9zM46.1 62.2c0 10.3 8.4 18.7 18.7 18.7s18.7-8.4 18.7-18.7" fill="#fff"/>
  </svg>
);

const rabbyIcon = (
  <svg viewBox="0 0 128 128" className="w-5 h-5">
    <circle cx="64" cy="64" r="64" fill="#4250FF"/>
    <path d="M72 44h-4c-9.9 0-18 8.1-18 18s8.1 18 18 18h4c2.2 0 4-1.8 4-4V48c0-2.2-1.8-4-4-4z" fill="#fff" opacity="0.9"/>
    <path d="M56 44h-4c-9.9 0-18 8.1-18 18s8.1 18 18 18h4c2.2 0 4-1.8 4-4V48c0-2.2-1.8-4-4-4z" fill="#fff" opacity="0.6"/>
  </svg>
);

export interface WalletOption {
  id: string;
  type: WalletType;
  name: string;
  icon: React.ReactNode;
  detected: boolean;
}

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectEVM: () => void;
  onConnectSolana: () => void;
  hasEthereum: boolean;
  hasSolana: boolean;
  /** Current EVM wallet connected state */
  evmConnected?: boolean;
  /** Current Solana wallet connected state */
  solanaConnected?: boolean;
  /** Currently active wallet type */
  activeType?: "evm" | "solana" | null;
}

export default function WalletSelector({
  isOpen,
  onClose,
  onConnectEVM,
  onConnectSolana,
  hasEthereum,
  hasSolana,
  evmConnected = false,
  solanaConnected = false,
  activeType = null,
}: WalletSelectorProps) {
  if (!isOpen) return null;

  const wallets: WalletOption[] = [
    {
      id: "metamask",
      type: "evm",
      name: "MetaMask",
      icon: metamaskIcon,
      detected: hasEthereum,
    },
    {
      id: "rabby",
      type: "evm",
      name: "Rabby Wallet",
      icon: rabbyIcon,
      detected: hasEthereum,
    },
    {
      id: "phantom",
      type: "solana",
      name: "Phantom",
      icon: phantomIcon,
      detected: hasSolana,
    },
    {
      id: "backpack",
      type: "solana",
      name: "Backpack",
      icon: phantomIcon,
      detected: hasSolana,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="glass-card p-5 w-full max-w-sm glow-purple" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Connect a Wallet</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white cursor-pointer text-lg leading-none">&times;</button>
        </div>

        <p className="text-[10px] text-gray-500 mb-4">
          FrameOS supports EVM wallets (MetaMask, Rabby) for 7 chains and Solana wallets (Phantom) for Solana.
        </p>

        <div className="space-y-2">
          {/* EVM wallets */}
          <div className="mb-1">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">EVM Chains</span>
          </div>
          <button
            onClick={() => {
              onConnectEVM();
              onClose();
            }}
            disabled={!hasEthereum && !evmConnected}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              hasEthereum || evmConnected
                ? "glass-card hover:border-purple-500/30"
                : "glass-card opacity-40 cursor-not-allowed"
            } ${evmConnected && activeType === "evm" ? "border-emerald-500/40" : ""} ${evmConnected ? "bg-emerald-500/5" : ""}`}
          >
            {metamaskIcon}
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium">MetaMask / Rabby</span>
                {evmConnected && activeType === "evm" && (
                  <span className="badge badge-green text-[9px]">Active</span>
                )}
                {evmConnected && activeType !== "evm" && (
                  <span className="badge badge-purple text-[9px]">Connected</span>
                )}
              </div>
              <p className="text-[10px] text-gray-500">Base · ETH · BSC · Polygon · Arbitrum · OP · Avalanche</p>
            </div>
            {!hasEthereum && !evmConnected && <span className="text-[9px] text-gray-600">Not detected</span>}
            {evmConnected && activeType === "evm" && (
              <span className="text-emerald-400 text-xs">●</span>
            )}
            {evmConnected && activeType !== "evm" && (
              <span className="text-[9px] text-emerald-500">✓</span>
            )}
          </button>

          {/* Solana wallets */}
          <div className="mt-3 mb-1">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">Solana</span>
          </div>
          <button
            onClick={() => {
              onConnectSolana();
              onClose();
            }}
            disabled={!hasSolana && !solanaConnected}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              hasSolana || solanaConnected
                ? "glass-card hover:border-purple-500/30"
                : "glass-card opacity-40 cursor-not-allowed"
            } ${solanaConnected && activeType === "solana" ? "border-emerald-500/40" : ""} ${solanaConnected ? "bg-emerald-500/5" : ""}`}
          >
            {phantomIcon}
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium">Phantom / Backpack</span>
                {solanaConnected && activeType === "solana" && (
                  <span className="badge badge-green text-[9px]">Active</span>
                )}
                {solanaConnected && activeType !== "solana" && (
                  <span className="badge badge-purple text-[9px]">Connected</span>
                )}
              </div>
              <p className="text-[10px] text-gray-500">Solana · Jupiter swaps · SPL tokens</p>
            </div>
            {!hasSolana && !solanaConnected && <span className="text-[9px] text-gray-600">Not detected</span>}
            {solanaConnected && activeType === "solana" && (
              <span className="text-emerald-400 text-xs">●</span>
            )}
            {solanaConnected && activeType !== "solana" && (
              <span className="text-[9px] text-emerald-500">✓</span>
            )}
          </button>
        </div>

        <p className="text-[9px] text-gray-600 mt-4 text-center">
          Installing a wallet? Refresh the page after installing.
        </p>
      </div>
    </div>
  );
}
