"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { createClient } from "@/lib/supabase-client";
import { SwapLog } from "@/lib/types";
import {
  fetchSwapQuote,
  CHAINS,
  getTokens,
  getChainConfig,
  toWei,
  fromWei,
  type SwapQuote,
  type TokenItem,
  type ChainKey,
} from "@/lib/swap";
import { useWallet } from "@/hooks/useWallet";
import { type Address, type Hash } from "viem";

// Icons
const icons = {
  swap: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" />
    </svg>
  ),
  back: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  ),
  chevronDown: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  ),
};

type SwapStep = "idle" | "quoting" | "confirm" | "swapping" | "done" | "error";

export default function SwapPage() {
  const [user, setUser] = useState<{ fid?: number; username?: string }>({});
  const [chainKey, setChainKey] = useState<ChainKey>("base");
  const chainTokens = getTokens(CHAINS[chainKey].id);
  const [fromToken, setFromToken] = useState<TokenItem>(chainTokens[0]);
  const [toToken, setToToken] = useState<TokenItem>(chainTokens[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [history, setHistory] = useState<SwapLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");

  // Real swap state
  const [step, setStep] = useState<SwapStep>("idle");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [txHash, setTxHash] = useState<string>("");

  const wallet = useWallet();

  // Init SDK context
  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await sdk.context;
        setUser(ctx?.user || {});
        sdk.actions.ready();
        if (ctx?.user?.fid) loadHistory(ctx.user.fid);
      } catch {
        console.log("Running outside Farcaster client");
      }
    };
    init();
  }, []);

  const loadHistory = async (fid: number) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("swap_logs")
        .select("*")
        .eq("fid", fid)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setHistory(data);
    } catch {
      console.log("No swap history");
    }
  };

  // Get quote when amount, tokens, or wallet changes
  const getQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    if (fromToken.symbol === toToken.symbol) return;

    setStep("quoting");
    setQuote(null);

    try {
      const weiAmount = toWei(fromAmount, fromToken.decimals);
      if (weiAmount === "0") {
        setMessage("Amount too small");
        setMessageType("error");
        setStep("idle");
        return;
      }

      // For native ETH, 0x uses the zero address proxy
      const sellAddr =
        fromToken.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
          ? "0x0000000000000000000000000000000000000000"
          : fromToken.address;

      const q = await fetchSwapQuote({
        chainId: CHAINS[chainKey].id,
        sellToken: sellAddr as Address,
        buyToken: toToken.address as Address,
        sellAmount: weiAmount,
        takerAddress: wallet.address ?? undefined,
        slippageBps: 50, // 0.5%
      });

      setQuote(q);
      setStep("confirm");
      setMessage("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Quote failed";
      setMessage(msg.includes("INSUFFICIENT") ? "Insufficient liquidity" : msg);
      setMessageType("error");
      setStep("error");
    }
  }, [fromAmount, fromToken, toToken, wallet.address, chainKey]);

  // Auto-get quote when amount changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        getQuote();
      }
    }, 600); // debounce
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, chainKey, getQuote]);

  // Sync tokens when chain changes
  useEffect(() => {
    setFromToken(chainTokens[0]);
    setToToken(chainTokens[1]);
    setQuote(null);
    setStep("idle");
  }, [chainKey]);

  // Execute swap
  const executeSwap = useCallback(async () => {
    if (!quote || !wallet.address) return;

    setStep("swapping");
    setMessage("");

    try {
      const value = BigInt(quote.value || "0");
      const hash = await wallet.sendTransaction(
        quote.to as Address,
        quote.data as Hash,
        value
      );

      setTxHash(hash as string);
      setMessage(`Transaction submitted: ${String(hash).slice(0, 10)}...`);
      setMessageType("info");

      // Wait for receipt
      await wallet.waitForReceipt(hash as Hash);
      setStep("done");
      setMessage("Swap completed! ✅");
      setMessageType("success");
      setFromAmount("");

      // Log to Supabase
      if (user.fid) {
        const supabase = createClient();
        supabase
          .from("swap_logs")
          .insert({
            fid: user.fid,
            from_token: fromToken.symbol,
            to_token: toToken.symbol,
            from_amount: fromAmount,
            to_amount: fromWei(quote.buyAmount, toToken.decimals),
            tx_hash: hash as string,
            status: "completed",
          })
          .then(() => loadHistory(user.fid!));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Swap failed";
      if (
        msg.includes("rejected") ||
        msg.includes("denied") ||
        msg.includes("cancel")
      ) {
        setMessage("Transaction cancelled");
      } else {
        setMessage(`Swap failed: ${msg.slice(0, 100)}`);
      }
      setMessageType("error");
      setStep("error");
    }
  }, [
    quote,
    wallet,
    fromToken,
    toToken,
    fromAmount,
    user.fid,
  ]);

  // Quote display values
  const quoteBuyAmount = quote
    ? fromWei(quote.buyAmount, toToken.decimals)
    : "";
  const quotePrice = quote
    ? (1 / parseFloat(fromWei(quote.price, 18))).toFixed(6)
    : "";

  // Check if wallet is ready and on Base
  const walletOk = wallet.isReady && !wallet.error;
  const isBase = wallet.chainId === 8453;

  if (!wallet.isReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-fc-gradient p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full shimmer" />
          <div className="w-40 h-4 rounded shimmer" />
          <p className="text-xs text-gray-500">Connecting wallet...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-fc-gradient">
      {/* Header */}
      <header className="pt-12 pb-4 px-6 fade-in">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {icons.back}
          </button>
          <h1 className="text-lg font-bold text-white">Swap Tokens</h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="ml-auto text-xs text-gray-500 hover:text-purple-400 transition-colors cursor-pointer"
          >
            {showHistory ? "Close" : "History"}
          </button>
        </div>
      </header>

      {/* Wallet Warning */}
      {!walletOk && (
        <section className="px-6 mb-3">
          <div className="max-w-md mx-auto glass-card border border-yellow-600/30 p-3 flex items-center gap-2 text-yellow-400 text-xs">
            {icons.warning}
            Wallet not detected. Open in Warpcast to swap.
          </div>
        </section>
      )}

      {!isBase && walletOk && (
        <section className="px-6 mb-3">
          <div className="max-w-md mx-auto glass-card border border-yellow-600/30 p-3 flex items-center gap-2 text-yellow-400 text-xs">
            {icons.warning}
            Please switch to Base network (chain ID: 8453)
          </div>
        </section>
      )}

      {/* Main Swap Card */}
      <section className="px-6 fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="max-w-md mx-auto glass-card p-5 glow-purple">
          {/* From */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">From</span>
              <span className="text-xs text-gray-500">
                {wallet.address
                  ? `${String(wallet.address).slice(0, 6)}...${String(
                      wallet.address
                    ).slice(-4)}`
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => {
                  setFromAmount(e.target.value);
                  setStep("idle");
                  setQuote(null);
                }}
                placeholder="0.0"
                className="input-glass flex-1 text-lg"
                min="0"
                step="any"
              />
              <button
                onClick={() => setShowFromPicker(!showFromPicker)}
                className="glass-card py-2.5 px-3 flex items-center gap-1.5 text-sm text-white cursor-pointer hover:border-purple-500/30 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[9px] font-bold">
                  {fromToken.symbol[0]}
                </div>
                {fromToken.symbol}
                {icons.chevronDown}
              </button>
            </div>
            {/* From token picker */}
            {showFromPicker && (
              <div className="mt-2 glass-card p-2 max-h-32 overflow-y-auto">
                {chainTokens.filter(
                  (t) => t.symbol !== toToken.symbol
                ).map((t) => (
                  <button
                    key={t.symbol}
                    onClick={() => {
                      setFromToken(t);
                      setShowFromPicker(false);
                      setStep("idle");
                      setQuote(null);
                    }}
                    className="w-full flex items-center gap-3 p-2 text-sm text-white hover:bg-white/5 rounded-lg cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[9px] font-bold">
                      {t.symbol[0]}
                    </div>
                    <div className="text-left">
                      <span className="font-medium">{t.symbol}</span>
                      <span className="text-gray-500 ml-1">{t.name}</span>
                    </div>
                    {t.symbol === fromToken.symbol && (
                      <span className="ml-auto text-purple-400">
                        {icons.check}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap direction button */}
          <div className="flex justify-center my-2">
            <button
              onClick={() => {
                setFromToken(toToken);
                setToToken(fromToken);
                setStep("idle");
                setQuote(null);
              }}
              className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all cursor-pointer"
            >
              {icons.swap}
            </button>
          </div>

          {/* To */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">To</span>
              <span className="text-xs text-gray-500">
                {step === "quoting" ? (
                  <span className="text-purple-400">Fetching best price...</span>
                ) : quote ? (
                  <span className="text-emerald-400">
                    Best route
                    {quote.sources.slice(0, 2).map((s) => ` ${s.name}`)}
                  </span>
                ) : null}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={quoteBuyAmount}
                readOnly
                placeholder={step === "quoting" ? "Loading..." : "0.0"}
                className="input-glass flex-1 text-lg opacity-80"
              />
              <button
                onClick={() => setShowToPicker(!showToPicker)}
                className="glass-card py-2.5 px-3 flex items-center gap-1.5 text-sm text-white cursor-pointer hover:border-purple-500/30 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[9px] font-bold">
                  {toToken.symbol[0]}
                </div>
                {toToken.symbol}
                {icons.chevronDown}
              </button>
            </div>
            {/* To token picker */}
            {showToPicker && (
              <div className="mt-2 glass-card p-2 max-h-32 overflow-y-auto">
                {chainTokens.filter(
                  (t) => t.symbol !== fromToken.symbol
                ).map((t) => (
                  <button
                    key={t.symbol}
                    onClick={() => {
                      setToToken(t);
                      setShowToPicker(false);
                      setStep("idle");
                      setQuote(null);
                    }}
                    className="w-full flex items-center gap-3 p-2 text-sm text-white hover:bg-white/5 rounded-lg cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[9px] font-bold">
                      {t.symbol[0]}
                    </div>
                    <div className="text-left">
                      <span className="font-medium">{t.symbol}</span>
                      <span className="text-gray-500 ml-1">{t.name}</span>
                    </div>
                    {t.symbol === toToken.symbol && (
                      <span className="ml-auto text-emerald-400">
                        {icons.check}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            onClick={executeSwap}
            disabled={
              step === "swapping" ||
              step === "quoting" ||
              !fromAmount ||
              !quote ||
              !walletOk
            }
            className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2"
          >
            {step === "swapping" ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Swapping...
              </>
            ) : step === "quoting" ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Getting Quote...
              </>
            ) : !walletOk ? (
              <>
                {icons.warning}
                Wallet not connected
              </>
            ) : (
              <>
                {icons.swap}
                Swap {fromToken.symbol} → {toToken.symbol}
              </>
            )}
          </button>

          {/* Swap details */}
          {quote && step !== "swapping" && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Rate</span>
                <span>
                  1 {fromToken.symbol} ≈ {quotePrice} {toToken.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Slippage</span>
                <span>0.5%</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Network fee</span>
                <span>~{(Number(quote.gas) * Number(quote.gasPrice) / 1e18).toFixed(6)} ETH</span>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`mt-3 text-xs text-center p-2 rounded-lg ${
                messageType === "error"
                  ? "text-red-400 bg-red-400/10"
                  : messageType === "success"
                  ? "text-emerald-400 bg-emerald-400/10"
                  : "text-gray-400 bg-gray-400/10"
              }`}
            >
              {message}
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-purple-400 underline mt-1"
                >
                  View on BaseScan ↗
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Price info */}
      <section className="px-6 mt-3 fade-in" style={{ animationDelay: "0.15s" }}>
        <div className="max-w-md mx-auto glass-card p-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Powered by</span>
            <span className="text-purple-400">0x Protocol</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Network</span>
            <div className="flex items-center gap-1">
              {Object.entries(CHAINS).map(([key, chain]) => (
                <button
                  key={key}
                  onClick={() => setChainKey(key as ChainKey)}
                  className={`badge cursor-pointer transition-opacity ${
                    chainKey === key
                      ? chain.color + " opacity-100"
                      : "opacity-40 hover:opacity-70"
                  }`}
                  style={chainKey !== key ? { background: "rgba(138,99,210,0.15)", color: "#8a63d2" } : {}}
                >
                  {chain.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Wallet</span>
            <span className="badge badge-purple">Farcaster</span>
          </div>
        </div>
      </section>

      {/* History */}
      {showHistory && (
        <section className="px-6 mt-3 mb-6 fade-in">
          <div className="max-w-md mx-auto glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-3">Swap History</h3>
            {history.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                No swaps yet
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between text-xs border-b border-gray-800 pb-2 last:border-0"
                  >
                    <div>
                      <span className="text-white">
                        {h.from_amount} {h.from_token}
                      </span>
                      <span className="text-gray-500 mx-1">→</span>
                      <span className="text-emerald-400">
                        {parseFloat(h.to_amount).toFixed(4)} {h.to_token}
                      </span>
                    </div>
                    <span className="badge badge-green">Done</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-6 py-6 mt-auto fade-in">
        <div className="max-w-md mx-auto text-center">
          <p className="text-[10px] text-gray-600">
            Powered by FrameOS · 0x Protocol · {CHAINS[chainKey].name}
          </p>
        </div>
      </footer>
    </main>
  );
}
