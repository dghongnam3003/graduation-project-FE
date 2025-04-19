import * as React from "react";
import { NavItemProps } from "./types";
import { KoHo } from 'next/font/google';

const koho = KoHo({
  subsets: ['latin'],
  weight: "200"
});

export const NavItem: React.FC<NavItemProps> = ({ text, onClick }) => {
  return (
    <div 
    className={`
      flex justify-center items-center mx-auto max-w-[18%] my-auto self-stretch
      hover:bg-slate-900 active:bg-slate-800
      active:text-emerald-500 hover:text-emerald-500
      transition-colors duration-200 ease-in-out
      rounded-lg ${koho.className} cursor-pointer text-[0.5rem] sm:text-xl text-center
    `}
    onClick={onClick}
    >
      {text}
    </div>
  );
};