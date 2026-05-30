"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { createClient } from "@/lib/supabase-client";

const icons = {
  back: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  ),
  bell: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  ),
  megaphone: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20 2v2h-2v2h-2v2h-2v8h2v2h2v2h2v2h2V2h-2zM5 9h3v6H5a3 3 0 01-3-3v0a3 3 0 013-3z" />
    </svg>
  ),
  trash: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  ),
};

type Notification = {
  id: number;
  type: string;
  title: string | null;
  message: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [user, setUser] = useState<{ fid?: number; username?: string }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await sdk.context;
        setUser(ctx?.user || {});
        sdk.actions.ready();
        if (ctx?.user?.fid) {
          loadNotifications(ctx.user.fid);
          checkInstall(ctx.user.fid);
        }
      } catch (e) {
        console.log("Outside Farcaster");
      }
      setIsSDKReady(true);
    };
    init();
  }, []);

  const loadNotifications = async (fid: number) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("fid", fid)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    } catch (e) {
      console.log("No notifications");
    }
  };

  const checkInstall = async (fid: number) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("frame_installs")
        .select("*")
        .eq("fid", fid)
        .single();
      if (data) setNotifEnabled(data.notifications_enabled);
    } catch (e) {
      console.log("Not installed yet");
    }
  };

  const toggleNotifications = async () => {
    if (!user.fid) return;
    const newState = !notifEnabled;
    setNotifEnabled(newState);
    try {
      const supabase = createClient();
      await supabase.from("frame_installs").upsert(
        { fid: user.fid, notifications_enabled: newState, installed_at: new Date().toISOString() },
        { onConflict: "fid" }
      );
      setMessage(newState ? "Notifications enabled ✅" : "Notifications disabled");
    } catch (e) {
      console.log("Update failed");
    }
  };

  const markAllRead = async () => {
    if (!user.fid) return;
    try {
      const supabase = createClient();
      await supabase.from("notifications").update({ read: true }).eq("fid", user.fid).eq("read", false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setMessage("All marked as read");
    } catch (e) {
      console.log("Mark read failed");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "welcome": return "👋";
      case "swap_thankyou": return "🔄";
      case "announcement": return "📢";
      default: return "🔔";
    }
  };

  if (!isSDKReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-fc-gradient p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full shimmer" />
          <div className="w-40 h-4 rounded shimmer" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-fc-gradient">
      <header className="pt-12 pb-4 px-6 fade-in">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => window.location.href = "/"} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            {icons.back}
          </button>
          <h1 className="text-lg font-bold text-white">Notifications</h1>
          {notifications.some(n => !n.read) && (
            <button onClick={markAllRead} className="ml-auto text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer">
              Mark all read
            </button>
          )}
        </div>
      </header>

      {/* Toggle */}
      <section className="px-6 mb-4 fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="max-w-md mx-auto glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notifEnabled ? "bg-purple-600/20 text-purple-400" : "bg-gray-800 text-gray-500"}`}>
                {icons.bell}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Push Notifications</h3>
                <p className="text-xs text-gray-500">Get notified about swaps & updates</p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`w-12 h-7 rounded-full transition-colors cursor-pointer ${notifEnabled ? "bg-purple-600" : "bg-gray-700"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Notifications List */}
      <section className="px-6 flex-1 fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="max-w-md mx-auto">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Recent ({notifications.length})
          </h3>
          {notifications.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <div className="text-3xl mb-3">{icons.bell}</div>
              <p className="text-sm text-gray-400">No notifications yet</p>
              <p className="text-xs text-gray-600 mt-1">Enable notifications to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`glass-card p-3 flex items-start gap-3 ${!n.read ? "border-purple-500/20" : "opacity-60"}`}
                >
                  <span className="text-lg">{getTypeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm ${n.read ? "text-gray-400" : "text-white font-medium"}`}>
                      {n.title || "Notification"}
                    </h4>
                    {n.message && (
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    )}
                    <p className="text-[10px] text-gray-700 mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Message */}
      {message && (
        <div className="toast" onClick={() => setMessage("")}>{message}</div>
      )}

      <footer className="px-6 py-6 fade-in">
        <div className="max-w-md mx-auto text-center">
          <p className="text-[10px] text-gray-600">
            Notifications via Neynar · Supabase
          </p>
        </div>
      </footer>
    </main>
  );
}
