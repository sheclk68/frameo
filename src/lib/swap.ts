// Swap utilities: 0x API integration, token management
import { type Address, parseUnits, formatUnits } from "viem";

// 0x API base URL
const ZERO_X_API = "https://api.0x.org";

// Chain configs
export const CHAINS = {
  base: {
    id: 8453,
    name: "Base",
    label: "Base",
    color: "badge-green",
    explorer: "https://basescan.org",
  },
  arbitrum: {
    id: 42161,
    name: "Arbitrum One",
    label: "Arbitrum",
    color: "badge-blue",
    explorer: "https://arbiscan.io",
  },
} as const;

export type ChainKey = keyof typeof CHAINS;

export function getChainConfig(chainId: number) {
  return Object.values(CHAINS).find((c) => c.id === chainId) ?? CHAINS.base;
}

export interface SwapQuote {
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  to: Address;
  data: string;
  value: string;
  gas: string;
  estimatedGas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenAddress: Address;
  sellTokenAddress: Address;
  sources: Array<{ name: string; proportion: string }>;
  allowanceTarget: Address;
}

export async function fetchSwapQuote(params: {
  chainId: number;
  sellToken: Address;
  buyToken: Address;
  sellAmount: string; // in wei
  takerAddress?: Address;
  slippageBps?: number;
}): Promise<SwapQuote> {
  const searchParams = new URLSearchParams({
    chainId: String(params.chainId),
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    slippageBps: String(params.slippageBps ?? 50), // 0.5% default
  });

  if (params.takerAddress) {
    searchParams.set("takerAddress", params.takerAddress);
  }

  // Use 0x API v2 for best routing
  const url = `${ZERO_X_API}/swap/permit2/quote?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      "0x-api-key": "0x-api-key-not-required",
      "0x-version": "v2",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`0x quote failed: ${res.status} ${error}`);
  }

  return res.json();
}

// Token lists per chain
const ETH_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address;

const TOKENS_BASE: TokenItem[] = [
  { symbol: "ETH", name: "Ether", address: ETH_PLACEHOLDER, decimals: 18 },
  { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { symbol: "DEGEN", name: "Degen", address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efdefe", decimals: 18 },
  { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
];

const TOKENS_ARBITRUM: TokenItem[] = [
  { symbol: "ETH", name: "Ether", address: ETH_PLACEHOLDER, decimals: 18 },
  { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
  { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18 },
  { symbol: "WETH", name: "Wrapped Ether", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
];

export type TokenItem = {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
};

export function getTokens(chainId: number): TokenItem[] {
  if (chainId === CHAINS.arbitrum.id) return TOKENS_ARBITRUM;
  return TOKENS_BASE;
}

// Legacy alias
export const BASE_TOKENS = TOKENS_BASE;

// Find token by symbol on a given chain
export function getToken(symbol: string, chainId?: number) {
  const tokens = chainId ? getTokens(chainId) : TOKENS_BASE;
  return tokens.find(
    (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
  ) ?? tokens[0];
}

// Format human-readable amount to wei
export function toWei(amount: string, decimals: number): string {
  try {
    return parseUnits(amount, decimals).toString();
  } catch {
    return "0";
  }
}

// Format wei to human-readable
export function fromWei(amount: string, decimals: number): string {
  try {
    return formatUnits(BigInt(amount), decimals);
  } catch {
    return "0";
  }
}
