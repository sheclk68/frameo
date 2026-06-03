// Solana swap utilities: Jupiter API v6 integration
import {
  Connection,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";

const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6";
const JUPITER_SWAP_API = "https://quote-api.jup.ag/v6";

// ===== Types =====

export interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;      // raw lamports (smallest unit), NOT human-readable
  slippageBps?: number; // default 50 = 0.5%
  swapMode?: "ExactIn" | "ExactOut";
}

export interface JupiterRoute {
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  marketInfos: Array<{
    id: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    lpFee: { amount: string; mint: string; pct: string };
    platformFee: { amount: string; mint: string; pct: string } | null;
  }>;
  swapMode: "ExactIn" | "ExactOut";
}

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: "ExactIn" | "ExactOut";
  slippageBps: number;
  platformFee: { amount: string; mint: string; pct: string } | null;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  scoreReport: Record<string, unknown> | null;
  contextSlot: number;
  timeTaken: number;
}

export interface JupiterSwapRequest {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number | "auto";
  computeUnitPriceMicroLamports?: number;
}

export interface JupiterSwapResponse {
  swapTransaction: string; // base64-encoded VersionedTransaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
  computeUnitLimit: number;
  prioritizationType: { computeBudget: { microLamports: number; estimatedMicroLamports: number } };
  dynamicSlippageReport: { slippageBps: number; otherAmount: number; simulatedIncrementPerSlippage: string };
  simulationError: string | null;
}

// Human-readable quote result for display
export interface SolanaSwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  slippageBps: number;
  routeSummary: string;
}

// ===== Jupiter Quote =====

/**
 * Fetch a swap quote from Jupiter v6 API
 */
export async function getJupiterQuote(
  params: JupiterQuoteParams
): Promise<JupiterQuoteResponse> {
  const url = new URL(`${JUPITER_QUOTE_API}/quote`);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", String(params.amount));
  url.searchParams.set("slippageBps", String(params.slippageBps ?? 50));
  url.searchParams.set("swapMode", params.swapMode ?? "ExactIn");

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Get a simplified human-readable quote
 */
export async function getSolanaQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}): Promise<SolanaSwapQuote> {
  const quote = await getJupiterQuote(params);

  // Build route summary
  const routeLabels = quote.routePlan.map((r) => r.swapInfo.label);
  const uniqueLabels = [...new Set(routeLabels)];

  return {
    inputMint: quote.inputMint,
    outputMint: quote.outputMint,
    inAmount: quote.inAmount,
    outAmount: quote.outAmount,
    priceImpactPct: quote.priceImpactPct,
    slippageBps: quote.slippageBps,
    routeSummary: uniqueLabels.join(", "),
  };
}

// ===== Jupiter Swap Transaction =====

/**
 * Get a swap transaction from Jupiter v6 (returns base64-encoded VersionedTransaction)
 */
export async function getJupiterSwapTransaction(
  params: JupiterSwapRequest
): Promise<JupiterSwapResponse> {
  const res = await fetch(`${JUPITER_SWAP_API}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter swap tx failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Deserialize a base64 swap transaction into a VersionedTransaction
 */
export function deserializeSwapTransaction(base64Tx: string): VersionedTransaction {
  const txBytes = Buffer.from(base64Tx, "base64");
  return VersionedTransaction.deserialize(txBytes);
}

/**
 * Sign and send a Solana swap transaction
 */
export async function signAndSendSolanaSwap(
  connection: Connection,
  swapTransactionBase64: string,
  getSignature: (tx: VersionedTransaction) => Promise<string>
): Promise<string> {
  const txBytes = Buffer.from(swapTransactionBase64, "base64");
  const transaction = VersionedTransaction.deserialize(txBytes);

  // Sign via wallet callback (returns signature)
  const signature = await getSignature(transaction);

  // Send raw transaction
  const txId = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: true,
    maxRetries: 3,
  });

  return txId;
}

/**
 * Wait for a Solana transaction confirmation
 */
export async function waitForSolanaTx(
  connection: Connection,
  signature: string,
  commitment: "confirmed" | "finalized" = "confirmed"
): Promise<void> {
  const confirmation = await connection.confirmTransaction(signature, commitment);
  if (confirmation.value.err) {
    throw new Error(`Solana tx failed: ${JSON.stringify(confirmation.value.err)}`);
  }
}
