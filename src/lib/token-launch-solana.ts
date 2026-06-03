// Solana SPL Token launch utilities
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Mint account size (82 bytes)
const MINT_SIZE = 82;

export interface SplTokenDeployParams {
  connection: Connection;
  walletPublicKey: PublicKey;
  name: string;
  symbol: string;
  decimals: number;
  supply: number; // human-readable total supply
  /** Callback to sign a transaction (supports both legacy and versioned) */
  signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
}

export interface SplTokenDeployResult {
  mintAddress: string;
  txHash: string;
  tokenAccount: string;
}

/**
 * Create an SPL token on Solana
 *
 * Atomic 2-step:
 *   Step 1 — Create mint (SystemProgram.createAccount + InitializeMint) with partial sign
 *   Step 2 — Create ATA (if needed) + Mint tokens to user's Associated Token Account
 */
export async function deploySplTokenAtomic(
  params: SplTokenDeployParams
): Promise<SplTokenDeployResult> {
  const {
    connection,
    walletPublicKey,
    decimals,
    supply,
    signTransaction,
  } = params;

  const mintKeypair = Keypair.generate();
  const mintPubkey = mintKeypair.publicKey;
  const mintAuthority = walletPublicKey;

  // ---- Step 1: Create mint account ----

  const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const createTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: walletPublicKey,
      newAccountPubkey: mintPubkey,
      space: MINT_SIZE,
      lamports: mintRent,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintPubkey,
      decimals,
      mintAuthority,
      null, // no freeze authority
      TOKEN_PROGRAM_ID
    )
  );

  const { blockhash } = await connection.getLatestBlockhash();
  createTx.feePayer = walletPublicKey;
  createTx.recentBlockhash = blockhash;
  createTx.partialSign(mintKeypair);

  const signedTx = await signTransaction(createTx);
  const createHash = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  const createConfirm = await connection.confirmTransaction(createHash, "confirmed");
  if (createConfirm.value.err) {
    throw new Error(`Mint creation failed: ${JSON.stringify(createConfirm.value.err)}`);
  }

  // ---- Step 2: Create ATA + Mint tokens ----

  const tokenAmount = BigInt(Math.floor(supply * Math.pow(10, decimals)));

  // Derive ATA address off-chain
  const ataAddress = await getAssociatedTokenAddress(
    mintPubkey,
    walletPublicKey,
    false, // allowOwnerOffCurve
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const { blockhash: bh2 } = await connection.getLatestBlockhash();

  const mintTx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      walletPublicKey, // payer
      ataAddress,      // ata
      walletPublicKey, // owner
      mintPubkey,      // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    createMintToInstruction(
      mintPubkey,
      ataAddress,
      mintAuthority,
      tokenAmount,
      []
    )
  );

  mintTx.feePayer = walletPublicKey;
  mintTx.recentBlockhash = bh2;

  const mintSigned = await signTransaction(mintTx);
  const mintHash = await connection.sendRawTransaction(mintSigned.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  const mintConfirm = await connection.confirmTransaction(mintHash, "confirmed");
  if (mintConfirm.value.err) {
    throw new Error(`Token mint failed: ${JSON.stringify(mintConfirm.value.err)}`);
  }

  return {
    mintAddress: mintPubkey.toBase58(),
    txHash: mintHash,
    tokenAccount: ataAddress.toBase58(),
  };
}
