'use client';

// src/components/DashboardStats.tsx
import React from 'react';
import styles from './DashboardStats.module.css';

interface DashboardStatsProps {
    liveCount: number;
    claimableCount: number;
    raisingCount: number;
    allCount: number;
    selectedTab: string;
    onTabChange: (tab: string) => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
    liveCount,
    claimableCount,
    raisingCount,
    allCount,
    selectedTab,
    onTabChange,
 }) => {
    return (
        <div
            className="w-full h-[35px] sm:h-[72px] flex items-center justify-center left-0"
            style={{
                background: 'linear-gradient(180deg, #090C2F 0%, rgba(19, 22, 52, 0) 100%)'
            }}
            >
            <div className="flex w-full max-w-[1126px] items-center gap-2 sm:gap-4 px-1 sm:px-4">
                <div className={`${styles['option-container']} ${selectedTab === 'LIVE' ? styles['active'] : ''} cursor-pointer`}
                    onClick={() => onTabChange('LIVE')}>
                    <div className={`${styles['text-gray-400']} text-[0.5rem] sm:text-lg font-inria`}>
                        <span>LIVE - {liveCount}</span>
                    </div>
                    {liveCount > 0 && <div className={styles['indicator']}></div>}
                </div>

                <div className={`${styles['option-container']} ${selectedTab === 'CLAIMABLE' ? styles['active'] : ''} cursor-pointer`}
                    onClick={() => onTabChange('CLAIMABLE')}>
                    <div className={`${styles['text-gray-400']} text-[0.5rem] sm:text-lg font-inria`}>
                        <span>CLAIMABLE - {claimableCount}</span>
                    </div>
                    {/* {upcomingCount > 0 && <div className={styles['indicator']}></div>} */}
                </div>

                <div className={`${styles['option-container']} ${selectedTab === 'RAISING' ? styles['active'] : ''} cursor-pointer`}
                    onClick={() => onTabChange('RAISING')}>
                    <div className={`${styles['text-gray-400']} text-[0.5rem] sm:text-lg font-inria`}>
                        <span>RAISING - {raisingCount}</span>
                    </div>
                    {/* {upcomingCount > 0 && <div className={styles['indicator']}></div>} */}
                </div>

                <div className={`${styles['option-container']} ${selectedTab === 'ALL' ? styles['active'] : ''} cursor-pointer`}
                    onClick={() => onTabChange('ALL')}>
                    <div className={`${styles['text-gray-400']} text-[0.5rem] sm:text-lg font-inria`}>
                        <span>ALL - {allCount}</span>
                    </div>
                    {/* {allCount > 0 && <div className={styles['indicator']}></div>} */}
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;