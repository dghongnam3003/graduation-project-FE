/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/views/home/index.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { configs } from '@/env';

import DashboardStats from '../../components/status-bar/DashboardStats';
import { WelcomeSection } from '@/components/welcome-section/WelcomeSection';

import styles from './campaigns.module.css';
import { MyCampaignWelcome } from '@/components/welcome-section/MyCampaignsWelcome';

interface CampaignData {
    id: string;
    creator: string;
    campaignIndex: number;
    name: string;
    symbol: string;
    uri: string;
    totalFundRaised: number;
    donationGoal: number;
    depositDeadline: number;
    tradeDeadline: number;
    timestamp: number;
    description?: string; // Optional: Description from metadata
    image?: string;       // Optional: Image URL from metadata
    status: string;
    mint?: string;
}

const AllCampaignsPage = () => {

    const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedTab, setSelectedTab] = useState<'LIVE' | 'CLAIMABLE' | 'RAISING' | 'ALL'>('LIVE');

    const router = useRouter();
    const walletContextState = useWallet();
    const { connected, publicKey, wallet } = walletContextState;
    console.log(publicKey?.toBase58().toString());

    console.log("configs.environment.env: ",configs.environment.env);

    const fetchMyCampaigns = async () => {
        try {
            const [response, statusResponse] = await Promise.all([
                fetch(configs.api.campaign),
                fetch(configs.api.status)
            ]);
    
            if (!response.ok || !statusResponse.ok) {
                throw new Error('Failed to fetch campaigns or status');
            }
    
            const data = await response.json();
            const statusData = await statusResponse.json();

            // Find creator's campaign
            const mcampaignData = data.data.filter((camp: any) => camp.creator === publicKey?.toBase58());
            if (mcampaignData.length === 0) {
                console.log('fetch failed');
                setCampaigns([]);
                setLoading(false);
                return;
            }

            const statusMap = new Map(
                statusData.data.map((item: any) => [`${item.creator}-${item.campaignIndex}`, item.status])
            );

            // Fetch metadata for each campaign to get the image and description
            const campaignsWithMetadata: CampaignData[] = await Promise.all(
                mcampaignData.map(async (camp: CampaignData) => {
                    try {
                        const metadataResponse = await fetch(camp.uri);
                        if (!metadataResponse.ok) {
                            throw new Error(`Failed to fetch metadata for campaign ${camp.id}`);
                        }
                        const metadata = await metadataResponse.json();

                        const status = statusMap.get(`${camp.creator}-${camp.campaignIndex}`) || 'UNKNOWN';
                        return {
                            ...camp,
                            description: metadata.description,
                            image: metadata.image,
                            status: status
                        };
                    } catch (metadataError) {
                        console.error(metadataError);
                        // Fallback to a placeholder image if metadata fetch fails
                        return {
                            ...camp,
                            description: 'No description available.',
                            image: '/unknown.svg', // Replace with your placeholder image path
                            status: statusMap.get(`${camp.creator}-${camp.campaignIndex}`) || 'UNKNOWN'
                        };
                    }
                })
            );

            setCampaigns(campaignsWithMetadata)
        } catch (err) {
            console.error(err);
            setError('Failed to fetch campaigns');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCampaigns();
    }, [publicKey]);

    if (!connected) {
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white rounded-lg px-6 py-4">
          <span className="text-2xl font-semibold text-gray-800">
            Please connect your wallet to view campaigns
          </span>
        </div>
    }
    
    const handleCardClick = (campaign: any, id: string) => {
        // setSelectedCampaign(campaign);
        // setShowPopup(true);
        router.push(`/campaign-details?id=${id}`);
    }

    const filteredCampaigns = campaigns.filter((camp) => {
        switch (selectedTab) {
            case 'LIVE':
                return camp.status === 'COMPLETED';
            case 'CLAIMABLE':
                return camp.status === 'FAILED';
            case 'RAISING':
                return camp.status === 'RAISING';
            case 'ALL':
                return true;
            default:
                return false;
        }
    });

    // return (
    //     <div className={`min-h-screen min-w-full`}>
    //         <div className={`${styles['app-container']} flex flex-col items-center min-h-screen min-w-full py-8 px-16 relative z-0`}>

    //         <nav className="top-0 z-10 mb-8 w-full max-w-xl mx-auto flex items-center justify-center">
    //             <h3 className="text-2xl font-semibold text-white">Your Campaigns</h3>
    //         </nav>

    //             <nav className="top-0 z-10 mb-8 w-full max-w-2xl sm:hidden">
    //                 <MyNavigationMenu
    //                     liveCount={campaigns.filter(camp => camp.status === 'COMPLETED').length}
    //                     claimableCount={campaigns.filter(camp => camp.status === 'FAILED').length}
    //                     raisingCount={campaigns.filter(camp => camp.status === 'RAISING').length}
    //                     allCount={campaigns.length}
    //                     selectedTab={selectedTab}
    //                     onTabChange={setSelectedTab}
    //                 />
    //             </nav>

    //             <div className="flex flex-col w-full min-h-screen">
    //                 <div className="mb-8 w-full max-w-3xl mx-auto hidden sm:block">
    //                     <DashboardStats
    //                         liveCount={campaigns.filter(camp => camp.status === 'COMPLETED').length}
    //                         claimableCount={campaigns.filter(camp => camp.status === 'FAILED').length}
    //                         raisingCount={campaigns.filter(camp => camp.status === 'RAISING').length}
    //                         allCount={campaigns.length}
    //                         selectedTab={selectedTab}
    //                         onTabChange={setSelectedTab}
    //                     />
    //                 </div>

    //                 <div className="flex flex-col w-full min-h-screen">
    //                     {loading ? (
    //                         <div className="w-full flex justify-center mt-8">
    //                             <div className="flex items-center gap-3 bg-transparent rounded-lg px-6 py-4"
    //                             style={{ border: '2px solid transparent', borderImage: 'linear-gradient(to right, #7823E7, #0BA1F8) 1' }}>
    //                                 <Loader2 className="h-10 w-10 animate-spin text-white text-800" />
    //                                 <span className="text-2xl font-semibold text-white text-800">
    //                                     Loading campaigns...
    //                                 </span>
    //                             </div>
    //                         </div>
    //                     ) : (
    //                         <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 bg-slate-800 gap-4 py-8 w-full max-w-full px-4 rounded">
    //                             {filteredCampaigns.map((camp) => (
    //                                 <div key={camp.id} 
    //                                     className={styles['card']} 
    //                                     onClick={() => handleCardClick(camp, camp.id)} 
    //                                     style={{ cursor: 'pointer' }}>
    //                                     <div className="flex flex-col sm:flex-row items-start overflow-hidden">
    //                                         {camp.status === 'COMPLETED' ? (
    //                                             <>
    //                                                 {camp.image && (
    //                                                     <img
    //                                                         src={camp.image || '/unknown.svg'}
    //                                                         alt={`${camp.name} Token`}
    //                                                         className="w-32 h-32 sm:w-24 sm:h-24 mr-0 sm:mr-4 mb-4 sm:mb-0 object-cover rounded"
    //                                                     />
    //                                                 )}
                                        
    //                                                 {/* Campaign Information */}
    //                                                 <div className="flex-1 min-w-0 mt-4 sm:mt-0 sm:ml-4">
    //                                                     <p className="text-lg font-bold truncate">
    //                                                         {camp.name} ({camp.symbol})
    //                                                     </p>
    //                                                     <p className="text-sm mt-1 text-white text-600 overflow-hidden text-ellipsis">
    //                                                         {camp.description}
    //                                                     </p>
    //                                                     <p className="text-sm mt-2">
    //                                                     <strong>Trade Deadline:</strong> {new Date(camp.tradeDeadline * 1000).toLocaleDateString()}
    //                                                     </p>
    //                                                     <div className="text-sm mt-1 flex items-center truncate overflow-hidden overflow-ellipsis">
    //                                                         <strong className="flex-shrink-0 whitespace-nowrap">Mint Address:&nbsp;</strong>
    //                                                         <span className="truncate">
    //                                                             {camp.mint?.slice(0, 12)}...
    //                                                         </span>
    //                                                     </div>
    //                                                 </div>
    //                                             </>
    //                                         ) : (
    //                                             <>
    //                                                 {camp.image && (
    //                                                 <img
    //                                                     src={camp.image || '/unknown.svg'}
    //                                                     alt={`${camp.name} Token`}
    //                                                     className="w-32 h-32 sm:w-24 sm:h-24 mr-0 sm:mr-4 mb-4 sm:mb-0 object-cover rounded"
    //                                                 />
    //                                                 )}

    //                                                 {/* Campaign Information */}
    //                                                 <div className="text-center sm:text-left">
    //                                                     <p className="text-sm">
    //                                                         <strong>Fund Raised:</strong> {(camp.totalFundRaised / 1e9).toFixed(2)} SOL
    //                                                     </p>
    //                                                     <p className="text-sm">
    //                                                         <strong>Donation Goal:</strong> {camp.donationGoal} SOL
    //                                                     </p>
    //                                                     <p className="text-sm">
    //                                                         <strong>Deposit Deadline:</strong> {new Date(camp.depositDeadline * 1000).toLocaleDateString()}
    //                                                     </p>
    //                                                     <p className="text-lg font-bold">
    //                                                         {camp.name} ({camp.symbol}): <span className='font-normal text-sm'>{camp.description}</span>
    //                                                     </p>
    //                                                 </div>
    //                                             </>
    //                                         )}
    //                                     </div>
    //                                 </div>
    //                             ))}
    //                         </div>
    //                     )}
    //                 </div>
    //             </div>
    //         </div>
    //     </div>
    // );

    return (
        <div className="flex flex-col w-full">
            {/* Welcome Section */}
            <div className="w-full">
                <MyCampaignWelcome />
            </div>

            {/* Dashboard Stats - Static position */}
            <div className="w-full">
                <DashboardStats
                    liveCount={campaigns.filter(camp => camp.status === 'COMPLETED').length}
                    claimableCount={campaigns.filter(camp => camp.status === 'FAILED').length}
                    raisingCount={campaigns.filter(camp => camp.status === 'RAISING').length}
                    allCount={campaigns.length}
                    selectedTab={selectedTab}
                    onTabChange={(tab: string) => {
                        if (tab === 'LIVE' || tab === 'CLAIMABLE' || tab === 'RAISING' || tab === 'ALL') {
                            setSelectedTab(tab);
                        }
                    }}
                />
            </div>

            {/* Campaign Cards Section */}
            <div className="w-full mx-auto mt-2 px-4 ">
                {loading ? (
                    <div className="relative w-full flex justify-center">
                        <div className="flex items-center gap-3 bg-transparent rounded-lg px-6 py-4 border-2 border-[#AE94F3]">
                            <Loader2 className="h-6 w-6 sm:h-10 sm:w-10 animate-spin text-white text-400 sm:text-800" />
                            <span className="text-xl sm:text-2xl font-semibold text-white text-400 sm:text-800">
                                Loading campaigns...
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="relative grid grid-cols-2 lg:grid-cols-3 sm:grid-cols-2 gap-1 sm:gap-4 py-4 sm:py-8 w-full rounded"
                    style={{ background: 'linear-gradient(180deg, #090C2F 0%, rgba(19, 22, 52, 0) 100%)' }}>
                        {filteredCampaigns.map((camp) => (
                            <div key={camp.id} 
                                className={styles['card']} 
                                onClick={() => handleCardClick(camp, camp.id)}
                                style={{ cursor: 'pointer' }}>
                                <div className="flex flex-row sm:flex-row flex-wrap items-start overflow-hidden">
                                    {camp.status === 'COMPLETED' ? (
                                        <>
                                            <div className="mr-1 sm:mr-4 mb-0">
                                                {camp.image && (
                                                    <img
                                                        src={camp.image || '/unknown.svg'}
                                                        alt={`${camp.name} Token`}
                                                        width={48}
                                                        height={48}
                                                        className="w-12 h-12 sm:w-24 sm:h-24 object-cover rounded"
                                                    />
                                                )}
                                            </div>                                       
                                    
                                            {/* Campaign Information */}
                                            <div className="flex-1 min-w-0 mt-0 sm:mt-0 ml-2 sm:ml-4">
                                                <p className="text-xs sm:text-lg font-bold truncate">
                                                    {camp.name}
                                                </p>
                                                <p className="text-xs sm:text-lg font-bold truncate">
                                                    {camp.symbol}
                                                </p>
                                                <p className="text-[0.5rem] sm:text-sm text-[#AE94F3] mt-2">
                                                <span className='text-white'>Trade Deadline:</span> {new Date(camp.tradeDeadline * 1000).toLocaleDateString()}
                                                </p>
                                                <div className="text-[0.5rem] sm:text-sm mt-1 flex items-center truncate overflow-hidden overflow-ellipsis">
                                                    <span className="flex-shrink-0 whitespace-nowrap">Mint Address:&nbsp;</span>
                                                    <span className="truncate text-[#AE94F3]">
                                                        {camp.mint?.slice(0, 12)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mr-1 sm:mr-4 mb-0">
                                                {camp.image && (
                                                    <img
                                                        src={camp.image || '/unknown.svg'}
                                                        alt={`${camp.name} Token`}
                                                        width={48}
                                                        height={48}
                                                        className="w-12 h-12 sm:w-24 sm:h-24 object-cover rounded"
                                                    />
                                                )}
                                            </div>

                                            {/* Campaign Information */}
                                            <div className="flex-1 min-w-0 mt-0 sm:mt-0 ml-2 sm:ml-4">
                                                <p className="text-xs sm:text-lg font-bold truncate">
                                                    {camp.name}
                                                </p>
                                                <p className="text-xs sm:text-lg font-bold truncate">
                                                    {camp.symbol}
                                                </p>
                                                <p className="text-[0.5rem] sm:text-sm text-[#AE94F3]">
                                                    <span className='text-white'>Fund Raised:</span> {(camp.totalFundRaised / 1e9).toFixed(2)} SOL
                                                </p>
                                                <p className="text-[0.5rem] sm:text-sm text-[#AE94F3]">
                                                    <span className='text-white'>Donation Goal:</span> {camp.donationGoal} SOL
                                                </p>
                                                <p className="text-[0.5rem] sm:text-sm text-[#AE94F3]">
                                                    <span className='text-white'>Deposit Deadline:</span> {new Date(camp.depositDeadline * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {/* Description - Full Width Below */}
                                <div className="w-full mt-1 sm:mt-4 border-t border-[#AE94F3]/20 pt-3">
                                    <p className="text-[0.5rem] sm:text-sm text-white line-clamp-2">
                                        {camp.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllCampaignsPage;