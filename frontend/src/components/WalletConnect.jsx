import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { authenticateWallet, clearAuth, isAuthenticated } from '../utils/auth';
import toast from 'react-hot-toast';

export default function WalletConnect({ onAuthChange }) {
  const wallet = useWallet();
  const [authenticating, setAuthenticating] = useState(false);

  const handleAuth = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey || authenticating) return;

    // Skip if already authenticated with this wallet
    const storedWallet = localStorage.getItem('bc_wallet');
    if (storedWallet === wallet.publicKey.toBase58() && isAuthenticated()) {
      onAuthChange?.({
        walletAddress: storedWallet,
        isModerator: localStorage.getItem('bc_is_mod') === 'true',
      });
      return;
    }

    setAuthenticating(true);
    try {
      const result = await authenticateWallet(wallet);
      onAuthChange?.(result);
      toast.success('Wallet connected & authenticated!');
    } catch (err) {
      console.error('Auth failed:', err);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  }, [wallet, authenticating, onAuthChange]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      handleAuth();
    }
  }, [wallet.connected, wallet.publicKey]);

  // Clear auth on disconnect
  useEffect(() => {
    if (!wallet.connected) {
      clearAuth();
      onAuthChange?.(null);
    }
  }, [wallet.connected]);

  return (
    <div className="flex items-center gap-3">
      <WalletMultiButton />
      {authenticating && (
        <span className="text-sm text-gray-400 animate-pulse">
          Signing in...
        </span>
      )}
    </div>
  );
}
