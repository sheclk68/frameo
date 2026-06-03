"use client";

import { useEffect, useState, useCallback } from "react";
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
  POPULAR_CHAIN_KEYS,
  SOL_NATIVE,
  isSolanaChain,
  type SwapQuote,
  type TokenItem,
  type ChainKey,
} from "@/lib/swap";
import { useWalletManager } from "@/hooks/useWalletManager";
import {
  getSolanaQuote,
  getJupiterSwapTransaction,
  signAndSendSolanaSwap,
  waitForSolanaTx,
  type SolanaSwapQuote,
} from "@/lib/swap-solana";
import { type Address, type Hash } from "viem";
import WalletSelector from "@/components/wallet-selector";

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
  share: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
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

  const walletManager = useWalletManager();
  const wallet = walletManager.evmWallet;
  const solanaWallet = walletManager.solanaWallet;
  const isSolana = isSolanaChain(chainKey);
  const isInFarcaster = !!user.username || !!user.fid;

  // Show all chains in browser, hide Solana in Warpcast (no Solana wallet available)
  const availableChains = isInFarcaster
    ? POPULAR_CHAIN_KEYS.filter((k) => k !== "solana")
    : POPULAR_CHAIN_KEYS;

  // Solana state (separate from EVM flow)
  const [solanaQuote, setSolanaQuote] = useState<SolanaSwapQuote | null>(null);
  const [solanaTxSignature, setSolanaTxSignature] = useState("");
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  // Auto-activate the right wallet when chain changes
  useEffect(() => {
    walletManager.ensureWalletForChain(chainKey);
  }, [chainKey]);

  // Auto-select correct chain on mount based on which wallet is connected.
  // Waits for both wallets to report isReady before making a decision.
  useEffect(() => {
    if (!solanaWallet.isReady || !walletManager.evmWallet.isReady) return;

    const onlySolana = solanaWallet.walletConnected && !walletManager.evmWallet.walletConnected;
    const onlyEvm = walletManager.evmWallet.walletConnected && !solanaWallet.walletConnected;
    if (onlySolana) {
      setChainKey("solana");
    }
    // If both or neither is connected, keep "base" default
  }, [solanaWallet.isReady, walletManager.evmWallet.isReady]);

  // If in Farcaster and chainKey is Solana, fall back to Base
  useEffect(() => {
    if (isInFarcaster && isSolana) {
      setChainKey("base");
    }
  }, [isInFarcaster, isSolana]);

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
    setSolanaQuote(null);

    try {
      if (isSolana) {
        // --- Solana: Jupiter API ---
        const rawAmount = Math.floor(
          parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)
        );
        if (rawAmount <= 0) {
          setMessage("Amount too small");
          setMessageType("error");
          setStep("idle");
          return;
        }

        const sq = await getSolanaQuote({
          inputMint: fromToken.address,
          outputMint: toToken.address,
          amount: rawAmount,
          slippageBps: 50,
        });

        setSolanaQuote(sq);
        setStep("confirm");
        setMessage("");
      } else {
        // --- EVM: 0x API ---
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
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Quote failed";
      setMessage(msg.includes("INSUFFICIENT") || msg.includes("No routes")
        ? "Insufficient liquidity"
        : msg);
      setMessageType("error");
      setStep("error");
    }
  }, [fromAmount, fromToken, toToken, wallet.address, chainKey, isSolana]);

  // Auto-get quote when amount changes
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    const timer = setTimeout(() => {
      getQuote().catch(() => {}); // never crash on quote failure
    }, 600);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, chainKey, getQuote]);

  // Sync tokens when chain changes
  useEffect(() => {
    setFromToken(chainTokens[0]);
    setToToken(chainTokens[1]);
    setQuote(null);
    setStep("idle");
  }, [chainKey]);

  // Execute swap (EVM or Solana)
  const executeSwap = useCallback(async () => {
    if (isSolana) {
      // --- Solana Swap via Jupiter ---
      if (!solanaQuote || !solanaWallet.publicKey || !solanaWallet.connection) return;

      setStep("swapping");
      setMessage("");

      // Guard: can't execute swap with a fallback/estimated quote
      if (solanaQuote.isFallback) {
        setMessage("Jupiter API unavailable — cannot execute swap. Try again later.");
        setMessageType("error");
        setStep("idle");
        return;
      }

      try {
        // 1. Get full quote response from Jupiter
        const { getJupiterQuote: jq } = await import("@/lib/swap-solana");
        const jupiterQuote = await jq({
          inputMint: solanaQuote.inputMint,
          outputMint: solanaQuote.outputMint,
          amount: parseInt(solanaQuote.inAmount),
          slippageBps: solanaQuote.slippageBps,
        });

        // 2. Get swap transaction from Jupiter
        const swapTx = await getJupiterSwapTransaction({
          quoteResponse: jupiterQuote,
          userPublicKey: solanaWallet.publicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto" as const,
        });

        // 3. Sign and send via Solana wallet
        const signature = await signAndSendSolanaSwap(
          solanaWallet.connection,
          swapTx.swapTransaction,
          async (tx) => {
            // Sign via provider
            const signed = await solanaWallet.signTx(tx);
            // Send raw transaction
            const sig = await solanaWallet.connection!.sendRawTransaction(
              signed.serialize(),
              { skipPreflight: true, maxRetries: 3 }
            );
            return sig;
          }
        );

        setSolanaTxSignature(signature);
        setMessage(`Transaction submitted: ${signature.slice(0, 10)}...`);
        setMessageType("info");

        // 4. Wait for confirmation
        await waitForSolanaTx(solanaWallet.connection, signature);
        setStep("done");
        setMessage("Swap completed! ✅");
        setMessageType("success");
        setFromAmount("");
        setTxHash(signature);

        // 5. Log to Supabase
        if (user.fid) {
          const supabase = createClient();
          const outAmount = fromWei(
            BigInt(solanaQuote.outAmount).toString(),
            toToken.decimals
          );
          supabase
            .from("users")
            .upsert(
              { fid: user.fid, username: user.username, last_seen: new Date().toISOString() },
              { onConflict: "fid" }
            )
            .then(() =>
              supabase.from("swap_logs").insert({
                fid: user.fid,
                from_token: fromToken.symbol,
                to_token: toToken.symbol,
                from_amount: fromAmount,
                to_amount: outAmount,
                tx_hash: signature,
                status: "completed",
              })
            )
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
    } else {
      // --- EVM Swap via 0x ---
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
            .from("users")
            .upsert(
              { fid: user.fid, username: user.username, last_seen: new Date().toISOString() },
              { onConflict: "fid" }
            )
            .then(() =>
              supabase.from("swap_logs").insert({
                fid: user.fid,
                from_token: fromToken.symbol,
                to_token: toToken.symbol,
                from_amount: fromAmount,
                to_amount: fromWei(quote.buyAmount, toToken.decimals),
                tx_hash: hash as string,
                status: "completed",
              })
            )
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
    }
  }, [
    quote,
    solanaQuote,
    wallet,
    solanaWallet,
    fromToken,
    toToken,
    fromAmount,
    user.fid,
    isSolana,
  ]);

  // Quote display values (EVM or Solana)
  const quoteBuyAmount = quote
    ? fromWei(quote.buyAmount, toToken.decimals)
    : solanaQuote
    ? fromWei(BigInt(solanaQuote.outAmount).toString(), toToken.decimals)
    : "";
  const quotePrice = quote
    ? (1 / parseFloat(fromWei(quote.price, 18))).toFixed(6)
    : solanaQuote
    ? "≈ from Jupiter"
    : "";
  const routesDisplay = quote
    ? quote.sources.map((s) => ` ${s.name}`)
    : solanaQuote
    ? [` Jupiter (${solanaQuote.routeSummary})`]
    : [];
  const quoteSlippageBps = solanaQuote ? solanaQuote.slippageBps : 50;

  // Wallet readiness: detect EVM vs Solana via unified manager
  const walletOk = isSolana
    ? walletManager.activeType === "solana"
    : walletManager.activeType === "evm";
  const chainSupported = isSolana
    ? true
    : (wallet.chainId === 8453 || wallet.chainId === 42161);

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

      {/* Unified Wallet Connect — single button for all wallets */}
      {!walletOk && (
        <section className="px-6 mb-3">
          <div className="max-w-md mx-auto glass-card border border-purple-600/30 p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs mb-2">
              {icons.warning}
              {isInFarcaster && isSolana
                ? "Solana not available in Warpcast — open in browser"
                : "Wallet not connected"}
            </div>
            {isInFarcaster && isSolana ? (
              <div className="text-xs text-gray-400">
                <p>Open <span className="text-purple-400">frameos.sheclk0068.workers.dev</span> in your browser with Phantom installed to swap on Solana.</p>
              </div>
            ) : (
              <button
                onClick={() => setShowWalletSelector(true)}
                className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M21 18v3H3V3h18v3h-9a3 3 0 000 6h9zm0-2h-9a1 1 0 010-2h9v2zm-9-4a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                Connect Wallet
              </button>
            )}
            <p className="text-[10px] text-gray-500 mt-2">
              {isInFarcaster
                ? "In Warpcast: auto-connects. Tap above for browser wallets."
                : "MetaMask for EVM chains · Phantom for Solana"}
            </p>
          </div>
        </section>
      )}

      {walletOk && !isSolana && !chainSupported && (
        <section className="px-6 mb-3">
          <div className="max-w-md mx-auto glass-card border border-yellow-600/30 p-3 flex items-center gap-2 text-yellow-400 text-xs">
            {icons.warning}
            Please switch to Base or Arbitrum network to execute swaps.
          </div>
        </section>
      )}

      {/* Main Swap Card */}
      <section className="px-6 fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="max-w-md mx-auto glass-card p-5 glow-purple">
          {/* Chain Selector Strip — visible at top so users see chains immediately */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4 pb-3 border-b border-gray-800">
            <span className="text-[10px] text-gray-500 mr-1">Chain:</span>
            {availableChains.map((key) => {
              const chain = CHAINS[key];
              return (
                <button
                  key={key}
                  onClick={() => setChainKey(key)}
                  className={`badge cursor-pointer transition-all text-[10px] ${
                    chainKey === key
                      ? chain.color + " opacity-100 scale-105"
                      : "opacity-40 hover:opacity-70"
                  }`}
                  style={chainKey !== key ? { background: "rgba(138,99,210,0.1)", color: "#8a63d2" } : {}}
                >
                  {chain.label}
                </button>
              );
            })}
            {isInFarcaster && (
              <span className="text-[9px] text-gray-600 ml-auto">
                Solana→browser
              </span>
            )}
          </div>
          {/* From */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">From</span>
              <span
                className="text-xs text-gray-500 cursor-pointer"
                onClick={() => {
                  if (wallet.address) {
                    navigator.clipboard.writeText(String(wallet.address));
                    setMessage("Address copied!");
                    setMessageType("success");
                    setTimeout(() => setMessage(""), 2000);
                  }
                }}
              >
                {wallet.address
                  ? String(wallet.address)
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
                    Best route{quote.sources.slice(0, 2).map((s) => ` ${s.name}`)}
                  </span>
                ) : solanaQuote ? (
                  <span className="text-emerald-400">
                    Jupiter {solanaQuote.routeSummary ? `(${solanaQuote.routeSummary})` : ""}
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
              (!quote && !solanaQuote) ||
              !walletOk ||
              !!solanaQuote?.isFallback
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
                {icons.swap}
                Connect Wallet
              </>
            ) : !isSolana && !chainSupported ? (
              <>
                {icons.warning}
                Switch to Base or Arbitrum
              </>
            ) : (
              <>
                {icons.swap}
                Swap {fromToken.symbol} → {toToken.symbol}
              </>
            )}
          </button>

          {/* Swap details */}
          {(quote || solanaQuote) && step !== "swapping" && (
            <div className="mt-3 space-y-1">
              {/* Fallback warning */}
              {solanaQuote?.isFallback && (
                <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 bg-yellow-400/10 p-2 rounded-lg mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  <span>Estimated price — Jupiter API unreachable. Swap button disabled.</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Rate</span>
                <span>
                  {quote ? (
                    <>1 {fromToken.symbol} ≈ {quotePrice} {toToken.symbol}</>
                  ) : (
                    <>{solanaQuote?.isFallback ? solanaQuote.routeSummary : `via Jupiter • ${solanaQuote?.routeSummary ?? ""}`}</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Slippage</span>
                <span>{quoteSlippageBps / 100}%</span>
              </div>
              {!solanaQuote?.isFallback && (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>FrameOS Fee</span>
                    <span className="text-purple-400">{(parseFloat(quoteBuyAmount || "0") * 0.003).toFixed(6)} {toToken.symbol} (0.3%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Network fee</span>
                    <span>{quote ? `~${(Number(quote.gas) * Number(quote.gasPrice) / 1e18).toFixed(6)} ETH` : "~0.000005 SOL"}</span>
                  </div>
                </>
              )}
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
              {txHash && !isSolana && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-purple-400 underline mt-1"
                >
                  View on BaseScan ↗
                </a>
              )}
              {solanaTxSignature && isSolana && (
                <a
                  href={`https://solscan.io/tx/${solanaTxSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-purple-400 underline mt-1"
                >
                  View on Solscan ↗
                </a>
              )}
            </div>
          )}

          {/* Share on Farcaster */}
          {step === "done" && fromAmount && (
            <div className="mt-3 p-3 rounded-xl bg-purple-600/10 border border-purple-500/20">
              <p className="text-xs text-gray-400 mb-2 text-center">Share your trade to get more users 🚀</p>
              <button
                onClick={() => {
                  const shareText = `I just swapped ${fromAmount} ${fromToken.symbol} → ${quoteBuyAmount.slice(0, 10)} ${toToken.symbol} on FrameOS 🔄\n\nTry it: frameos.sheclk0068.workers.dev`;
                  const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
                  try { sdk.actions.openUrl?.(castUrl); } catch { window.open(castUrl, "_blank"); }
                }}
                className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
              >
                {icons.share}
                Share on Farcaster
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Price info */}
      <section className="px-6 mt-3 fade-in" style={{ animationDelay: "0.15s" }}>
        <div className="max-w-md mx-auto glass-card p-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Powered by</span>
            <span className="text-purple-400">{isSolana ? "Jupiter" : "0x Protocol"}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Network</span>
            <div className="flex items-center gap-1 flex-wrap justify-end max-w-[220px]">
              {availableChains.map((key) => {
                const chain = CHAINS[key];
                return (
                  <button
                    key={key}
                    onClick={() => setChainKey(key)}
                    className={`badge cursor-pointer transition-opacity ${
                      chainKey === key
                        ? chain.color + " opacity-100"
                        : "opacity-40 hover:opacity-70"
                    }`}
                    style={chainKey !== key ? { background: "rgba(138,99,210,0.1)", color: "#8a63d2" } : {}}
                  >
                    {chain.label}
                  </button>
                );
              })}
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
            Powered by FrameOS · {isSolana ? "Jupiter" : "0x Protocol"} · {CHAINS[chainKey].name}
          </p>
        </div>
      </footer>

      {/* Wallet Selector Modal */}
      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onConnectEVM={() => {
          if (isSolana) setChainKey("base");
          walletManager.connect("evm");
        }}
        onConnectSolana={() => {
          if (!isSolana) setChainKey("solana");
          walletManager.connect("solana");
        }}
        hasEthereum={typeof window !== "undefined" && !!(window as any).ethereum && !(window as any).ethereum?.isPhantom}
        hasSolana={typeof window !== "undefined" && (!!(window as any).solana)}
        evmConnected={walletManager.evmWallet.walletConnected}
        solanaConnected={walletManager.solanaWallet.walletConnected}
        activeType={walletManager.activeType}
      />
    </main>
  );
}
