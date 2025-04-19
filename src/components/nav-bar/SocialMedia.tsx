import * as React from "react";
import { SocialMediaProps } from "./types";
import { KoHo } from 'next/font/google';

const koho = KoHo({
  subsets: ['latin'],
  weight: "200"
});

export const SocialMedia: React.FC<SocialMediaProps> = ({ icon, text, onClick }) => {
  return (
    <div className={`flex gap-1 sm:gap-4 self-stretch my-auto max-auto max-w-[18%] hover:text-emerald-500 active:text-emerald-500 rounded-lg hover:bg-slate-900 active:bg-slate-800 cursor-pointer ${koho.className} text-[0.5rem] sm:text-xl`}
    onClick={onClick}>
      <img
        loading="lazy"
        src={icon}
        alt=""
        className="object-contain shrink-0 w-4 sm:w-7 rounded-lg aspect-[0.97]"
      />
      <div className="self-start bg-blend-normal basis-auto">
        {text}
      </div>
    </div>
  );
};