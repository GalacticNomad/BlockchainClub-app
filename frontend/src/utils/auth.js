import { login } from './api';
import bs58 from 'bs58';

/**
 * Authenticate with the backend using the connected Solana wallet.
 * 1. Generate a sign-in message
 * 2. Ask the wallet to sign it
 * 3. Send signature to backend, receive JWT
 */
export async function authenticateWallet(wallet) {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected or does not support message signing');
  }

  const walletAddress = wallet.publicKey.toBase58();
  const timestamp = Date.now();
  const message = `Sign in to Blockchain Club\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;

  // Ask the wallet to sign the message
  const encodedMessage = new TextEncoder().encode(message);
  const signatureBytes = await wallet.signMessage(encodedMessage);
  const signature = bs58.encode(signatureBytes);

  // Send to backend
  const response = await login(walletAddress, signature, message);
  const { token, is_moderator } = response.data;

  // Store in localStorage
  localStorage.setItem('bc_token', token);
  localStorage.setItem('bc_wallet', walletAddress);
  localStorage.setItem('bc_is_mod', is_moderator ? 'true' : 'false');

  return { token, walletAddress, isModerator: is_moderator };
}

/**
 * Clear stored auth data on disconnect.
 */
export function clearAuth() {
  localStorage.removeItem('bc_token');
  localStorage.removeItem('bc_wallet');
  localStorage.removeItem('bc_is_mod');
}

/**
 * Check if user is currently authenticated.
 */
export function isAuthenticated() {
  return !!localStorage.getItem('bc_token');
}

/**
 * Check if current user is a moderator.
 */
export function isModerator() {
  return localStorage.getItem('bc_is_mod') === 'true';
}

/**
 * Get stored wallet address.
 */
export function getStoredWallet() {
  return localStorage.getItem('bc_wallet');
}
