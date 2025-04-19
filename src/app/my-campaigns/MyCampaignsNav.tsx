// src/components/navigation-menu/NavigationMenu.tsx
import React from 'react';

interface NavigationMenuProps {
    selectedTab: 'LIVE' | 'CLAIMABLE' | 'RAISING' | 'ALL';
    onTabChange: (tab: 'LIVE' | 'CLAIMABLE' | 'RAISING' | 'ALL') => void;
    liveCount: number;
    claimableCount: number;
    raisingCount: number;
    allCount: number;
}

const MyNavigationMenu: React.FC<NavigationMenuProps> = ({
    selectedTab,
    onTabChange,
    liveCount,
    claimableCount,
    raisingCount,
    allCount,
}) => {
    return (
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
                </ul>
            </div>
            <div className="navbar-end">
            </div>
            </div>
            
    )
};

export default MyNavigationMenu;