"use client";

import { useEffect, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useWallet } from "@/hooks/useWallet";
import {
  encodeDeployData,
  parseUnits,
  type Address,
  type Hash,
} from "viem";
import { base, arbitrum } from "viem/chains";
import FrameTokenArtifact from "@/contracts/FrameToken.json";
import { CHAINS, getChainConfig, type ChainKey } from "@/lib/swap";

// Icons
const icons = {
  back: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  ),
  rocket: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.5s-4.5 2.5-6 5.5c-.75 1.5-.75 3.5 0 5.5L12 22l6-8.5c.75-2 .75-4 0-5.5-1.5-3-6-5.5-6-5.5zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  ),
  link: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
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

type DeployStep = "idle" | "deploying" | "confirming" | "done" | "error";

export default function TokenLaunchPage() {
  const [user, setUser] = useState<{ fid?: number; username?: string }>({});
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000000");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [chainKey, setChainKey] = useState<ChainKey>("base");
  const chainConfig = getChainConfig(CHAINS[chainKey].id);

  // Deploy state
  const [step, setStep] = useState<DeployStep>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [deployedAddress, setDeployedAddress] = useState<string>("");

  const wallet = useWallet();

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await sdk.context;
        setUser(ctx?.user || {});
        sdk.actions.ready();
      } catch {
        console.log("Outside Farcaster");
      }
      setIsSDKReady(true);
    };
    init();
  }, []);

  // Real ERC-20 deployment via Farcaster wallet
  const handleLaunch = useCallback(async () => {
    if (!name.trim() || !symbol.trim()) {
      setMessage("Name and symbol are required");
      return;
    }
    if (symbol.length > 10) {
      setMessage("Symbol too long (max 10 chars)");
      return;
    }
    if (!wallet.client || !wallet.address) {
      setMessage("Wallet not connected. Open in Warpcast.");
      return;
    }

    setStep("deploying");
    setMessage("");
    setTxHash("");
    setDeployedAddress("");

    try {
      const totalSupplyWei = parseUnits(supply || "0", 18);

      // Encode constructor args: (string name, string symbol, uint256 totalSupply)
      const deployData = encodeDeployData({
        abi: FrameTokenArtifact.abi,
        bytecode: FrameTokenArtifact.bytecode as `0x${string}`,
        args: [name.trim(), symbol.trim().toUpperCase(), totalSupplyWei],
      });

      // Send deployment transaction
      const deployChain = CHAINS[chainKey].id === 42161 ? arbitrum : base;
      const hash = await wallet.client.sendTransaction({
        account: wallet.address,
        chain: deployChain,
        data: deployData,
      });

      setTxHash(hash as string);

      setMessage(`Transaction submitted. Waiting for confirmation...`);

      // Wait for receipt
      const receipt = await wallet.publicClient!.waitForTransactionReceipt({
        hash: hash as Hash,
      });

      const contractAddress = receipt.contractAddress;
      if (!contractAddress) {
        throw new Error("Contract deployment failed — no address returned");
      }

      setDeployedAddress(contractAddress);
      setStep("done");
      setMessage(`🎉 Token deployed at ${contractAddress.slice(0, 10)}...`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Deployment failed";
      if (
        msg.includes("rejected") ||
        msg.includes("denied") ||
        msg.includes("cancel")
      ) {
        setMessage("Transaction cancelled by user");
      } else {
        setMessage(
          msg.length > 150 ? `Error: ${msg.slice(0, 150)}...` : `Error: ${msg}`
        );
      }
      setStep("error");
    }
  }, [name, symbol, supply, wallet]);

  const resetForm = () => {
    setName("");
    setSymbol("");
    setSupply("1000000000");
    setDescription("");
    setMessage("");
    setStep("idle");
    setTxHash("");
    setDeployedAddress("");
  };

  const walletOk = wallet.isReady && !wallet.error && wallet.client;
  const isDeploying = step === "deploying" || step === "confirming";

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
          <button
            onClick={() => (window.location.href = "/")}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {icons.back}
          </button>
          <h1 className="text-lg font-bold text-white">Launch Token</h1>
          {step === "done" && (
            <button
              onClick={resetForm}
              className="ml-auto text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Create Another
            </button>
          )}
        </div>
      </header>

      {/* Wallet Warning */}
      {!walletOk && wallet.isReady && (
        <section className="px-6 mb-3">
          <div className="max-w-md mx-auto glass-card border border-yellow-600/30 p-3 flex items-center gap-2 text-yellow-400 text-xs">
            {icons.warning}
            Wallet not detected. Open in Warpcast to deploy tokens.
          </div>
        </section>
      )}

      {step !== "done" ? (
        <>
          {/* Info Card */}
          <section
            className="px-6 mb-4 fade-in"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="max-w-md mx-auto glass-card p-3 flex items-start gap-2 border-purple-500/20">
              <span className="text-purple-400 mt-0.5">{icons.info}</span>
              <div>
                <p className="text-xs text-gray-400">
                  Deploy a standard ERC-20 token on{" "}
                  <span className="text-purple-400">{CHAINS[chainKey].name}</span> chain.
                </p>
                <p className="text-[10px] text-gray-600 mt-1">
                  Gas fees apply. Tokens minted to your wallet.
                </p>
              </div>
            </div>
          </section>

          {/* Chain Selector */}
          <section className="px-6 mb-3 fade-in" style={{ animationDelay: "0.08s" }}>
            <div className="max-w-md mx-auto flex items-center justify-center gap-2">
              {Object.entries(CHAINS).map(([key, chain]) => (
                <button
                  key={key}
                  onClick={() => setChainKey(key as ChainKey)}
                  className={`badge cursor-pointer transition-opacity text-xs ${
                    chainKey === key
                      ? chain.color + " opacity-100"
                      : "opacity-40 hover:opacity-70"
                  }`}
                  style={chainKey !== key ? { background: "rgba(138,99,210,0.1)", color: "#8a63d2" } : {}}
                >
                  Deploy on {chain.label}
                </button>
              ))}
            </div>
          </section>

          {/* Form */}
          <section className="px-6 fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="max-w-md mx-auto glass-card p-5 glow-purple">
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Token Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Base Farcaster Token"
                  className="input-glass"
                  disabled={isDeploying}
                />
              </div>

              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Symbol
                </label>
                <input
                  value={symbol}
                  onChange={(e) =>
                    setSymbol(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="e.g. BFT"
                  className="input-glass"
                  disabled={isDeploying}
                />
              </div>

              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Total Supply
                </label>
                <input
                  value={supply}
                  onChange={(e) => setSupply(e.target.value)}
                  type="number"
                  className="input-glass"
                  disabled={isDeploying}
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  {parseInt(supply).toLocaleString()} tokens (18 decimals)
                </p>
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-500 block mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's your token about?"
                  rows={2}
                  className="input-glass resize-none"
                  disabled={isDeploying}
                />
              </div>

              <button
                onClick={handleLaunch}
                disabled={isDeploying || !walletOk}
                className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2"
              >
                {isDeploying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {step === "confirming"
                      ? "Confirming..."
                      : `Deploying on ${CHAINS[chainKey].name}...`}
                  </>
                ) : (
                  <>
                    {icons.rocket}
                    Deploy Token
                  </>
                )}
              </button>

              {/* Transaction info */}
              {txHash && (
                <div className="mt-3 p-2 bg-white/5 rounded-lg">
                  <p className="text-[10px] text-gray-500 truncate">
                    Tx: {txHash}
                  </p>
                  <a
                    href={`{chainConfig.explorer}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-purple-400 underline"
                  >
                    View on BaseScan ↗
                  </a>
                </div>
              )}

              {message && (
                <div
                  className={`mt-3 text-xs text-center p-2 rounded-lg ${
                    step === "error"
                      ? "text-red-400 bg-red-400/10"
                      : "text-gray-400 bg-gray-400/10"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        /* Success State */
        <section className="px-6 fade-in">
          <div className="max-w-md mx-auto glass-card p-6 glow-purple text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">
              {symbol || "TOKEN"} Token Created!
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Deployed on {CHAINS[chainKey].name} — verified deployment
            </p>

            <div className="glass-card p-4 mb-4 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Name</span>
                <span className="text-white font-medium">{name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Symbol</span>
                <span className="text-white font-medium">{symbol}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Supply</span>
                <span className="text-white font-medium">
                  {parseInt(supply).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Chain</span>
                <span className={`badge ${chainConfig.color}`}>{chainConfig.label}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Address</span>
                <span className="text-gray-400 font-mono text-[10px] truncate max-w-[180px]">
                  {deployedAddress}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tx</span>
                <a
                  href={`{chainConfig.explorer}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 font-mono text-[10px] truncate max-w-[160px] underline"
                >
                  {txHash?.slice(0, 14)}...
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() =>
                  sdk.actions?.openUrl?.(
                    `${chainConfig.explorer}/address/${deployedAddress}`
                  )
                }
                className="btn-primary w-full text-sm flex items-center justify-center gap-2"
              >
                {icons.link} View on BaseScan
              </button>
              <button
                onClick={resetForm}
                className="btn-secondary w-full text-sm"
              >
                Create Another Token
              </button>
            </div>
          </div>
        </section>
      )}

      {message && step !== "deploying" && step !== "confirming" && (
        <div className="toast" onClick={() => setMessage("")}>
          {message}
        </div>
      )}

      <footer className="px-6 py-6 mt-auto fade-in">
        <div className="max-w-md mx-auto text-center">
          <p className="text-[10px] text-gray-600">
            Token Launcher · {CHAINS[chainKey].name} · FrameOS
          </p>
        </div>
      </footer>
    </main>
  );
}
