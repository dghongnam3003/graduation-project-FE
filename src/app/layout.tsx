/* eslint-disable @typescript-eslint/no-require-imports */
'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  TrustWalletAdapter,
 } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { NavigationBar } from '@/components/nav-bar/NavigationBar';
import BackToTop from '@/components/back-to-top/BackToTop';
import "./globals.css";

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new TrustWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <html lang="en">
      <body className="min-h-screen">
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <div className="relative min-h-screen">
                <div className="gradient-bg">
                  <div className="gradient-circle-1" />
                  <div className="gradient-circle-2" />
                </div>
                <div className="relative z-[100]">
                  <NavigationBar />
                </div>
                {children}
                <BackToTop />
              </div>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}