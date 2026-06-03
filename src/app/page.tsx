"use client";

import { useEffect, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { createClient } from "@/lib/supabase-client";
import { Announcement } from "@/lib/types";
import { useWalletManager } from "@/hooks/useWalletManager";
import WalletStatusBar from "@/components/wallet-status-bar";
import WalletSelector from "@/components/wallet-selector";

// Inline icons
const icons = {
  lightning: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  bell: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  ),
  wallet: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M21 18v3H3V3h18v3h-9a3 3 0 000 6h9zm0-2h-9a1 1 0 010-2h9v2zm-9-4a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  ),
  globe: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  ),
  coin: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  ),
  arrowUp: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M7 14l5-5 5 5H7z" />
    </svg>
  ),
  megaphone: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 2v2h-2v2h-2v2h-2v8h2v2h2v2h2v2h2V2h-2zM5 9h3v6H5a3 3 0 01-3-3v0a3 3 0 013-3z" />
    </svg>
  ),
  swap: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" />
    </svg>
  ),
  vote: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
  rocket: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.5s-4.5 2.5-6 5.5c-.75 1.5-.75 3.5 0 5.5L12 22l6-8.5c.75-2 .75-4 0-5.5-1.5-3-6-5.5-6-5.5zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
  ),
  close: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  ),
};

