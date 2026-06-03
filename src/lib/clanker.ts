import { Clanker } from "clanker-sdk/v4";
import { type WalletClient, type PublicClient, type Address } from "viem";
import { base } from "viem/chains";

export type ClankerDeployResult = {
  txHash: `0x${string}`;
  address: string;
};

const POOL_POSITIONS = [
  { tickLower: -230400, tickUpper: -92160, positionBps: 2500 },
  { tickLower: -92160, tickUpper: 92160, positionBps: 7500 },
];

/**
 * Deploy a token using Clanker SDK (Base only)
 * User pays gas (~0.005 ETH), but gets automatic Uniswap V4 liquidity pool + dEaD address suffix
 */
export async function deployClankerToken(
  walletClient: WalletClient,
  publicClient: PublicClient,
  name: string,
  symbol: string,
): Promise<ClankerDeployResult> {
  const account = walletClient.account;
  if (!account) throw new Error("No wallet account");

  const clanker = new Clanker({
    wallet: walletClient as any,
    publicClient: publicClient as any,
  });

  const result = await clanker.deploy({
    name: name.trim(),
    symbol: symbol.trim().toUpperCase(),
    tokenAdmin: account.address as Address,
    chainId: 8453,
    vanity: true, // generates "b07" (dEaD) suffix address
    image: "",
    pool: {
      pairedToken: "WETH",
      tickIfToken0IsClanker: -230400,
      tickSpacing: 200,
      positions: POOL_POSITIONS,
    },
    vault: {
      percentage: 0,
      lockupDuration: 604800, // 7 days minimum
    },
    metadata: {},
    context: { interface: "SDK" },
  });

  if (result.error) {
    throw new Error(result.error.message || "Clanker deploy failed");
  }
  if (!result.txHash) throw new Error("Clanker deploy returned no txHash");

  const { address } = await result.waitForTransaction();
  if (!address) throw new Error("Clanker deploy returned no address");
  return {
    txHash: result.txHash,
    address,
  };
}

export function isClankerSupported(chainId: number): boolean {
  return chainId === 8453; // Base only for now
}
