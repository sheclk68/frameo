"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

const icons = {
  back: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  ),
};

const SCENARIOS = [
  {
    name: "ETH drops 30% ($3000 → $2100)",
    pValue: "1.000000",  // strike/settle = 3000/2100 > 1, so P = 1
    nValue: "0.000000",  // N = 0
    pLabel: "✅ Safe — got full ETH back",
    nLabel: "❌ Wiped out",
    explainP: "P = min(1, 3000/2100) = 1.0 ETH",
    explainN: "N = max(0, 1 − 3000/2100) = 0 ETH",
  },
  {
    name: "ETH up 10% ($3000 → $3300)",
    pValue: "0.909090",
    nValue: "0.090909",
    pLabel: "Moderate loss",
    nLabel: "Small gain",
    explainP: "P = min(1, 3000/3300) = 0.909 ETH",
    explainN: "N = max(0, 1 − 3000/3300) = 0.091 ETH",
  },
  {
    name: "ETH crashes 60% ($3000 → $1200)",
    pValue: "1.000000",
    nValue: "0.000000",
    pLabel: "✅ Fully protected",
    nLabel: "❌ Zero",
    explainP: "P = min(1, 3000/1200) = 1.0 ETH (capped)",
    explainN: "N = max(0, 1 − 3000/1200) = 0 ETH",
  },
  {
    name: "ETH up 50% ($3000 → $4500)",
    pValue: "0.666666",
    nValue: "0.333333",
    pLabel: "Moderate loss",
    nLabel: "Significant gain",
    explainP: "P = min(1, 3000/4500) = 0.667 ETH",
    explainN: "N = max(0, 1 − 3000/4500) = 0.333 ETH",
  },
];

