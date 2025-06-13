/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';
import { Loader2 } from 'lucide-react';
import {useRouter} from "next/navigation";
import donateFund from '@/scripts/donate';
import Image from 'next/image';
import claimFundRaised from '@/scripts/claim-fund-raised';
import claimCampaignToken from '@/scripts/claim-campaign-token';
import { set } from '@metaplex-foundation/umi/serializers';
import { configs } from '@/env';
require('dotenv').config();
import { Konkhmer_Sleokchher } from 'next/font/google';
// import { set } from '@metaplex-foundation/umi/serializers';
// import type { CampaignData } from '@/types';

const konkhmer = Konkhmer_Sleokchher({
    subsets: ['latin'],
    weight: "400"
  });

interface CampaignData {
    id: string;
    creator: string;
    name: string;
    symbol: string;
    depositDeadline: number;
    tradeDeadline: number;
    totalFundRaised: number;
    donationGoal: number;
    uri: string;
    description?: string;
    image?: string;
    campaignIndex: number;
    bnIndex: BN;
    mint?: string;
    status: string;
    claimableAmount?: number;
    marketCap?: number;
}

interface APIResponse {
    data: CampaignData;
    message: string;
}

// Create a separate component for the campaign content
const CampaignContent = () => {
    const searchParams = useSearchParams();
    const campaignId = searchParams?.get('id');
    const walletContextState = useWallet();
    const { publicKey } = walletContextState;

    const [campaign, setCampaign] = useState<CampaignData | null>(null);
    const [loading, setLoading] = useState(true);

    const [claiming, setClaiming] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
    const [canClaim, setCanClaim] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [isCreator, setIsCreator] = useState(false);

    const [claimingToken, setClaimingToken] = useState(false);
    const [claimTokenError, setClaimTokenError] = useState<string | null>(null);
    const [claimTokenSuccess, setClaimTokenSuccess] = useState<string | null>(null);
    const [canClaimToken, setCanClaimToken] = useState(false);
    const [showClaimPopup, setShowClaimPopup] = useState(false);

    const [donating, setDonating] = useState(false);
    const [donateError, setDonateError] = useState<string | null>(null);
    const [donateSuccess, setDonateSuccess] = useState<string | null>(null);
    const [canDonate, setCanDonate] = useState(false);
    const [showDonatePopup, setShowDonatePopup] = useState(false);
    const [donationAmount, setDonationAmount] = useState<number>(0.1);
    const [showDonateAmountPopup, setShowDonateAmountPopup] = useState(false);

    const [isClosing, setIsClosing] = useState(false);
    const [donatePopupError, setDonatePopupError] = useState<string | null>(null);

    const [copied, setCopied] = useState(false);

    const router = useRouter();

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    }

    const handleDonateFundClick = () => {
        setShowDonateAmountPopup(true);
    };

    const handleConfirmDonate = async () => {
        if (!campaign) return;

        if (donationAmount < 0.1) {
            setDonatePopupError("Donation amount must be at least 0.1 SOL");
            return;
        }

        if (donationAmount <= 0) {
            setDonatePopupError("Please enter a valid amount.");
            return;
        }
    
        setShowDonateAmountPopup(false);
        setDonating(true);
        setDonateError(null);
        setDonateSuccess(null);
    
        try {
            const txSignature = await donateFund(walletContextState, campaign.campaignIndex, donationAmount, campaign.creator);
            setDonateSuccess(`Transaction successful: ${txSignature}`);
            setShowDonatePopup(true);
        } catch (err: any) {
            console.error(err);
            if (err.message.includes("CampaignDepositDeadlineNotPassed")) {
                setDonateError("Cannot donate funds yet - deposit deadline has not passed");
            } else if (err.message.includes("CampaignTradeDeadlinePassed")) {
                setDonateError("Cannot donate funds anymore - trade deadline has passed");
            } else {
                setDonateError(`Failed to donate funds: ${err.message}`);
            }
        } finally {
            setDonating(false);
        }
    };

    const handleClaimFund = async () => {
        if (!campaign) return;
        console.log(campaign.campaignIndex)
        if (campaign.campaignIndex === undefined) {
            setClaimError("Campaign index is not defined");
            return;
        }

        setClaiming(true);
        setClaimError(null);
        setClaimSuccess(null);
     
        try {
            if (!canClaim) {
                throw new Error("Campaign deposit deadline has not passed yet");
            }
            
            const txSignature = await claimFundRaised(walletContextState, new BN(campaign.campaignIndex));
            setClaimSuccess(`Transaction successful`);
            setShowPopup(true);
        } catch (err: any) {
            console.error(err);
            // Handle specific error codes
            if (err.message.includes("CampaignDepositDeadlineNotPassed")) {
                setClaimError("Cannot claim funds yet - deposit deadline has not passed");
            } else if (err.message.includes("CampaignAlreadyClaimed")) {
                setClaimError("Funds have already been claimed for this campaign");
            } else {
                setClaimError(`Failed to claim funds: ${err.message}`);
            }
        } finally {
            setClaiming(false);
        }
    };

    const handleClaimToken = async () => {
        if (!campaign) return;
        if (campaign.campaignIndex === undefined) {
            setClaimTokenError("Campaign index is not defined");
            return;
        }

        setClaimingToken(true);
        setClaimTokenError(null);
        setClaimTokenSuccess(null);
    
        try {
            if (!canClaimToken) {
                throw new Error("Campaign deposit deadline has not passed yet");
            }
            
            const txSignature = await claimCampaignToken(walletContextState, new BN(campaign.campaignIndex));
            setClaimTokenSuccess(`Transaction successful`);
            setShowClaimPopup(true);
        } catch (err: any) {
            console.error(err);
            // Handle specific error codes
            if (err.message.includes("CampaignDepositDeadlineNotPassed")) {
                setClaimTokenError("Cannot claim funds yet - deposit deadline has not passed");
            } else if (err.message.includes("CampaignAlreadyClaimed")) {
                setClaimTokenError("Funds have already been claimed for this campaign");
            } else {
                setClaimTokenError(`Failed to claim funds: ${err.message}`);
            }
        } finally {
            setClaimingToken(false);
        }
    }

    const handleClosePopup = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowDonatePopup(false);
            router.back();
        }, 15000);
    }

    const handleCloseDonatePopup = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowDonatePopup(false);
            router.back();
        }, 15000);
    }

    const handleCloseClaimPopup = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowClaimPopup(false);
        }, 15000);
    }

    useEffect(() => {
        if (campaign && publicKey) {
            setIsCreator(campaign.creator === publicKey.toString());
        }
    }, [campaign, publicKey]);

    useEffect(() => {
        const fetchCampaignDetails = async () => {
            if (!campaignId) return;
            
            setLoading(true);
            try {
                const response = await fetch(`${configs.api.campaign}/details/${campaignId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch campaign details');
                }

                const result: APIResponse = await response.json();

                const metadataResponse = await fetch(result.data.uri);
                if (metadataResponse.ok) {
                    const metadata = await metadataResponse.json();
                    // Set campaign with metadata
                    setCampaign({
                        ...result.data,
                        description: metadata.description,
                        image: metadata.image
                    });
                } else {
                    // Fallback if metadata fetch fails
                    setCampaign({
                        ...result.data,
                        description: 'No description available.',
                        image: '/unknown.svg'
                    });
                }

            } catch (error) {
                console.error('Error fetching campaign details:', error);
                // setError(error instanceof Error ? error.message : 'Failed to fetch campaign details');
            } finally {
                setLoading(false);
            }
        };

        fetchCampaignDetails();
    }, [campaignId]);

    useEffect(() => {
        if (campaign) {
            const validClaimTokenAmount = Boolean(campaign.claimableAmount && campaign.claimableAmount > 0);
            setCanClaimToken(validClaimTokenAmount);
        }
    }, [campaign])

    useEffect(() => {
        if (campaign) {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const hasDepositPassed = campaign.depositDeadline < currentTimestamp;
            const donationReached = Number((campaign.totalFundRaised / 1e9).toFixed(2)) >= campaign.donationGoal;
            setCanClaim(hasDepositPassed && !donationReached);
            setCanDonate(!hasDepositPassed);
        }
    }, [campaign]);

      if (loading) {
        return (
          <div className="border-2 border-[#10b981] absolute left-1/2 top-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-transparent rounded-lg px-6 py-4">
            <Loader2 className="h-6 w-6 sm:h-10 sm:w-10 animate-spin text-white text-800" />
            <span className="text-xl sm:text-2xl font-semibold text-white text-800">
              Loading campaigns...
            </span>
          </div>
        );
      }
    if (!campaign) {
      return (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white rounded-lg px-6 py-4">
          <span className="text-2xl font-semibold text-gray-800">
            Cannot find Campaign
          </span>
        </div>
      )
    };


    return (
      <div className="flex justify-center items-start min-h-screen pt-4 sm:pt-10 pb-8 px-2 sm:px-4">
        <div className="w-full max-w-full sm:max-w-[95%] mx-auto">
            <div className="rounded-2xl p-2 sm:p-6 mx-2 sm:mx-4 overflow-hidden">
                <div 
                    className="bg-transparent rounded-xl shadow-lg p-2 sm:p-6" 
                >
                    <h1 className="text-2xl sm:text-3xl md:text-6xl font-bold text-center mb-4 sm:mb-8 text-white text-800">
                    <span className={`inline-block text-transparent bg-clip-text ${konkhmer.className}`}
                    style={{backgroundImage: 'linear-gradient(to right, #065f46, #10b981 29%)'}}>
                        Campaign Details
                    </span>
                    </h1>
        
                    <div className="grid gap-6">
                        {/* Basic Information */}
                        <div className="border-b-2 border-[#10b981] pb-6">
                            <h2 className="text-xl sm:text-3xl text-[#10b981] font-semibold mb-4 text-700">
                                {campaign.name}
                            </h2>
                            <strong className="text-sm sm:text-lg mb-2">
                                <span className="font-medium text-white text-600">Token Symbol: </span>
                                <span className=" text-white text-800">{campaign.symbol}</span>
                            </strong>
                        </div>
        
                        {/* Funding Information - Hidden for COMPLETED campaigns */}
                        {campaign.status !== 'COMPLETED' && (
                            <div className="border-b-2 border-[#10b981] pb-6">
                                <h3 className="text-xl sm:text-3xl text-[#10b981] font-semibold mb-4 text-700">Funding Status</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div 
                                        className="border-[3px] border-[#065f46] p-4 rounded-xl overflow-hidden w-full" 
                                    >
                                        <p className="text-sm sm:text-xl text-white text-600">Total Fund Raised</p>
                                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                                            {(campaign.totalFundRaised / 1e9).toFixed(2)} SOL
                                        </p>
                                    </div>
                                    <div 
                                        className="border-[3px] border-[#065f46] p-4 rounded-xl overflow-hidden w-full" 
                                    >                                    
                                        <p className="text-sm sm:text-xl text-white text-600">Donation Goal</p>
                                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                                            {campaign.donationGoal.toFixed(2)} SOL
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
        
                        {/* Deadlines */}
                        <div className="border-b-2 border-[#10b981] pb-6">
                            <h3 className="text-xl sm:text-3xl text-[#10b981] font-semibold mb-4 text-700">Important Dates</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div 
                                    className="border-[3px] border-[#065f46] p-4 rounded-xl overflow-hidden w-full"
                                >                                    
                                    <p className="text-sm sm:text-xl text-white text-600">Deposit Deadline</p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">
                                        {new Date(campaign.depositDeadline * 1000).toLocaleDateString()}
                                    </p>
                                </div>
                                <div 
                                    className="border-[3px] border-[#065f46] p-4 rounded-xl overflow-hidden w-full" 
                                >                                    
                                    <p className="text-sm sm:text-xl text-white text-600">Trade Deadline</p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">
                                        {new Date(campaign.tradeDeadline * 1000).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Token Creation Information */}
                        {campaign.mint && (
                            <div className="border-b-2 border-[#10b981] pb-6">
                                <h3 className="text-xl sm:text-3xl text-[#10b981] font-semibold mb-4 text-700">Mint Address</h3>
                                <div className='relative'>
                                    <p className="text-white text-800 whitespace-pre-wrap break-all cursor-pointer hover:opacity-80" onClick={() => campaign.mint && copyToClipboard(campaign.mint)}>{campaign.mint}</p>
                                    {copied && (
                                        <span className="absolute left-0 -bottom-6 text-white text-sm text-400 transition-opacity duration-200">
                                            Copied!
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
        
                        {/* Additional Information */}
                        {campaign.description && (
                            <div className="border-b-2 border-[#10b981] pb-6">
                                <h3 className="text-xl sm:text-3xl text-[#10b981] font-semibold mb-4 text-700">Description</h3>
                                <p className="text-white text-800 whitespace-pre-wrap text-sm sm:text-lg">{campaign.description}</p>
                            </div>
                        )}
        
                        {/* Token Image */}
                        {campaign.image && (
                            <div className="mt-6">
                                <h3 className="text-xl sm:text-3xl text-[#10b981] font-semibold mb-4 text-700">Token Image</h3>
                                <div className="w-48 h-48 rounded-lg overflow-hidden">
                                    <Image
                                        src={campaign.image}
                                        alt="Token"
                                        width={192} // 48 * 4 for better quality
                                        height={192}
                                        className="w-full h-full object-cover"
                                        unoptimized={campaign.image.startsWith('https://gateway.pinata.cloud')} // Skip optimization for IPFS images
                                        onError={(e) => {
                                            e.currentTarget.src = '/unknown.svg';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Market Cap Number */}
                        <div className='relative inline-block group'>
                            {campaign.status === 'COMPLETED' && (
                                <div className="border-b-2 border-[#10b981] pb-6">
                                    <h3 className="text-xl sm:text-3xl text-[#10b981] font-semibold mb-4 text-700">Market Cap</h3>
                                    <div className='relative'>
                                        <p className="text-white text-800 whitespace-pre-wrap break-all">
                                            {campaign.marketCap || 0}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Claimable Token Amount */}
                        <div className="relative inline-block group">
                            {isCreator && campaign.status === 'COMPLETED' && (
                                <div className="pb-6">
                                    <h3 className="text-xl sm:text-3xl text-[#10b981] font-semibold mb-4 text-700">Claimable Token Amount</h3>
                                    <div className='relative'>
                                        <p className="text-white text-800 whitespace-pre-wrap break-all">
                                            {campaign.claimableAmount || 0}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {isCreator && campaign.status === 'COMPLETED' && (
                                <div className="flex justify-center items-center w-full">
                                <div className="relative inline-block group">
                                    <button
                                        onClick={handleClaimToken}
                                        disabled={claimingToken || !canClaimToken}
                                        className={`font-bold py-2 px-4 rounded-lg w-full sm:w-[70vh] ${
                                            canClaimToken
                                            ? 'bg-gradient-to-r from-[#065f46] to-[#10b981] hover:opacity-90 text-white cursor-pointer transition-opacity duration-200'
                                            : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                        }`}
                                    >
                                        {claimingToken ? 'Claiming...' : 'Claim Token'}
                                    </button>
                                    {!canClaimToken && (
                                        <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full mb-4 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg max-w-[300px] break-words">
                                            You can only claim tokens after reaching the required Market Cap, for details on Market Cap, look up tokens using the Mint Address we provided
                                            <div className="absolute top-full -mt-2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    )}
                                </div>
                                </div>
                            )}
                        </div>
                        {claimTokenError && (
                            <p className="mt-2 text-red-500">{claimTokenError}</p>
                        )}
                        {claimTokenSuccess && (
                            <p className="mt-2 text-green-500">{claimTokenSuccess}</p>
                        )}

                        {/* Claim Funds */}
                    <div className="flex justify-center items-center w-full">
                     <div className="relative inline-block group">
                       {isCreator && campaign.status !== 'COMPLETED' && (
                            <button
                                onClick={handleClaimFund}
                                disabled={claiming || !canClaim}
                                className={`font-bold py-2 px-4 rounded-lg w-full sm:w-[70vh] ${
                                    canClaim
                                    ? 'bg-gradient-to-r from-[#673DF5] to-[#B096F3] hover:opacity-90 text-white cursor-pointer transition-opacity duration-200'
                                    : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                }`}
                            >
                                {claiming ? 'Claiming...' : 'Claim Funds'}
                            </button>
                        )}
                       {!canClaim && (
                         <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg whitespace-nowrap">
                           You can only Claim Funds after the Deposit Deadline has passed but before the Trade Deadline
                           <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-2 border-4 border-transparent border-t-gray-900"></div>
                         </div>
                       )}
                     </div>
                    </div>
                   {claimError && (
                    <p className="mt-2 text-red-500">{claimError}</p>
                    )}
                    {claimSuccess && (
                        <p className="mt-2 text-green-500">{claimSuccess}</p>
                    )}
                    <div className="flex justify-center items-center w-full">
                        <div className="relative inline-block group">
                            {!isCreator && campaign.status !== 'COMPLETED' && (
                                <button
                                    onClick={handleDonateFundClick}
                                    className={`font-bold py-2 px-4 rounded-lg w-full sm:w-[70vh] ${
                                        canDonate
                                        ? 'bg-gradient-to-r from-[#673DF5] to-[#B096F3] hover:opacity-90 text-white cursor-pointer transition-opacity duration-200'
                                        : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    }`}
                                    disabled={!canDonate || donating}
                                >
                                    {donating ? 'Donating...' : canDonate ? 'Donate Funds': 'Donate Funds'}
                                </button>
                            )}
                        {!canDonate && (
                            <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg whitespace-nowrap">
                                You can only Donate Funds before the Deposit Deadline
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        )}
                        </div>
                   </div>
                   {donateError && (
                    <p className="mt-2 text-red-500">{donateError}</p>
                    )}
                    {donateSuccess && (
                        <p className="mt-2 text-green-500">{donateSuccess}</p>
                    )}       
                    </div>
                </div>
            </div>
        </div>

          {showPopup && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                      <h2 className="text-2xl text-black font-bold mb-4">Claim Successful</h2>
                      {isClosing ? (
                            <div className="flex items-center gap-3 mb-4">
                                <Loader2 className="h-5 w-5 animate-spin text-black" />
                                <p className="text-black">Please wait a moment...</p>
                            </div>
                        ) : (
                            <p className="mb-4 text-black">{donateSuccess}</p>
                        )}
                      <button
                          onClick={handleClosePopup}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          disabled={isClosing}
                      >
                          OK
                      </button>
                  </div>
              </div>
          )}

            {showDonatePopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 text-black">Donation Successful</h2>
                        {isClosing ? (
                            <div className="flex items-center gap-3 mb-4">
                                <Loader2 className="h-5 w-5 animate-spin text-black" />
                                <p className="text-black">Please wait a moment...</p>
                            </div>
                        ) : (
                            <p className="mb-4 text-black">{donateSuccess}</p>
                        )}
                        <button
                            onClick={handleCloseDonatePopup}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            disabled={isClosing}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {showDonateAmountPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4 text-black">Donate SOL</h2>
                        <p className="mb-4 text-black">Enter the amount of SOL you want to donate (Minimal 0,1 SOL):</p>
                        <input
                            type="number"
                            min="0.1"
                            // step="0.1"
                            value={donationAmount}
                            onChange={(e) => setDonationAmount(parseFloat(e.target.value))}
                            className="w-full p-2 border rounded mb-4 text-black"
                            placeholder="Enter SOL amount"
                        />
                        {donatePopupError && (
                            <p className="text-red-500 text-sm mb-4">{donatePopupError}</p>
                        )}
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowDonateAmountPopup(false)}
                                className="mr-2 px-4 py-2 bg-gray-300 text-black rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDonate}
                                className="px-4 py-2 bg-green-500 text-white rounded"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showClaimPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 text-black">Claim Successful</h2>
                        {isClosing ? (
                            <div className="flex items-center gap-3 mb-4">
                                <Loader2 className="h-5 w-5 animate-spin text-black" />
                                <p className="text-black">Please wait a moment...</p>
                            </div>
                        ) : (
                            <p className="mb-4 text-black">{claimSuccess}</p>
                        )}
                        <button
                            onClick={handleCloseClaimPopup}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            disabled={isClosing}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
    </div>
    );
};

// Main page component with Suspense
const CampaignDetailsPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CampaignContent />
        </Suspense>
    );
};

export default CampaignDetailsPage;