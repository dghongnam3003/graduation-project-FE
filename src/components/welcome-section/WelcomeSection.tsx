import React from 'react';
import { Konkhmer_Sleokchher } from 'next/font/google';
import { Khmer } from 'next/font/google';


const konkhmer = Konkhmer_Sleokchher({
  subsets: ['latin'],
  weight: "400"
});

const khmer = Khmer({
  subsets: ['khmer'],
  weight: "400"
});

export const WelcomeSection: React.FC = () => {
  return (
    <div 
      className="relative w-[87.5%] h-[59%] mx-auto pt-5 sm:pt-15 flex justify-between items-center"
    >
      <div className=" relative w-[53%] h-full flex flex-col justify-center gap-1 sm:gap-4">
        <h1 className={`text-3xl md:text-8xl text-white ${konkhmer.className} p-1 sm:p-8`}>
          Welcome to <br />
          <span className={`inline-block text-transparent bg-clip-text ${konkhmer.className}`}
          style={{backgroundImage: 'linear-gradient(to right, #065f46, #10b981 58%)'}}>
            Pump-Fund!
          </span>
        </h1>
        <p className={`text-[0.3rem] sm:text-xs text-white p-1 sm:p-8 leading-[2.5] sm:leading-[2.5] ${khmer.className}`}>
          Pump-Fund is a decentralized crowdfunding platform that allows you to create and fund campaigns with ease.
        </p>
      </div>
      <img
        src="/welcome.png"
        alt=""
        className="w-[37%] h-full p-1 sm:p-8"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
};