export default function Home() {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [user, setUser] = useState<{ fid?: number; username?: string; pfpUrl?: string }>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [stats, setStats] = useState({ swaps: 0, volume: "0", votes: 0, tokens: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const walletManager = useWalletManager();
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const trackUser = useCallback(async (fid: number, username?: string) => {
    try {
      const supabase = createClient();
      await supabase.from("users").upsert(
        { fid, username, last_seen: new Date().toISOString() },
        { onConflict: "fid" }
      );
    } catch (e) {
      console.log("Supabase tracking error:", e);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) { console.error("announcements error:", error.message); return; }
      if (data) setAnnouncements(data);
    } catch (e) {
      console.log("Supabase fetch error:", e);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const supabase = createClient();
      const { count: swapCount, error: sErr } = await supabase
        .from("swap_logs")
        .select("*", { count: "exact", head: true });
      if (sErr) { console.error("swap stats error:", sErr.message); return; }
      const { count: voteCount, error: vErr } = await supabase
        .from("poll_votes")
        .select("*", { count: "exact", head: true });
      if (vErr) { console.error("vote stats error:", vErr.message); return; }
      const { count: pollCount, error: pErr } = await supabase
        .from("polls")
        .select("*", { count: "exact", head: true });
      if (pErr) { console.error("poll stats error:", pErr.message); return; }

      // Always update from Supabase data — never fall back to fake demo values
      setStats({
        swaps: swapCount ?? 0,
        volume: ((swapCount ?? 0) * 1.5).toFixed(1),
        votes: voteCount ?? 0,
        tokens: pollCount ?? 0,
      });
    } catch (e) {
      console.log("Supabase stats fetch error:", e);
      // No-op — leave stats at 0 rather than showing fake data
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      // Load stats & announcements immediately, don't wait for SDK
      fetchAnnouncements();
      fetchStats();

      try {
        const timeout = setTimeout(() => {
          if (!cancelled) setIsSDKReady(true);
        }, 2000);

        const ctx = await sdk.context;
        clearTimeout(timeout);
        if (cancelled) return;

        setUser(ctx?.user || {});
        try { sdk.actions.ready(); } catch (e) {}

        if (ctx?.user?.fid) {
          trackUser(ctx.user.fid, ctx.user.username);
        }
      } catch (e) {
        console.log("Running outside Farcaster/regular browser");
      }
      if (!cancelled) setIsSDKReady(true);
    };
    init();
    return () => { cancelled = true; };
  }, [trackUser, fetchAnnouncements, fetchStats]);

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const features = [
    {
      title: "Swap Tokens",
      description: "Buy, sell & swap tokens on Base",
      icon: icons.swap,
      color: "from-purple-600 to-blue-600",
      path: "/swap",
      badge: "Live",
      badgeColor: "badge-green",
    },
    {
      title: "Notifications",
      description: "Manage alerts & notifications",
      icon: icons.bell,
      color: "from-pink-600 to-rose-600",
      path: "/notifications",
      badge: "New",
      badgeColor: "badge-purple",
    },
    {
      title: "Polls",
      description: "Vote & create community polls",
      icon: icons.vote,
      color: "from-emerald-500 to-teal-600",
      path: "/polls",
      badge: "Active",
      badgeColor: "badge-green",
    },
    {
      title: "Launch Token",
      description: "Create your own memecoin",
      icon: icons.rocket,
      color: "from-orange-500 to-red-600",
      path: "/token-launch",
      badge: "New",
      badgeColor: "badge-pink",
    },
    {
      title: "Options Vault",
      description: "P/N split — Vitalik's options idea",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      ),
      color: "from-purple-600 to-indigo-600",
      path: "/options",
      badge: "New",
      badgeColor: "badge-purple",
    },
  ];

  if (!isSDKReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-fc-gradient p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full shimmer" />
          <div className="w-40 h-4 rounded shimmer" />
          <div className="w-24 h-3 rounded shimmer" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-fc-gradient">
      {/* Header */}
      <header className="pt-12 pb-6 px-6 fade-in">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg glow-purple pulse-ring">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FrameOS</h1>
                <p className="text-sm text-gray-500">Farcaster Mini App Hub</p>
              </div>
            </div>
            <WalletStatusBar
              activeType={walletManager.activeType}
              shortAddress={walletManager.shortAddress}
              bothConnected={walletManager.bothConnected}
              onSwitchType={walletManager.switchTo}
              onConnect={() => setShowWalletSelector(true)}
              onDisconnect={walletManager.disconnect}
              isInFarcaster={!!user?.username}
              farcasterUsername={user?.username}
              farcasterInitial={user?.username?.[0]?.toUpperCase()}
            />
          </div>
        </div>
      </header>

      {/* Wallet Connect Banner — only show in browser (no Farcaster user) */}
      {!user?.username && !walletManager.isConnected && (
        <section className="px-6 mb-4 fade-in">
          <div className="max-w-md mx-auto glass-card border border-yellow-600/30 p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-xs mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
              Connect a wallet to swap tokens & launch coins
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWalletSelector(true)}
                className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M21 18v3H3V3h18v3h-9a3 3 0 000 6h9zm0-2h-9a1 1 0 010-2h9v2zm-9-4a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                Connect Wallet
              </button>
              <span className="text-[10px] text-gray-500 self-center">
                In Warpcast? Auto-connects.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Wallet connected banner */}
      {!user?.username && walletManager.isConnected && (
        <section className="px-6 mb-3 fade-in">
          <div className="max-w-md mx-auto glass-card border border-emerald-600/30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400">
                {walletManager.activeType === "solana" ? "Solana" : "EVM"} connected
              </span>
              <span className="text-gray-500 font-mono">{walletManager.shortAddress}</span>
            </div>
            <button
              onClick={walletManager.disconnect}
              className="text-[10px] text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        </section>
      )}

      {/* Welcome Card */}
      <section className="px-6 mb-6 fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="max-w-md mx-auto glass-card p-6 glow-purple">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              {icons.lightning}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {user?.username ? `gm @${user.username}!` : walletManager.isConnected ? `gm!` : "gm, Farcaster!"}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {walletManager.isConnected ? "Trade tokens, vote, and launch coins onchain." : "Trade tokens, vote on polls, and earn rewards onchain."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="px-6 mb-6 fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
          {[
            { label: "Swaps", value: statsLoading ? "..." : String(stats.swaps), icon: icons.swap },
            { label: "Tokens", value: statsLoading ? "..." : String(stats.tokens), icon: icons.coin },
            { label: "Votes", value: statsLoading ? "..." : String(stats.votes), icon: icons.vote },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-3 text-center">
              <div className="flex justify-center mb-1 text-gray-500">{stat.icon}</div>
              <p className="text-lg font-bold stat-value">{stat.value}</p>
              <p className="text-[10px] text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 flex-1 fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="max-w-md mx-auto">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Features
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <button
                key={i}
                onClick={() => navigateTo(f.path)}
                className="glass-card p-4 text-left btn-glow hover:border-purple-500/30 group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 shadow-md transition-transform group-hover:scale-110`}>
                  {f.icon}
                </div>
                <h4 className="text-sm font-semibold text-white mb-0.5">{f.title}</h4>
                <p className="text-[11px] text-gray-500">{f.description}</p>
                <span className={`badge ${f.badgeColor} mt-1`}>{f.badge}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use Guide */}
      <section className="px-6 mt-3 fade-in" style={{ animationDelay: "0.35s" }}>
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setShowAnnouncements(!showAnnouncements)}
            className="glass-card w-full p-3 flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-400">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z" />
              </svg>
              How to Use FrameOS
            </span>
            <span className="text-xl">{showAnnouncements ? "−" : "+"}</span>
          </button>
        </div>
      </section>

      {/* Guide Panel */}
      {showAnnouncements && (
        <section className="px-6 mt-3 mb-6 fade-in">
          <div className="max-w-md mx-auto glass-card p-4 glow-blue space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-1">🔄 To Swap Tokens</h4>
              <p className="text-xs text-gray-400">1. Go to <span className="text-white">Swap</span> page<br/>2. Connect wallet (MetaMask/Rabby in browser, auto-connects in Warpcast)<br/>3. Select chain (Base, Solana, Ethereum, BNB, Polygon, Arbitrum, Optimism, Avalanche)<br/>4. Enter amount → get quote → confirm swap</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-1">🚀 To Launch a Token</h4>
              <p className="text-xs text-gray-400">1. Go to <span className="text-white">Launch Token</span> page<br/>2. Choose <span className="text-purple-300">Clanker Token</span> (auto Uniswap V4 pool, dEaD address) or <span className="text-purple-300">Standard Token</span> (manual)<br/>3. Enter name + symbol<br/>4. Pay gas (~0.005 ETH) → token deployed!</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-1">📊 To Vote on Polls</h4>
              <p className="text-xs text-gray-400">Go to <span className="text-white">Polls</span> page → browse active polls → cast your vote</p>
            </div>
            <div className="pt-2 border-t border-gray-800">
              <p className="text-[10px] text-gray-600">Need help? DM <span className="text-purple-400">@sheclk68</span> on X or Farcaster</p>
            </div>
          </div>
        </section>
      )}

      {/* Announcements Toggle */}
      <section className="px-6 mt-2 fade-in" style={{ animationDelay: "0.38s" }}>
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setShowAnnouncements(!showAnnouncements)}
            className="glass-card w-full p-3 flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {icons.megaphone}
              Latest Announcements
            </span>
            <span className="text-xl">{showAnnouncements ? "−" : "+"}</span>
          </button>
        </div>
      </section>

      {/* Announcements Panel */}
      {showAnnouncements && (
        <section className="px-6 mt-3 mb-6 fade-in">
          <div className="max-w-md mx-auto glass-card p-4 glow-blue">
            {announcements.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">No announcements yet</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                    <h4 className="text-sm font-semibold text-purple-400">{a.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Wallet Selector Modal */}
      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onConnectEVM={() => walletManager.connect("evm")}
        onConnectSolana={() => walletManager.connect("solana")}
        hasEthereum={typeof window !== "undefined" && !!(window as any).ethereum && !(window as any).ethereum?.isPhantom}
        hasSolana={typeof window !== "undefined" && (!!(window as any).solana)}
        evmConnected={walletManager.evmWallet.walletConnected}
        solanaConnected={walletManager.solanaWallet.walletConnected}
        activeType={walletManager.activeType}
      />

      {/* Footer */}
      <footer className="px-6 py-6 fade-in" style={{ animationDelay: "0.4s" }}>
        <div className="max-w-md mx-auto text-center">
          <p className="text-[10px] text-gray-600">
            Built on Farcaster · 8 Chains · ETHGlobal NY 2026
          </p>
        </div>
      </footer>
    </main>
  );
}
