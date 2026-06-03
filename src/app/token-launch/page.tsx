"use client";

import { useEffect, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useWalletManager } from "@/hooks/useWalletManager";
import {
  encodeDeployData,
  encodeFunctionData,
  parseUnits,
  type Address,
  type Hash,
} from "viem";
import { base, arbitrum, bsc, polygon, avalanche, optimism, mainnet } from "viem/chains";
import { CHAINS, getChainConfig, POPULAR_CHAIN_KEYS, isSolanaChain, type ChainKey } from "@/lib/swap";
import { deployClankerToken, isClankerSupported } from "@/lib/clanker";
import { PublicKey } from "@solana/web3.js";
import { deploySplTokenAtomic } from "@/lib/token-launch-solana";
import FrameFactoryArtifact from "@/contracts/FrameFactory.json";

const VIEM_CHAIN_MAP: Record<number, any> = {
  1: mainnet,
  10: optimism,
  56: bsc,
  137: polygon,
  8453: base,
  42161: arbitrum,
  43114: avalanche,
};

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
  flash: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  share: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  ),
};

type DeployStep = "idle" | "deploying" | "confirming" | "done" | "error";
type LaunchMode = "standard" | "clanker";

export default function TokenLaunchPage() {
  const [user, setUser] = useState<{ fid?: number; username?: string }>({});
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000000");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [chainKey, setChainKey] = useState<ChainKey>("base");
  const [launchMode, setLaunchMode] = useState<LaunchMode>("clanker");
  const chainConfig = getChainConfig(CHAINS[chainKey].id);

  // Deploy state
  const [step, setStep] = useState<DeployStep>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [deployedAddress, setDeployedAddress] = useState<string>("");
  const [factoryAddress, setFactoryAddress] = useState<string>("");

  const walletManager = useWalletManager();
  const wallet = walletManager.evmWallet;
  const solanaWallet = walletManager.solanaWallet;
  const isSolana = isSolanaChain(chainKey);

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

  const handleLaunch = useCallback(async () => {
    if (!name.trim() || !symbol.trim()) {
      setMessage("Name and symbol are required");
      return;
    }

    setStep("deploying");
    setMessage("");
    setTxHash("");
    setDeployedAddress("");

    try {
      // --- Solana SPL Token ---
      if (isSolana && solanaWallet.connection && solanaWallet.publicKey) {
        setMessage("Creating SPL token on Solana...");
        const result = await deploySplTokenAtomic({
          connection: solanaWallet.connection,
          walletPublicKey: new PublicKey(solanaWallet.publicKey),
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          decimals: 9,
          supply: parseInt(supply) || 1000000000,
          signTransaction: async (tx) => {
            const signed = await solanaWallet.signTx(tx as any);
            return signed;
          },
        });
        setTxHash(result.txHash);
        setDeployedAddress(result.mintAddress);
        setStep("done");
        setMessage(`🎉 SPL token created at ${result.mintAddress.slice(0, 10)}...`);
        return;
      }

      // --- EVM Wallet check ---
      if (!wallet.client || !wallet.address || !wallet.publicClient) {
        setMessage(isSolana ? "Connect Solana wallet first." : "Wallet not connected.");
        return;
      }

      if (launchMode === "clanker") {
        // --- Clanker Mode ---
        setMessage("Deploying via Clanker...");
        const result = await deployClankerToken(
          wallet.client,
          wallet.publicClient,
          name,
          symbol,
        );
        setTxHash(result.txHash);
        setDeployedAddress(result.address);
        setStep("done");
        setMessage(`🎉 Clanker token deployed at ${result.address.slice(0, 10)}...`);
      } else {
        // --- Standard Mode ---
        const totalSupplyWei = parseUnits(supply || "0", 18);
        const deployChain = VIEM_CHAIN_MAP[CHAINS[chainKey].id] ?? base;
        const factoryAbi = FrameFactoryArtifact.factory.abi;
        const factoryBytecode = FrameFactoryArtifact.factory.bytecode as `0x${string}`;

        let factory = factoryAddress as Address | "";

        if (!factory) {
          setMessage(`Deploying FrameFactory on ${CHAINS[chainKey].name}...`);
          const deployData = encodeDeployData({
            abi: factoryAbi,
            bytecode: factoryBytecode,
            args: [],
          });

          const deployHash = await wallet.client.sendTransaction({
            account: wallet.address,
            chain: deployChain,
            data: deployData,
          });

          const deployReceipt = await wallet.publicClient.waitForTransactionReceipt({
            hash: deployHash as Hash,
          });

          factory = deployReceipt.contractAddress as Address;
          setFactoryAddress(factory);
          setMessage(`Factory ready. Deploying your token...`);
        }

        const createData = encodeFunctionData({
          abi: factoryAbi,
          functionName: "createToken",
          args: [name.trim(), symbol.trim().toUpperCase(), totalSupplyWei],
        });

        const deployFee = parseUnits("0.0001", 18);

        const hash = await wallet.client.sendTransaction({
          account: wallet.address,
          chain: deployChain,
          to: factory,
          data: createData,
          value: deployFee,
        });

        setTxHash(hash as string);
        setMessage("Waiting for confirmation...");

        const receipt = await wallet.publicClient.waitForTransactionReceipt({
          hash: hash as Hash,
        });

        const eventSig = "0x" + Buffer.from("TokenCreated(address,string,string,uint256,address)").toString("hex");
        const tokenLog = receipt.logs.find((l: any) => l.address.toLowerCase() === factory!.toLowerCase());
        let contractAddress = "";
        if (tokenLog && (tokenLog as any).topics?.length > 1) {
          contractAddress = `0x${(tokenLog as any).topics[1].slice(26)}`;
        }
        if (!contractAddress) {
          contractAddress = receipt.logs[0]?.address || "";
        }

        setDeployedAddress(contractAddress || "0x...");
        setStep("done");
        setMessage(`🎉 Token deployed at ${contractAddress.slice(0, 10)}...`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Deployment failed";
      setMessage(msg.includes("rejected") || msg.includes("denied") ? "Cancelled by user" : `Error: ${msg.slice(0, 150)}`);
      setStep("error");
    }
  }, [name, symbol, supply, wallet, factoryAddress, chainKey, launchMode]);

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

  const walletOk = isSolana
    ? walletManager.activeType === "solana"
    : walletManager.activeType === "evm";
  const isDeploying = step === "deploying" || step === "confirming";
  const isBase = chainKey === "base";

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

      {/* Wallet Warning + Connect */}
      {!walletOk && !isSolana && (
        <section className="px-6 mb-3">
          <div className="max-w-md mx-auto glass-card border border-yellow-600/30 p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-xs mb-2">
              {icons.warning}
              Wallet not connected
            </div>
            <button
              onClick={() => walletManager.connect("evm")}
              className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2"
            >
              Connect MetaMask / Rabby
            </button>
            <p className="text-[10px] text-gray-500 mt-2">
              In Warpcast: auto-connects. In browser: click to connect.
            </p>
          </div>
        </section>
      )}

      {/* Solana Wallet Warning */}
      {!walletOk && isSolana && (
        <section className="px-6 mb-3">
          <div className="max-w-md mx-auto glass-card border border-purple-600/30 p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs mb-2">
              {icons.warning}
              Solana wallet needed
            </div>
            <button
              onClick={() => walletManager.connect("solana")}
              className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2 bg-purple-600"
            >
              Connect Phantom / Backpack
            </button>
            <p className="text-[10px] text-gray-500 mt-2">
              Connect Phantom wallet to create SPL tokens on Solana.
            </p>
          </div>
        </section>
      )}

      {/* Mode Toggle */}
      {step !== "done" && (
        <section className="px-6 mb-3 fade-in">
          <div className="max-w-md mx-auto">
            <div className="glass-card p-1 flex rounded-xl">
              {!isSolana && (
                <button
                  onClick={() => { setLaunchMode("clanker"); if (!isBase) setChainKey("base"); }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    launchMode === "clanker"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {icons.flash} Clanker Token
                </button>
              )}
              <button
                onClick={() => setLaunchMode("standard")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  launchMode === "standard"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {isSolana ? icons.rocket : icons.rocket} {isSolana ? "SPL Token" : "Standard Token"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Mode Info */}
      {launchMode === "clanker" && step !== "done" && !isSolana && (
        <section className="px-6 mb-3 fade-in">
          <div className="max-w-md mx-auto glass-card p-3 flex items-start gap-2 border-purple-500/20">
            <span className="text-purple-400 mt-0.5">{icons.flash}</span>
            <div>
              <p className="text-xs text-gray-400">
                Deploy via <span className="text-purple-400 font-semibold">Clanker</span> on <span className="text-purple-400">Base</span> — auto liquidity pool, dEaD address suffix 🔥
              </p>
              <p className="text-[10px] text-gray-600 mt-1">
                Token gets automatic Uniswap V4 pool. Gas: ~0.005 ETH.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Solana Mode Info */}
      {isSolana && step !== "done" && (
        <section className="px-6 mb-3 fade-in">
          <div className="max-w-md mx-auto glass-card p-3 flex items-start gap-2 border-purple-500/20">
            <span className="text-purple-400 mt-0.5">{icons.rocket}</span>
            <div>
              <p className="text-xs text-gray-400">
                Create an <span className="text-purple-400 font-semibold">SPL Token</span> on <span className="text-purple-400">Solana</span> — standard SPL token with mint authority 🪙
              </p>
              <p className="text-[10px] text-gray-600 mt-1">
                No automatic liquidity. Gas: ~0.001 SOL. Two transactions needed.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Gas Warning */}
      {walletOk && step !== "done" && (
        <section className="px-6 mb-3">
          <div className="max-w-md mx-auto glass-card border border-purple-500/20 p-3 flex items-center gap-2 text-purple-400 text-xs">
            {icons.info}
            {isSolana
              ? "Deployment needs ~0.003 SOL on Solana for gas (mint creation + token minting)."
              : launchMode === "clanker"
              ? "Deployment needs ~0.005 ETH on Base for gas."
              : `Deployment needs ~0.005 ETH on ${CHAINS[chainKey].name} for gas.`}
          </div>
        </section>
      )}

      {step !== "done" ? (
        <>
          {/* Chain Selector — standard mode or Solana */}
          {(launchMode === "standard" || isSolana) && (
            <section className="px-6 mb-3 fade-in" style={{ animationDelay: "0.08s" }}>
              <div className="max-w-md mx-auto flex items-center justify-center gap-2 flex-wrap">
                {POPULAR_CHAIN_KEYS.map((key) => {
                  const chain = CHAINS[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setChainKey(key)}
                      className={`badge cursor-pointer transition-opacity text-xs ${
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
            </section>
          )}

          {/* Clanker Mode — Base badge */}
          {launchMode === "clanker" && !isSolana && (
            <section className="px-6 mb-3 fade-in" style={{ animationDelay: "0.08s" }}>
              <div className="max-w-md mx-auto text-center">
                <span className="badge badge-purple">Base (8453)</span>
                <span className="text-[10px] text-gray-600 ml-2">Only chain supported by Clanker</span>
              </div>
            </section>
          )}

          {/* Form */}
          <section className="px-6 fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="max-w-md mx-auto glass-card p-5 glow-purple">
              {/* Supply field — only for standard */}
              {launchMode === "standard" && (
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
              )}

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
                      : `Deploying${launchMode === "clanker" ? " with Clanker" : ""}...`}
                  </>
                ) : (
                  <>
                    {launchMode === "clanker" ? icons.flash : icons.rocket}
                    {launchMode === "clanker" ? "Deploy Clanker Token" : "Deploy Token"}
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
                    href={isSolana ? `https://solscan.io/tx/${txHash}` : `https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-purple-400 underline"
                  >
                    {isSolana ? "View on Solscan ↗" : "View on BaseScan ↗"}
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
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-white mb-2">
              {symbol || "TOKEN"} Token Created!
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {isSolana
                ? "SPL Token created on Solana — mint authority is your wallet"
                : launchMode === "clanker"
                ? "Deployed via Clanker on Base — auto-liquidity pool ready!"
                : `Deployed on ${CHAINS[chainKey].name} — verified deployment`}
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
              {(launchMode === "standard" || isSolana) && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Supply</span>
                  <span className="text-white font-medium">{parseInt(supply).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Chain</span>
                <span className={`badge ${chainConfig.color}`}>{isSolana ? "Solana" : launchMode === "clanker" ? "Base" : chainConfig.label}</span>
              </div>
              {launchMode === "clanker" && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Type</span>
                  <span className="badge badge-purple">Clanker ✦ dEaD</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Address</span>
                <span className="text-gray-400 font-mono text-[10px] truncate max-w-[180px]">
                  {deployedAddress}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tx</span>
                <a
                  href={isSolana ? `https://solscan.io/tx/${txHash}` : `https://basescan.org/tx/${txHash}`}
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
                onClick={() => {
                  const shareText = isSolana
                    ? `I just launched $${symbol} on Solana via FrameOS 🪙\n\nSPL Token created — mint: ${deployedAddress.slice(0, 8)}...\n\nCreate your own: frameos.sheclk0068.workers.dev`
                    : `I just launched $${symbol} on Base via FrameOS + Clanker 🚀\n\nAuto Uniswap V4 pool with dEaD address suffix 🔥\n\nCreate your own: frameos.sheclk0068.workers.dev`;
                  const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
                  try { sdk.actions?.openUrl?.(castUrl); } catch { window.open(castUrl, "_blank"); }
                }}
                className="btn-primary w-full text-sm flex items-center justify-center gap-2 bg-purple-600"
              >
                {icons.share}
                Share on Farcaster
              </button>
              <button
                onClick={() =>
                  window.open(isSolana ? `https://solscan.io/address/${deployedAddress}` : `https://basescan.org/address/${deployedAddress}`, "_blank")
                }
                className="btn-primary w-full text-sm flex items-center justify-center gap-2"
              >
                {icons.link} {isSolana ? "View on Solscan" : "View on BaseScan"}
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
            Token Launcher · {isSolana ? "SPL on Solana" : launchMode === "clanker" ? "Clanker on Base" : CHAINS[chainKey].name} · FrameOS
          </p>
        </div>
      </footer>
    </main>
  );
}
