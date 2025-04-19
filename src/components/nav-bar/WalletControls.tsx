'use client';

import * as React from "react";
import { WalletControlsProps } from "./types";
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState, useRef, useEffect } from 'react';
import { BalanceDisplay } from './GetBalance';

export const WalletControls: React.FC<WalletControlsProps> = ({ selectIcon }) => {
  const { connect, disconnect, connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleWalletConnect = async () => {
    try {
      if (connected) {
        setShowDropdown(!showDropdown);
      } else {
        setVisible(true);
      }
    } catch (error) {
      console.error('Failed to handle wallet action:', error);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isCopied) {
      timeoutId = setTimeout(() => setIsCopied(false), 500);
    }
    return () => clearTimeout(timeoutId);
  }, [isCopied]);

  return (
    <div className="flex flex-col self-stretch my-auto text-[0.4rem] sm:text-sm relative" ref={dropdownRef}>
      <div className="relative"> {/* Added wrapper div */}
        <button
          onClick={handleWalletConnect}
          className="flex gap-1 px-2.5 py-[0.25rem] sm:py-2 rounded-3xl cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(90deg, #065f46 0%, #10b981 100%)' }}
        >
          <img
            loading="lazy"
            src={selectIcon}
            alt=""
            className="object-contain shrink-0 aspect-[1.16] w-[7px] sm:w-[22px]"
          />
          <div className="rotate-[-0.0029032474233238784rad]">
            {connected ? `${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}` : 'Select Wallet'}
          </div>
        </button>

        {showDropdown && connected && (
          <div className="absolute right-0 mt-1 z-[9999] animate-slide-down" style={{ width: '100%' }}> {/* Changed to 100% width */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (publicKey) {
                    navigator.clipboard.writeText(publicKey.toBase58());
                    setIsCopied(true);
                  }
                }}
                className="w-full text-center px-2.5 py-[0.25rem] sm:py-2 text-[0.4rem] sm:text-sm text-white hover:bg-slate-800 transition-colors rounded-3xl bg-slate-900 shadow-xl"
              >
                {isCopied ? 'Copied!' : 'Copy Address'}
              </button>
              
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full text-center px-2.5 py-[0.25rem] sm:py-2 text-[0.4rem] sm:text-sm text-white hover:bg-slate-800 transition-colors rounded-3xl bg-slate-900 shadow-xl"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {connected && <BalanceDisplay />}
    </div>
  );
};