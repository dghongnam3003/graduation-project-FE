// src/components/navigation-menu/NavigationMenu.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './NavigationMenu.module.css';
import HowItWorksModal from '../modals/HowItWorksModal';
import { FaSquareXTwitter } from "react-icons/fa6";

interface NavigationMenuProps {
    selectedTab: 'LIVE' | 'CLAIMABLE' | 'RAISING' | 'ALL';
    onTabChange: (tab: 'LIVE' | 'CLAIMABLE' | 'RAISING' | 'ALL') => void;
    liveCount: number;
    claimableCount: number;
    raisingCount: number;
    allCount: number;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
    selectedTab,
    onTabChange,
    liveCount,
    claimableCount,
    raisingCount,
    allCount,
}) => {
    const [activeLink, setActiveLink] = useState<string>('home');
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
            setActiveLink('');
        }, 300); // Duration should match the CSS animation duration
    };

    const handleHowItWorksClick = () => {
        setActiveLink('how-it-works');
        openHowItWorksModal();
    }

    const handleTelegramClick = () => {
        setActiveLink('telegram');
        window.open('https://x.com', '_blank');
        setActiveLink('');
    };

    return (
        <>
        <div className="navbar">
            <div className="navbar-start">
                <div className="dropdown">
                <div tabIndex={0} role="button" className="btn btn-ghost sm:hidden">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h8m-8 6h16" />
                    </svg>
                </div>
                <ul
                    tabIndex={0}
                    className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
                    <li>
                        <div className='relative group'>
                            <FaSquareXTwitter size={20} />
                            <Link href="/" legacyBehavior>
                                <a
                                    className={`${styles['nav-link']} text-center ${activeLink === 'telegram' ? styles['active'] : ''}`}
                                    onClick={handleTelegramClick}
                                    aria-label="Join on Telegram"
                                >
                                    VISIT OUR SOCIAL MEDIA
                                </a>
                            </Link>
                        </div>
                    </li>
                    <li>
                        <div className='relative group'>
                            <a
                                className={`${styles['nav-link']} text-center ${activeLink === 'how-it-works' ? styles['active'] : ''}`}
                                onClick={handleHowItWorksClick}
                                aria-label="How it works"
                                style={{ cursor: 'pointer' }}
                            >
                                HOW IT WORKS?
                            </a>
                            <HowItWorksModal
                                isOpen={isHowItWorksModalOpen}
                                isClosing={isHowItWorksModalClosing}
                                onClose={closeHowItWorksModal}
                            />
                        </div>
                    </li>
                    <li>
                        <Link href="/create-campaign" className="relative group">
                            <span className={`${styles['nav-link']} text-center ${activeLink === 'create-campaign' ? styles['active'] : ''}`}>CREATE NEW CAMPAIGN</span>
                            <div className="invisible group-hover:visible text-center absolute z-10 w-64 px-4 py-2 mb-2 text-sm text-white bg-gray-900 rounded-md shadow-lg -right-2 bottom-full transform -translate-x-1/2 left-1/2">
                                <div className="absolute -bottom-1 left-1/2 right-3 w-2 h-2 bg-gray-900 transform rotate-45 -translate-x-1/2" />
                                Create a Fund Raising Campaign for your Token Creation
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/my-campaigns" className="relative group">
                            <span className={`${styles['nav-link']} text-center ${activeLink === 'my-campaigns' ? styles['active'] : ''}`}>MY CAMPAIGN</span>
                            <div className="invisible group-hover:visible text-center absolute z-10 w-64 px-4 py-2 mb-2 text-sm text-white bg-gray-900 rounded-md shadow-lg -right-2 bottom-full transform -translate-x-1/2 left-1/2">
                                <div className="absolute -bottom-1 left-1/2 right-3 w-2 h-2 bg-gray-900 transform rotate-45 -translate-x-1/2" />
                                Your Created Campaigns
                            </div>
                        </Link>
                    </li>
                    <li>
                        <a>Campaign&#39;s State </a>
                        <ul className="p-2">
                            <li>
                                <a 
                                    className={`${selectedTab === 'LIVE' ? 'bg-gradient-to-r from-[#7823E7] to-[#0BA1F8] text-white' : ''}`}
                                    onClick={() => onTabChange('LIVE')}
                                >
                                    LIVE ({liveCount})
                                </a>
                            </li>
                            <li>
                                <a 
                                    className={`${selectedTab === 'CLAIMABLE' ? 'bg-gradient-to-r from-[#7823E7] to-[#0BA1F8] text-white' : ''}`}
                                    onClick={() => onTabChange('CLAIMABLE')}
                                >
                                    CLAIMABLE ({claimableCount})
                                </a>
                            </li>
                            <li>
                                <a 
                                    className={`${selectedTab === 'RAISING' ? 'bg-gradient-to-r from-[#7823E7] to-[#0BA1F8] text-white' : ''}`}
                                    onClick={() => onTabChange('RAISING')}
                                >
                                    RAISING ({raisingCount})
                                </a>
                            </li>
                            <li>
                                <a 
                                    className={`${selectedTab === 'ALL' ? 'bg-gradient-to-r from-[#7823E7] to-[#0BA1F8] text-white' : ''}`}
                                    onClick={() => onTabChange('ALL')}
                                >
                                    ALL ({allCount})
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
                </div>
            </div>
            <div className="navbar-center hidden sm:block">
                <ul className="menu menu-horizontal px-1">
                <li>
                    <div className='relative group'>
                        <FaSquareXTwitter color='white' size={20} />
                        <Link href="/" legacyBehavior>
                            <a
                                className={`${styles['nav-link']} text-center ${activeLink === 'telegram' ? styles['active'] : ''}`}
                                onClick={handleTelegramClick}
                                aria-label="Join on Telegram"
                            >
                                VISIT OUR SOCIAL MEDIA
                            </a>
                        </Link>
                    </div>
                </li>
                <li>
                    <div className='relative group'>
                        <span
                            className={`${styles['nav-link']} text-center ${activeLink === 'how-it-works' ? styles['active'] : ''}`}
                            onClick={handleHowItWorksClick}
                            aria-label="How it works"
                            style={{ cursor: 'pointer' }}
                        >
                            HOW IT WORKS?
                        </span>
                    </div>
                </li>
                <li>
                    <Link href="/create-campaign" className="relative group">
                        <span className={`${styles['nav-link']} text-center ${activeLink === 'create-campaign' ? styles['active'] : ''}`}>CREATE NEW CAMPAIGN</span>
                        <div className="invisible group-hover:visible text-center absolute z-10 w-64 px-4 py-2 mb-2 text-sm text-white bg-gray-900 rounded-md shadow-lg -right-2 bottom-full transform -translate-x-1/2 left-1/2">
                            <div className="absolute -bottom-1 left-1/2 right-3 w-2 h-2 bg-gray-900 transform rotate-45 -translate-x-1/2" />
                            Create a Fund Raising Campaign for your Token Creation
                        </div>
                    </Link>
                </li>
                <li>
                    <Link href="/my-campaigns" className="relative group">
                        <span className={`${styles['nav-link']} text-center ${activeLink === 'my-campaigns' ? styles['active'] : ''}`}>MY CAMPAIGN</span>
                        <div className="invisible group-hover:visible text-center absolute z-10 w-64 px-4 py-2 mb-2 text-sm text-white bg-gray-900 rounded-md shadow-lg -right-2 bottom-full transform -translate-x-1/2 left-1/2">
                            <div className="absolute -bottom-1 left-1/2 right-3 w-2 h-2 bg-gray-900 transform rotate-45 -translate-x-1/2" />
                            Your Created Campaigns
                        </div>
                    </Link>
                </li>
                </ul>
            </div>
            <div className="navbar-end">
            </div>
            </div>
            <HowItWorksModal
                isOpen={isHowItWorksModalOpen}
                isClosing={isHowItWorksModalClosing}
                onClose={closeHowItWorksModal}
            />
            </>
            
    )
};

export default NavigationMenu;