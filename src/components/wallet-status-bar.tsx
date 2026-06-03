"use client";

import type { WalletType } from "@/hooks/useWalletManager";

// Inline icons
const evmIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
  </svg>
);

const solanaIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M4 8h16l-2 4H6L4 8zm2 6h12l-2 4H8l-2-4z" />
  </svg>
);

interface WalletStatusBarProps {
  /** Active wallet type */
  activeType: WalletType | null;
  /** Shortened address to display */
  shortAddress: string | null;
  /** Whether both EVM and Solana wallets are connected */
  bothConnected: boolean;
  /** Switch to the other wallet type */
  onSwitchType: (type: WalletType) => void;
  /** Open wallet selector / connect modal */
  onConnect: () => void;
  /** Disconnect the active wallet */
  onDisconnect: () => void;
  /** True if the app is running inside Warpcast (Farcaster client) */
  isInFarcaster?: boolean;
  /** Farcaster username, if available */
  farcasterUsername?: string;
  /** Farcaster initial */
  farcasterInitial?: string;
}

export default function WalletStatusBar({
  activeType,
  shortAddress,
  bothConnected,
  onSwitchType,
  onConnect,
  onDisconnect,
  isInFarcaster,
  farcasterUsername,
  farcasterInitial,
}: WalletStatusBarProps) {
  // If inside Farcaster, show the Farcaster user badge
  if (isInFarcaster && farcasterUsername) {
    return (
      <div className="flex items-center gap-2 glass-card py-1.5 px-3">
        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
          {farcasterInitial}
        </div>
        <span className="text-xs text-gray-300">@{farcasterUsername}</span>
      </div>
    );
  }

  // Wallet connected — show badge
  if (activeType && shortAddress) {
    return (
      <div className="glass-card py-1.5 px-3 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          {activeType === "solana" ? "SOL" : "EVM"}
        </span>
        <span className="text-xs text-emerald-400 font-mono">{shortAddress}</span>

        {/* Switch button — only if both wallets are connected */}
        {bothConnected && (
          <button
            onClick={() => onSwitchType(activeType === "solana" ? "evm" : "solana")}
            className="text-[10px] text-purple-400 hover:text-purple-300 ml-1 px-1.5 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 transition-colors cursor-pointer"
            title={`Switch to ${activeType === "solana" ? "EVM" : "Solana"} wallet`}
          >
            ⇄ {activeType === "solana" ? "EVM" : "SOL"}
          </button>
        )}

        <button
          onClick={onDisconnect}
          className="text-gray-500 hover:text-red-400 ml-1 text-sm leading-none cursor-pointer transition-colors"
          title="Disconnect"
        >
          ×
        </button>
      </div>
    );
  }

  // Wallet not yet connected — show Connect button that opens the wallet selector
  return (
    <button
      onClick={onConnect}
      className="glass-card py-1.5 px-3 flex items-center gap-1.5 cursor-pointer hover:border-purple-500/30 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-purple-400">
        <path d="M21 18v3H3V3h18v3h-9a3 3 0 000 6h9zm0-2h-9a1 1 0 010-2h9v2zm-9-4a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
      <span className="text-xs text-purple-400">Connect</span>
    </button>
  );
}
