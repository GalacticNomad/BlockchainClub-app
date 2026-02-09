import React, { useEffect, useState } from 'react';
import { getTokenBalance } from '../utils/solana';

export default function TokenBalance({ walletAddress }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setBalance(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getTokenBalance(walletAddress).then((bal) => {
      if (!cancelled) {
        setBalance(bal);
        setLoading(false);
      }
    });

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      getTokenBalance(walletAddress).then((bal) => {
        if (!cancelled) setBalance(bal);
      });
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [walletAddress]);

  if (!walletAddress) return null;

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-solana flex items-center justify-center text-lg font-bold">
        B
      </div>
      <div>
        <p className="text-sm text-gray-400">Club Token Balance</p>
        {loading ? (
          <p className="text-xl font-bold text-white animate-pulse">Loading...</p>
        ) : (
          <p className="text-xl font-bold text-white">
            {balance !== null ? balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}{' '}
            <span className="text-sm text-brand-green font-normal">TOKENS</span>
          </p>
        )}
      </div>
    </div>
  );
}