export default function OptionsPage() {
  const [activeScenario, setActiveScenario] = useState(0);
  const [user, setUser] = useState<{ fid?: number; username?: string }>({});
  const [showHow, setShowHow] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await sdk.context;
        setUser(ctx?.user || {});
        sdk.actions.ready();
      } catch { /* browser mode */ }
    };
    init();
  }, []);

  const s = SCENARIOS[activeScenario];

  return (
    <main className="flex min-h-screen flex-col bg-fc-gradient">
      {/* Header */}
      <header className="pt-12 pb-4 px-6 fade-in">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => (window.location.href = "/")} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            {icons.back}
          </button>
          <h1 className="text-lg font-bold text-white">Options Vault</h1>
          <span className="ml-auto badge badge-purple text-[10px]">Concept</span>
        </div>
      </header>

      {/* Intro */}
      <section className="px-6 mb-3 fade-in">
        <div className="max-w-md mx-auto glass-card p-5 glow-purple">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🧠</span>
            <h2 className="text-sm font-bold text-white">Index Assets via Options</h2>
          </div>
          <div className="space-y-2 text-xs text-gray-400">
            <p className="text-purple-300 font-medium">by @vitalik.eth · June 1, 2026</p>
            <p className="italic">
              &ldquo;What if we use <span className="text-purple-300">options</span> as the base of DeFi,
              instead of CDPs and liquidations?&rdquo;
            </p>
          </div>

          {/* P/N split explanation */}
          <div className="glass-card p-3 my-3 text-center space-y-1">
            <p className="text-xs text-gray-300">Deposit 1 ETH → Split into:</p>
            <div className="flex justify-center gap-4 mt-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-1">
                  <span className="text-emerald-400 font-bold text-sm">P</span>
                </div>
                <span className="text-[9px] text-emerald-400">Positive</span>
              </div>
              <div className="flex items-center text-gray-600 text-lg">+</div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto mb-1">
                  <span className="text-rose-400 font-bold text-sm">N</span>
                </div>
                <span className="text-[9px] text-rose-400">Negative</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              P + N = 1 ETH <strong className="text-white">always</strong> → <span className="text-emerald-400">No liquidations</span>
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="https://ethresear.ch/t/building-index-tracking-assets-on-top-of-options-instead-of-debt/25036"
              target="_blank"
              rel="noopener noreferrer"
              className="badge badge-purple text-[9px] no-underline"
            >
              Read the Paper ↗
            </a>
            <button
              onClick={() => setShowHow(!showHow)}
              className="badge text-[9px] cursor-pointer"
              style={{ background: "rgba(138,99,210,0.1)", color: "#8a63d2" }}
            >
              How it works
            </button>
          </div>

          {showHow && (
            <div className="mt-3 text-[10px] text-gray-500 space-y-1 p-2 bg-white/5 rounded-lg">
              <p><strong className="text-gray-300">At settlement:</strong></p>
              <p>🔵 P = <span className="text-emerald-400">min(1, Strike÷Price)</span> ETH</p>
              <p>🔴 N = <span className="text-rose-400">max(0, 1 − Strike÷Price)</span> ETH</p>
              <p className="mt-1">✅ No real-time oracles needed</p>
              <p>⚠️ Needs periodic rebalancing (open problem)</p>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Scenario */}
      <section className="px-6 mb-3 fade-in">
        <div className="max-w-md mx-auto glass-card p-4">
          <h3 className="text-xs font-bold text-white mb-3">Interactive Demo 📊</h3>

          {/* Scenario selector */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SCENARIOS.map((sc, i) => (
              <button
                key={i}
                onClick={() => setActiveScenario(i)}
                className={`badge cursor-pointer text-[9px] transition-all ${
                  i === activeScenario ? "badge-purple opacity-100" : "opacity-40 hover:opacity-70"
                }`}
                style={i !== activeScenario ? { background: "rgba(138,99,210,0.1)", color: "#8a63d2" } : {}}
              >
                {sc.name.split(" ")[0]} {sc.name.includes("up") ? "↑" : "↓"}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-gray-500 mb-3">Scenario: <span className="text-white text-xs">{s.name}</span></p>

          {/* Settlement display */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="glass-card p-3 text-center border-emerald-500/20">
              <div className="text-emerald-400 text-xl font-bold">{s.pValue}</div>
              <div className="text-[9px] text-gray-500">P Payout (ETH)</div>
              <div className="text-[8px] text-gray-600 mt-1">{s.explainP}</div>
              <div className="text-[9px] mt-1">{s.pLabel}</div>
            </div>
            <div className="glass-card p-3 text-center border-rose-500/20">
              <div className="text-rose-400 text-xl font-bold">{s.nValue}</div>
              <div className="text-[9px] text-gray-500">N Payout (ETH)</div>
              <div className="text-[8px] text-gray-600 mt-1">{s.explainN}</div>
              <div className="text-[9px] mt-1">{s.nLabel}</div>
            </div>
          </div>

          {/* Key insight */}
          <div className="text-center text-[10px] text-gray-500 p-2 bg-white/5 rounded-lg">
            P + N = <span className="text-white font-bold">{(parseFloat(s.pValue) + parseFloat(s.nValue)).toFixed(6)} ETH</span>
            <span className="text-emerald-400 ml-1">✅ Never liquidated</span>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="px-6 mb-3 fade-in">
        <div className="max-w-md mx-auto glass-card p-4">
          <h3 className="text-xs font-bold text-white mb-3">Why This Matters</h3>
          <div className="space-y-2 text-[10px] text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✅</span>
              <div><strong className="text-gray-300">No real-time oracles</strong> — uses "slow oracles" like prediction markets. Way harder to manipulate.</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✅</span>
              <div><strong className="text-gray-300">No liquidations</strong> — exposure drifts smoothly, even in extreme price moves.</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✅</span>
              <div><strong className="text-gray-300">Reduced MEV risk</strong> — rebalancing decisions are user-driven, not MEV-bait.</div>
            </div>
            <div className="flex items-start gap-2 mt-2 border-t border-gray-800 pt-2">
              <span className="text-yellow-400 mt-0.5">⚠️</span>
              <div><strong className="text-gray-300">Needs rebalancing</strong> — open question on slippage during rotation. Vitalik acknowledges this.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="px-6 mb-6 fade-in">
        <div className="max-w-md mx-auto glass-card p-4 text-center">
          <div className="text-2xl mb-2">🚧</div>
          <h3 className="text-sm font-bold text-white mb-1">Smart Contract Coming Soon</h3>
          <p className="text-[10px] text-gray-500">
            OptionsVault.sol is written, compiled, and ready to deploy on Base Sepolia.
            Deploying once community interest is confirmed.
          </p>
          <div className="flex justify-center gap-2 mt-3">
            <a
              href="https://github.com/pk910/PoWFaucet"
              target="_blank"
              rel="noopener noreferrer"
              className="badge badge-purple text-[9px] no-underline"
            >
              Solidity Contract ↗
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 mt-auto fade-in">
        <div className="max-w-md mx-auto text-center">
          <p className="text-[9px] text-gray-600">
            Options Vault · Based on Vitalik Buterin's proposal · Built on FrameOS
          </p>
        </div>
      </footer>
    </main>
  );
}
