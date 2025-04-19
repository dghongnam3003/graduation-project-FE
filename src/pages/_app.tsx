/* eslint-disable react/jsx-no-undef */
// src/pages/_app.tsx
import React from 'react';
import { AppProps } from 'next/app';
// import { WalletProviderWrapper } from '../context/WalletContext';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const wallets = [new PhantomWalletAdapter()];

const App = ({ Component, pageProps }: AppProps) => {
    return (
        <ConnectionProvider endpoint="https://api.devnet.solana.com">
            <WalletProvider wallets={wallets} autoConnect>
                <Component {...pageProps} />
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;