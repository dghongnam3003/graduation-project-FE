'use client';

import React, { useEffect, useState } from 'react';
import { BiSolidToTop } from "react-icons/bi";

const BackToTop: React.FC = () => {
  const [backToTopVisible, setBackToTopVisible] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        setBackToTopVisible(true);
      } else {
        setBackToTopVisible(false);
      }
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className='App'>
      {backToTopVisible && (
        <button
          className="fixed bottom-[30px] right-[10px] h-[50px] w-[50px] 
                     rounded-3xl text-[40px] text-white border-none
                     cursor-pointer flex items-center justify-center
                     hover:opacity-90 transition-opacity z-[100]"
          style={{ background: 'linear-gradient(90deg, #065f46 0%, #10b981 100%)' }}
          onClick={scrollToTop}
        >
          <BiSolidToTop />
        </button>
      )}
    </div>
  );
};

export default BackToTop;