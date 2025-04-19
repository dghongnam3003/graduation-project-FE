/* eslint-disable @next/next/no-img-element */
'use client';

import * as React from "react";
import { NavItem } from "./NavItem";
import { SocialMedia } from "./SocialMedia";
import { WalletControls } from "./WalletControls";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import HowItWorksModal from '../modals/HowItWorksModal';

export const NavigationBar: React.FC = () => {
  const router = useRouter();

  const [isHowItWorksModalOpen, setIsHowItWorksModalOpen] = useState<boolean>(false);
  const [isHowItWorksModalClosing, setIsHowItWorksModalClosing] = useState<boolean>(false);

  const openHowItWorksModal = () => {
    setIsHowItWorksModalOpen(true);
  };

  const closeHowItWorksModal = () => {
    setIsHowItWorksModalClosing(true);
    setTimeout(() => {
      setIsHowItWorksModalClosing(false);
      setIsHowItWorksModalOpen(false);
    }, 300);
  };

  const handleHowItWorksClick = () => {
    openHowItWorksModal();
  }

  const navItems = [
    { text: "HOW IT WORKS?", onClick: () => handleHowItWorksClick() },
    { text: "CREATE NEW CAMPAIGN", onClick: () => router.push('/create-campaign') },
    { text: "MY CAMPAIGN", onClick: () => router.push('/my-campaigns') },
  ];

  return (
    <div className="relative" style={{ left: '0px', top: '0px' }}>
      <div className=" bg-[#070A29]">
        <div className="flex flex-wrap gap-1 sm:gap-5 items-center px-3 md:px-6 py-1.5 md:py-3 mx-auto max-w-full">
        <img
          loading="lazy"
          src="./logo2.png"
          alt=""
          className="object-contain shrink-0 self-stretch aspect-[0.91] w-[35px] md:w-[73px] cursor-pointer transform scale-75 md:scale-100"
          onClick={() => router.push('/')}
        />
        <SocialMedia
          icon="https://cdn.builder.io/api/v1/image/assets/eab818b3eb2a4948adf5e95f36413932/e6bf13492b864d90407dd855441c34a31b919b2db3c8a2949733b7f4aece1455?apiKey=eab818b3eb2a4948adf5e95f36413932&"
          text="VISIT OUR SOCIAL MEDIA"
          onClick={() => window.open('https://x.com', '_blank')}
        />
        {navItems.map((item, index) => (
          <NavItem key={index} {...item} />
        ))}
        <WalletControls selectIcon="https://cdn.builder.io/api/v1/image/assets/eab818b3eb2a4948adf5e95f36413932/c81b2745e0761b66d7a6806aa570ccdb6b50ef99ec45cd2f1171ba28c0fc8358?apiKey=eab818b3eb2a4948adf5e95f36413932&" />
        </div>
      </div>
      <HowItWorksModal
        isOpen={isHowItWorksModalOpen}
        isClosing={isHowItWorksModalClosing}
        onClose={closeHowItWorksModal}
      />
    </div>
  );
};