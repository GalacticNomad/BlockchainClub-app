import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getAccount,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

// Club token mint address
export const TOKEN_MINT = new PublicKey(
  import.meta.env.VITE_TOKEN_MINT || 'TLGkmTbAUVPyXiCM8e67h9WnDLRiGRo8LAfGvPt6Awz'
);

// Solana RPC connection
export const connection = new Connection(
  import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

/**
 * Get the token balance for a wallet address.
 * Fetches via the backend proxy to avoid Solana public RPC CORS issues.
 * Returns the UI amount (human-readable, with decimals applied).
 */
export async function getTokenBalance(walletAddress) {
  try {
    const { getWalletBalance } = await import('./api');
    const response = await getWalletBalance(walletAddress);
    return response.data.balance ?? 0;
  } catch (err) {
    console.error('Error fetching token balance:', err);
    return 0;
  }
}

/**
 * Build a SPL token transfer transaction.
 * The moderator's wallet signs this to send tokens to a member.
 * Returns a Transaction object ready for wallet signing.
 */
export async function buildTokenTransfer(fromWallet, toWalletAddress, amount) {
  const fromPubkey = new PublicKey(fromWallet);
  const toPubkey = new PublicKey(toWalletAddress);

  // Get or derive associated token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, fromPubkey);
  const toTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, toPubkey);

  const transaction = new Transaction();

  // Check if the recipient has a token account; if not, create one
  try {
    await getAccount(connection, toTokenAccount);
  } catch {
    // Token account doesn't exist -- add instruction to create it
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromPubkey,           // payer
        toTokenAccount,       // associated token account
        toPubkey,             // owner
        TOKEN_MINT            // mint
      )
    );
  }

  // Convert human amount to raw token units (assuming 9 decimals)
  const decimals = 9;
  const rawAmount = BigInt(Math.round(amount * Math.pow(10, decimals)));

  // Add transfer instruction
  transaction.add(
    createTransferInstruction(
      fromTokenAccount,  // source
      toTokenAccount,    // destination
      fromPubkey,        // owner/authority
      rawAmount          // amount in raw units
    )
  );

  // Set recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  return transaction;
}
