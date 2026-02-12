import React, { useMemo, useState, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Toaster } from 'react-hot-toast';

import WalletConnect from './components/WalletConnect';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ModDashboard from './pages/ModDashboard';

const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export default function App() {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  const [auth, setAuth] = useState(() => {
    const wallet = localStorage.getItem('bc_wallet');
    const token = localStorage.getItem('bc_token');
    const isMod = localStorage.getItem('bc_is_mod') === 'true';
    if (wallet && token) return { walletAddress: wallet, isModerator: isMod };
    return null;
  });

  const handleAuthChange = useCallback((authData) => {
    setAuth(authData);
  }, []);

  const location = useLocation();

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-brand-dark">
            {/* Navigation Bar */}
            <nav className="border-b border-brand-border bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  {/* Logo */}
                  <Link to="/" className="flex items-center gap-2">
                    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Blockchain Club" className="w-8 h-8 rounded-lg" />
                    <span className="font-bold text-lg text-white hidden sm:block">
                      Blockchain Club
                    </span>
                  </Link>

                  {/* Nav Links */}
                  <div className="flex items-center gap-4">
                    {auth && (
                      <>
                        <Link
                          to="/dashboard"
                          className={`text-sm font-medium transition-colors ${
                            location.pathname === '/dashboard'
                              ? 'text-brand-green'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Dashboard
                        </Link>
                        {auth.isModerator && (
                          <Link
                            to="/mod"
                            className={`text-sm font-medium transition-colors ${
                              location.pathname === '/mod'
                                ? 'text-brand-green'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            Mod Panel
                          </Link>
                        )}
                      </>
                    )}
                    <WalletConnect onAuthChange={handleAuthChange} />
                  </div>
                </div>
              </div>
            </nav>

            {/* Page Content */}
            <main>
              <Routes>
                <Route path="/" element={<Home auth={auth} />} />
                <Route path="/dashboard" element={<Dashboard auth={auth} />} />
                <Route path="/mod" element={<ModDashboard auth={auth} />} />
              </Routes>
            </main>

            {/* Toast Notifications */}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1a1a2e',
                  color: '#fff',
                  border: '1px solid #2a2a4a',
                },
              }}
            />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
