"use client";

import {
  type Address,
  type WalletClient,
  type PublicClient,
  createPublicClient,
  createWalletClient,
  custom,
  parseUnits,
  formatUnits,
} from "viem";
import { sepolia } from "viem/chains";
import { OPTIONS_VAULT_ABI, OPTION_TOKEN_ABI } from "./options-abi";

// Default vault address (Sepolia testnet — deploy your own!)
// For v1, user will input a custom vault address
export const DEFAULT_VAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

// ===== Types =====

export interface VaultInfo {
  address: Address;
  strikePrice: string;    // formatted USD
  maturity: number;       // unix timestamp
  settlementPrice: string; // formatted USD (0 if not settled)
  settled: boolean;
  totalDeposits: string;  // formatted ETH
  pTokenAddress: Address;
  nTokenAddress: Address;
  pSymbol: string;
  nSymbol: string;
}

export interface UserPosition {
  deposit: string;     // formatted ETH
  pBalance: string;    // formatted P token amount
  nBalance: string;    // formatted N token amount
  pPayoutPerUnit: string; // formatted ETH per P token
  nPayoutPerUnit: string; // formatted ETH per N token
}

// ===== Read Helpers =====

export function getVaultPublicClient() {
  return createPublicClient({
    chain: sepolia,
    transport: custom((window as any).ethereum),
  });
}

export async function getTokenSymbol(
  publicClient: PublicClient,
  tokenAddress: Address
): Promise<string> {
  try {
    return await publicClient.readContract({
      address: tokenAddress,
      abi: OPTION_TOKEN_ABI,
      functionName: "symbol",
    }) as string;
  } catch {
    return "?";
  }
}

export async function getVaultInfo(
  publicClient: PublicClient,
  vaultAddress: Address
): Promise<VaultInfo> {
  const [
    strikePrice,
    maturity,
    settlementPrice,
    settled,
    totalDeposits,
    pTokenAddr,
    nTokenAddr,
  ] = await Promise.all([
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "strikePrice" }) as Promise<bigint>,
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "maturity" }) as Promise<bigint>,
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "settlementPrice" }) as Promise<bigint>,
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "settled" }) as Promise<boolean>,
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "totalDeposits" }) as Promise<bigint>,
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "pToken" }) as Promise<Address>,
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "nToken" }) as Promise<Address>,
  ]);

  const [pSymbol, nSymbol] = await Promise.all([
    getTokenSymbol(publicClient, pTokenAddr),
    getTokenSymbol(publicClient, nTokenAddr),
  ]);

  return {
    address: vaultAddress,
    strikePrice: formatUnits(strikePrice, 18),
    maturity: Number(maturity),
    settlementPrice: settled ? formatUnits(settlementPrice as bigint, 18) : "0",
    settled,
    totalDeposits: formatUnits(totalDeposits as bigint, 18),
    pTokenAddress: pTokenAddr,
    nTokenAddress: nTokenAddr,
    pSymbol,
    nSymbol,
  };
}

export async function getUserPosition(
  publicClient: PublicClient,
  vaultAddress: Address,
  userAddress: Address,
): Promise<UserPosition> {
  const [deposit, pBal, nBal] = await Promise.all([
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "deposits", args: [userAddress] }) as Promise<bigint>,
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "pBalance", args: [userAddress] }) as Promise<bigint>,
    publicClient.readContract({ address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "nBalance", args: [userAddress] }) as Promise<bigint>,
  ]);

  let pPayout = "0";
  let nPayout = "0";
  try {
    const vaultInfo = await getVaultInfo(publicClient, vaultAddress);
    if (vaultInfo.settled) {
      const pp = await publicClient.readContract({
        address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "pPayoutPerToken",
      }) as bigint;
      const np = await publicClient.readContract({
        address: vaultAddress, abi: OPTIONS_VAULT_ABI, functionName: "nPayoutPerToken",
      }) as bigint;
      pPayout = formatUnits(pp, 18);
      nPayout = formatUnits(np, 18);
    }
  } catch { /* vault not settled */ }

  return {
    deposit: formatUnits(deposit, 18),
    pBalance: formatUnits(pBal, 18),
    nBalance: formatUnits(nBal, 18),
    pPayoutPerUnit: pPayout,
    nPayoutPerUnit: nPayout,
  };
}

// ===== Write Helpers =====

export async function depositToVault(
  walletClient: WalletClient,
  vaultAddress: Address,
  ethAmount: string,
): Promise<`0x${string}`> {
  const account = walletClient.account;
  if (!account) throw new Error("Wallet not connected");

  const value = parseUnits(ethAmount, 18);
  return await walletClient.sendTransaction({
    account: account.address as Address,
    to: vaultAddress,
    value,
    data: "0xd0e30db0" as `0x${string}`,
    chain: walletClient.chain,
  } as any);
}

export async function redeemFromVault(
  walletClient: WalletClient,
  vaultAddress: Address,
  amount: string,
): Promise<`0x${string}`> {
  const account = walletClient.account;
  if (!account) throw new Error("Wallet not connected");

  const tokenAmount = parseUnits(amount, 18);
  return await walletClient.writeContract({
    address: vaultAddress,
    abi: OPTIONS_VAULT_ABI,
    functionName: "redeem",
    args: [tokenAmount],
    account: account.address as Address,
    chain: sepolia,
  } as any);
}

export async function emergencyWithdrawFromVault(
  walletClient: WalletClient,
  vaultAddress: Address,
): Promise<`0x${string}`> {
  const account = walletClient.account;
  if (!account) throw new Error("Wallet not connected");

  return await walletClient.writeContract({
    address: vaultAddress,
    abi: OPTIONS_VAULT_ABI,
    functionName: "emergencyWithdraw",
    args: [],
    account: account.address as Address,
    chain: sepolia,
  } as any);
}

export async function settleVault(
  walletClient: WalletClient,
  vaultAddress: Address,
  price: string,
): Promise<`0x${string}`> {
  const account = walletClient.account;
  if (!account) throw new Error("Wallet not connected");

  const priceWei = parseUnits(price, 18);
  return await walletClient.writeContract({
    address: vaultAddress,
    abi: OPTIONS_VAULT_ABI,
    functionName: "settle",
    args: [priceWei],
    account: account.address as Address,
    chain: sepolia,
  } as any);
}

// ===== Format helpers =====

export function formatTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isExpired(maturity: number): boolean {
  return Date.now() / 1000 > maturity;
}

export function timeUntilMaturity(maturity: number): string {
  const now = Math.floor(Date.now() / 1000);
  if (now >= maturity) return "Matured";
  const diff = maturity - now;
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  return `${days}d ${hours}h`;
}
