// Swap utilities: 0x API integration, token management
import { type Address, parseUnits, formatUnits } from "viem";

// 0x API base URL
const ZERO_X_API = "https://api.0x.org";

// Solana native token address (wrapped SOL — standard placeholder for native SOL)
export const SOL_NATIVE = "So11111111111111111111111111111111111111112";

// Chain configs — 0x supports EVM chains; Solana uses Jupiter API
export const CHAINS = {
  ethereum: {
    id: 1,
    name: "Ethereum",
    label: "ETH",
    color: "badge-blue",
    explorer: "https://etherscan.io",
    nativeToken: "ETH",
    nativeSymbol: "ETH",
  },
  base: {
    id: 8453,
    name: "Base",
    label: "Base",
    color: "badge-green",
    explorer: "https://basescan.org",
    nativeToken: "ETH",
    nativeSymbol: "ETH",
  },
  arbitrum: {
    id: 42161,
    name: "Arbitrum One",
    label: "Arbitrum",
    color: "badge-purple",
    explorer: "https://arbiscan.io",
    nativeToken: "ETH",
    nativeSymbol: "ETH",
  },
  optimism: {
    id: 10,
    name: "Optimism",
    label: "OP",
    color: "badge-pink",
    explorer: "https://optimistic.etherscan.io",
    nativeToken: "ETH",
    nativeSymbol: "ETH",
  },
  bsc: {
    id: 56,
    name: "BNB Chain",
    label: "BSC",
    color: "badge-green",
    explorer: "https://bscscan.com",
    nativeToken: "BNB",
    nativeSymbol: "BNB",
  },
  polygon: {
    id: 137,
    name: "Polygon",
    label: "Polygon",
    color: "badge-pink",
    explorer: "https://polygonscan.com",
    nativeToken: "MATIC",
    nativeSymbol: "POL",
  },
  avalanche: {
    id: 43114,
    name: "Avalanche",
    label: "Avalanche",
    color: "badge-blue",
    explorer: "https://snowtrace.io",
    nativeToken: "AVAX",
    nativeSymbol: "AVAX",
  },
  solana: {
    id: 101,
    name: "Solana",
    label: "Solana",
    color: "badge-blue",
    explorer: "https://solscan.io",
    nativeToken: "SOL",
    nativeSymbol: "SOL",
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

// ETH placeholder address used by 0x for native tokens
const ETH_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address;

// ===== Token Lists per Chain =====
export type TokenItem = {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
};

const TOKEN_LISTS: Record<number, TokenItem[]> = {
  1: [ // Ethereum
    { symbol: "ETH", name: "Ether", address: ETH_PLACEHOLDER, decimals: 18 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
    { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
  ],
  8453: [ // Base
    { symbol: "ETH", name: "Ether", address: ETH_PLACEHOLDER, decimals: 18 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    { symbol: "DEGEN", name: "Degen", address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efdefe", decimals: 18 },
  ],
  42161: [ // Arbitrum
    { symbol: "ETH", name: "Ether", address: ETH_PLACEHOLDER, decimals: 18 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
    { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18 },
  ],
  10: [ // Optimism
    { symbol: "ETH", name: "Ether", address: ETH_PLACEHOLDER, decimals: 18 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6 },
    { symbol: "OP", name: "Optimism", address: "0x4200000000000000000000000000000000000042", decimals: 18 },
  ],
  56: [ // BSC
    { symbol: "BNB", name: "BNB", address: ETH_PLACEHOLDER, decimals: 18 },
    { symbol: "WBNB", name: "Wrapped BNB", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
    { symbol: "USDT", name: "Tether USD", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
    { symbol: "BUSD", name: "Binance USD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18 },
    { symbol: "CAKE", name: "PancakeSwap", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", decimals: 18 },
  ],
  137: [ // Polygon
    { symbol: "POL", name: "Polygon", address: ETH_PLACEHOLDER, decimals: 18 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
    { symbol: "MATIC", name: "Polygon (legacy)", address: "0x0000000000000000000000000000000000001010", decimals: 18 },
  ],
  43114: [ // Avalanche
    { symbol: "AVAX", name: "Avalanche", address: ETH_PLACEHOLDER, decimals: 18 },
    { symbol: "WAVAX", name: "Wrapped AVAX", address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
    { symbol: "JOE", name: "Trader Joe", address: "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", decimals: 18 },
  ],
  101: [ // Solana
    { symbol: "SOL", name: "Solana", address: SOL_NATIVE as Address, decimals: 9 },
    { symbol: "WSOL", name: "Wrapped SOL", address: "So11111111111111111111111111111111111111112" as Address, decimals: 9 },
    { symbol: "USDC", name: "USD Coin", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address, decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "Es9vMF6zaW3tK7jG7JjYJ8eE1qJqFcHv1JX1fX9yWzZ" as Address, decimals: 6 },
    { symbol: "JitoSOL", name: "Jito Staked SOL", address: "J1toso1uCk3QLmjYX2Zpf3ZbHg8eZ5e7F5b3Q8Z1Q1j" as Address, decimals: 9 },
    { symbol: "BONK", name: "Bonk", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" as Address, decimals: 5 },
    { symbol: "WIF", name: "dogwifhat", address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" as Address, decimals: 6 },
  ],
};

// Rough price feeds for fallback when 0x API is unavailable
const PRICE_FEEDS: Record<number, Record<string, number>> = {
  1: { ETH: 2023, WETH: 2023, USDC: 1, USDT: 1, DAI: 1, WBTC: 69000 },
  8453: { ETH: 2023, WETH: 2023, USDC: 1, DEGEN: 0.0018 },
  42161: { ETH: 2023, WETH: 2023, USDC: 1, USDT: 1, ARB: 0.15 },
  10: { ETH: 2023, WETH: 2023, USDC: 1, USDT: 1, OP: 0.30 },
  56: { BNB: 310, WBNB: 310, USDC: 1, USDT: 1, BUSD: 1, CAKE: 0.50 },
  137: { POL: 0.20, MATIC: 0.20, WETH: 2023, USDC: 1, USDT: 1 },
  43114: { AVAX: 17, WAVAX: 17, USDC: 1, USDT: 1, JOE: 0.10 },
  101: { SOL: 145, WSOL: 145, USDC: 1, USDT: 1, JitoSOL: 155, BONK: 0.00002, WIF: 1.80 },
};

// ===== Quote generation =====

function generateFallbackQuote(params: {
  chainId: number;
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
}): SwapQuote | null {
  try {
    const feeds = PRICE_FEEDS[params.chainId] ?? PRICE_FEEDS[8453];
    const tokens = getTokens(params.chainId);

    const sellT = tokens.find((t) => t.address.toLowerCase() === params.sellToken.toLowerCase()) ?? tokens[0];
    const buyT = tokens.find((t) => t.address.toLowerCase() === params.buyToken.toLowerCase()) ?? tokens[1];
    const sellPrice = feeds[sellT.symbol] ?? 1;
    const buyPrice = feeds[buyT.symbol] ?? 1;
    const sellHuman = formatUnits(BigInt(params.sellAmount), sellT.decimals);
    const buyHuman = (parseFloat(sellHuman) * sellPrice) / buyPrice;
    if (!isFinite(buyHuman) || buyHuman <= 0) return null;
    const buyAmountWei = parseUnits(buyHuman.toFixed(Math.min(buyT.decimals, 6)), buyT.decimals).toString();

    // Native tokens on non-ETH chains need no value in the quote
    const isNativeSell = params.sellToken.toLowerCase() === ETH_PLACEHOLDER.toLowerCase();

    return {
      price: parseUnits((buyPrice / sellPrice).toFixed(18), 18).toString(),
      buyAmount: buyAmountWei,
      sellAmount: params.sellAmount,
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      guaranteedPrice: buyAmountWei,
      to: "0x0000000000000000000000000000000000000000",
      data: "0x",
      value: isNativeSell ? params.sellAmount : "0",
      gas: "250000",
      estimatedGas: "250000",
      gasPrice: parseUnits("0.001", 9).toString(),
      protocolFee: "0",
      minimumProtocolFee: "0",
      buyTokenAddress: params.buyToken,
      sellTokenAddress: params.sellToken,
      sources: [{ name: "Estimated", proportion: "1" }],
      allowanceTarget: "0x0000000000000000000000000000000000000000",
    };
  } catch {
    return null;
  }
}

export async function fetchSwapQuote(params: {
  chainId: number;
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
  takerAddress?: Address;
  slippageBps?: number;
}): Promise<SwapQuote> {
  // Try 0x API first (supports: 1, 10, 56, 137, 8453, 42161, 43114)
  try {
    const searchParams = new URLSearchParams({
      chainId: String(params.chainId),
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      sellAmount: params.sellAmount,
      slippageBps: String(params.slippageBps ?? 50),
    });

    if (params.takerAddress) {
      searchParams.set("taker", params.takerAddress);
    }

    const url = `${ZERO_X_API}/swap/allowance-holder/quote?${searchParams.toString()}`;

    const res = await fetch(url, {
      headers: {
        "0x-api-key": "0x-api-key-not-required",
        "0x-version": "v2",
      },
    });

    if (res.ok) {
      return res.json();
    }

    console.warn("0x API unavailable, using estimated quote");
  } catch {
    console.warn("0x API unreachable, using estimated quote");
  }

  const fallback = generateFallbackQuote(params);
  if (!fallback) {
    throw new Error("Could not generate quote — please try a different amount or token pair");
  }
  return fallback;
}

// ===== Public API =====

export function getTokens(chainId: number): TokenItem[] {
  return TOKEN_LISTS[chainId] ?? TOKEN_LISTS[8453];
}

/** Get native token symbol for a chain (e.g. "BNB" for BSC, "AVAX" for Avalanche) */
export function getNativeSymbol(chainId: number): string {
  const cfg = getChainConfig(chainId);
  return cfg.nativeSymbol ?? "ETH";
}

/** Find a specific token by symbol on a chain */
export function getToken(symbol: string, chainId?: number) {
  const tokens = chainId ? getTokens(chainId) : TOKEN_LISTS[8453];
  return tokens.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase()) ?? tokens[0];
}

/** Shortcut: list of chain keys for popular order */
export const POPULAR_CHAIN_KEYS: ChainKey[] = ["base", "solana", "ethereum", "bsc", "polygon", "arbitrum", "optimism", "avalanche"];

/** Check if a chain key is Solana (non-EVM) */
export function isSolanaChain(chainKey: ChainKey): boolean {
  return chainKey === "solana";
}
export function isSolanaChainId(chainId: number): boolean {
  return chainId === 101;
}

// Format helpers
export function toWei(amount: string, decimals: number): string {
  try {
    return parseUnits(amount, decimals).toString();
  } catch {
    return "0";
  }
}

export function fromWei(amount: string, decimals: number): string {
  try {
    return formatUnits(BigInt(amount), decimals);
  } catch {
    return "0";
  }
}
