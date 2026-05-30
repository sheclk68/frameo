"use client";

import { useEffect, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { createClient } from "@/lib/supabase-client";
import { Announcement } from "@/lib/types";

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
  const [stats, setStats] = useState({ swaps: 0, volume: "0", votes: 0 });

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
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setAnnouncements(data);
    } catch (e) {
      console.log("Supabase fetch error:", e);
    }
  }, []);

  const fetchStats = useCallback(async (fid: number) => {
    try {
      const supabase = createClient();
      // Count swaps
      const { count: swapCount } = await supabase
        .from("swap_logs")
        .select("*", { count: "exact", head: true })
        .eq("fid", fid);
      // Sum swap volume (from_amount)
      const { data: swapData } = await supabase
        .from("swap_logs")
        .select("from_amount, from_token")
        .eq("fid", fid);
      // Count votes
      const { count: voteCount } = await supabase
        .from("poll_votes")
        .select("*", { count: "exact", head: true })
        .eq("fid", fid);

      const totalSwaps = swapCount || 0;
      const totalVolume = swapData
        ? swapData.reduce((acc, s) => acc + (parseFloat(s.from_amount) || 0), 0).toFixed(2)
        : "0";
      setStats({ swaps: totalSwaps, volume: totalVolume, votes: voteCount || 0 });
    } catch (e) {
      console.log("Stats fetch error:", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        // Timeout after 3 seconds to prevent white screen
        const timeout = setTimeout(() => {
          if (!cancelled) setIsSDKReady(true);
        }, 3000);

        const ctx = await sdk.context;
        clearTimeout(timeout);
        if (cancelled) return;

        setUser(ctx?.user || {});
        try { sdk.actions.ready(); } catch (e) {}

        if (ctx?.user?.fid) {
          trackUser(ctx.user.fid, ctx.user.username);
          fetchAnnouncements();
          fetchStats(ctx.user.fid);
        }
      } catch (e) {
        console.log("Running outside Farcaster client or SDK error:", e);
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg glow-purple pulse-ring">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">FrameOS</h1>
                <p className="text-xs text-gray-500">Farcaster Mini App Hub</p>
              </div>
            </div>
            {user?.username && (
              <div className="flex items-center gap-2 glass-card py-1.5 px-3">
                <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-xs text-gray-300">@{user.username}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Welcome Card */}
      <section className="px-6 mb-6 fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="max-w-md mx-auto glass-card p-6 glow-purple">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              {icons.lightning}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {user?.username ? `gm @${user.username}!` : "gm, Farcaster!"}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Trade tokens, vote on polls, and earn rewards onchain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="px-6 mb-6 fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
          {[
            { label: "Swaps", value: String(stats.swaps), icon: icons.swap },
            { label: "Volume", value: stats.volume, icon: icons.coin },
            { label: "Votes", value: String(stats.votes), icon: icons.vote },
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

      {/* Announcements Toggle */}
      <section className="px-6 mt-2 fade-in" style={{ animationDelay: "0.35s" }}>
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

      {/* Footer */}
      <footer className="px-6 py-6 fade-in" style={{ animationDelay: "0.4s" }}>
        <div className="max-w-md mx-auto text-center">
          <p className="text-[10px] text-gray-600">
            Built on Farcaster · Base & Arbitrum · ETHGlobal NY 2026
          </p>
        </div>
      </footer>
    </main>
  );
}
