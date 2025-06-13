/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/experiment-form/ExperimentForm.tsx
'use client';

import React, { useState } from 'react';
// import { useWalletContext } from '../../context/WalletContext';
import createCampaign from "@/scripts/create-campaign";
import styles from './ExperimentForm.module.css';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import FormFieldWithTooltip from '../tool-tip/ToolTip';
import ImageUploadField from './UploadImage';
import { NFTStorage, File } from 'nft.storage';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { configs } from '@/env';
import { Konkhmer_Sleokchher, Inter } from 'next/font/google';

const konkhmer = Konkhmer_Sleokchher({
    subsets: ['latin'],
    weight: '400'
})

interface ExperimentFormProps {
    onClose: () => void;
}

const ExperimentForm: React.FC<ExperimentFormProps> = ({ onClose }) => {

    const [showPopup, setShowPopup] = useState(false);
    const [showFailedPopup, setShowFailedPopup] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const router = useRouter();

    const handleClosePopup = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowPopup(false);
            router.push('/');
        }, 15000);
    }

    const handleCloseFailedPopup = () => {
        setShowFailedPopup(false);
        setErrorMessage('');
    }

    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        uri: '',
        depositDeadline: '',
        tradeDeadline: '',
        donationGoal: '',
    });

    const [uploadedImage, setUploadedImage] = useState<File | null>(null);

    const uploadToIPFS = async (file: File) => {
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('name', formData.name);
            form.append('description', formData.uri);
    
            const response = await fetch(configs.api.upload, {
                method: 'POST',
                body: form
            });
    
            if (!response.ok) {
                throw new Error('Failed to upload metadata');
            }
    
            const result = await response.json();
            return result.data.url; // This will be your IPFS metadata URL
            
        } catch (error) {
            console.error('Error uploading metadata:', error);
            throw error;
        }
    };

    const [isSubmitted, setIsSubmitted] = useState(false);

    const [createdCampaignIndex, setCreatedCampaignIndex] = useState<BN | null>(null);

    // Destructure all needed values from context
    const { connected, publicKey, wallet } = useWallet();
    const { connection } = useConnection();
    console.log('🚀 ~ publicKey:', publicKey);

    const [errors, setErrors] = useState({
        depositDeadline: '',
        tradeDeadline: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        //Update form data
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));

        //Date validate
        if (name==='depositDeadline' || name === 'tradeDeadline') {
            validateDates(name, value);
        }
    };

    const validateDates = (fieldName: string, value: string) => {
        const depositDate = fieldName === 'depositDeadline' ? value : formData.depositDeadline;
        const tradeDate = fieldName === 'tradeDeadline' ? value : formData.tradeDeadline;
        const now = new Date().toISOString().split('T')[0];//Current date in YYYY-MM-DD format

        const newErrors = { ...errors };

        //Validate Deposit Deadline
        if (depositDate) {
            if (depositDate <= now) {
                newErrors.depositDeadline = 'Deposit Deadline must be after current date';
            } else {
                newErrors.depositDeadline = '';
            }
        } else {
            newErrors.depositDeadline = '';
        }

        // Validate Trade Deadline
        if (tradeDate) {
            if (tradeDate <= now) {
                newErrors.tradeDeadline = 'Trade Deadline must be after current date';
            } else if (depositDate && tradeDate <= depositDate) {
                newErrors.tradeDeadline = 'Trade Deadline must be after Deposit Deadline';
            } else {
                newErrors.tradeDeadline = '';
            }
        } else {
            newErrors.tradeDeadline = 'Trade Deadline is required';
        }

        setErrors(newErrors);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        setErrorMessage(''); // Reset error message
        
        if (!connected || !publicKey) {
            const errorMsg = 'Please connect your wallet first';
            console.error('❌ Wallet not connected:', { connected, publicKey });
            setErrorMessage(errorMsg);
            alert(errorMsg);
            setIsSubmitted(false);
            return;
        }

        console.log('🔍 Wallet connection check:', {
            connected,
            publicKey: publicKey.toString(),
            wallet: wallet?.adapter?.name
        });

        try {

            if (!uploadedImage) {
                const errorMsg = 'Please upload an image first';
                console.error('❌ Image upload required');
                setErrorMessage(errorMsg);
                alert(errorMsg);
                setIsSubmitted(false);
                return;
            }
            
            console.log('🖼️ Uploading image to IPFS...');
            const metadataUri = await uploadToIPFS(uploadedImage);
            console.log('✅ IPFS upload successful:', metadataUri);

            let depositDeadlineTimestamp: BN | null = null;
            let tradeDeadlineTimestamp: BN;

            // Convert date strings to Unix timestamps
            if (formData.depositDeadline) {
                depositDeadlineTimestamp = new BN(Math.floor(new Date(formData.depositDeadline).getTime() / 1000));
                console.log('📅 Deposit deadline timestamp:', depositDeadlineTimestamp.toString());
            }

            if (formData.tradeDeadline) {
                tradeDeadlineTimestamp = new BN(Math.floor(new Date(formData.tradeDeadline).getTime() / 1000));
                console.log('📅 Trade deadline timestamp:', tradeDeadlineTimestamp.toString());
            } else {
                const errorMsg = 'Trade Deadline is required.';
                console.error('❌ Trade deadline missing');
                setErrorMessage(errorMsg);
                alert(errorMsg);
                setIsSubmitted(false);
                return;
            }

            const currentTimestamp = Math.floor(Date.now() / 1000);
            console.log('⏰ Current timestamp:', currentTimestamp);

            // Validate that Trade Deadline is after current date
            if (tradeDeadlineTimestamp.lte(new BN(currentTimestamp))) {
                const errorMsg = 'Trade Deadline must be in the future.';
                console.error('❌ Trade deadline validation failed:', {
                    tradeDeadline: tradeDeadlineTimestamp.toString(),
                    current: currentTimestamp
                });
                setErrorMessage(errorMsg);
                alert(errorMsg);
                setIsSubmitted(false);
                return;
            }

            // If Deposit Deadline is provided, validate that Trade Deadline is after it
            if (depositDeadlineTimestamp && tradeDeadlineTimestamp.lte(depositDeadlineTimestamp)) {
                const errorMsg = 'Trade Deadline must be after Deposit Deadline.';
                console.error('❌ Deadline order validation failed:', {
                    depositDeadline: depositDeadlineTimestamp.toString(),
                    tradeDeadline: tradeDeadlineTimestamp.toString()
                });
                setErrorMessage(errorMsg);
                alert(errorMsg);
                setIsSubmitted(false);
                return;
            }

            const donationGoalInLamports = Number(formData.donationGoal) * LAMPORTS_PER_SOL;
            console.log('💰 Donation goal in lamports:', donationGoalInLamports);

            console.log('🚀 Calling createCampaign with parameters:', {
                campaignTokenName: formData.name,
                campaignTokenSymbol: formData.symbol,
                uri: metadataUri,
                depositDeadline: depositDeadlineTimestamp ? depositDeadlineTimestamp.toNumber() : 0,
                tradeDeadline: tradeDeadlineTimestamp.toNumber(),
                donationGoal: donationGoalInLamports,
                publicKey: publicKey.toString(),
                walletName: wallet?.adapter?.name
            });

            const campaignIndex = await createCampaign({
                campaignTokenName: formData.name,
                campaignTokenSymbol: formData.symbol,
                uri: metadataUri,
                depositDeadline: depositDeadlineTimestamp ? depositDeadlineTimestamp.toNumber() : 0,
                tradeDeadline: tradeDeadlineTimestamp.toNumber(),
                donationGoal: donationGoalInLamports,
                walletAdapter: wallet?.adapter,
                publicKey: publicKey
            });
            
            console.log('✅ Campaign created successfully! Index:', campaignIndex.toString());
            setCreatedCampaignIndex(campaignIndex);
            setShowPopup(true);
            
        } catch (error: unknown) {
            const errorObj = error as Record<string, unknown>;
            console.error('❌ Campaign creation failed with detailed error:', {
                message: (error as Error)?.message,
                code: errorObj?.code,
                logs: errorObj?.logs,
                stack: (error as Error)?.stack,
                name: (error as Error)?.name,
                cause: errorObj?.cause,
                fullError: error
            });
            
            // Extract meaningful error message
            let userFriendlyMessage = 'An unknown error occurred while creating your campaign.';
            
            if (error && typeof error === 'object' && 'message' in error) {
                const errorMessage = (error as Error).message;
                if (errorMessage.includes('Insufficient SOL') || errorMessage.includes('insufficient funds')) {
                    userFriendlyMessage = `Insufficient SOL balance. Please add more SOL to your wallet. Error: ${errorMessage}`;
                } else if (errorMessage.includes('signature verification failed')) {
                    userFriendlyMessage = 'Transaction signing failed. Please try again.';
                } else if (errorMessage.includes('User rejected')) {
                    userFriendlyMessage = 'Transaction was rejected by user.';
                } else if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
                    userFriendlyMessage = 'Network error. Please check your connection and try again.';
                } else if (errorMessage.includes('Account not found')) {
                    userFriendlyMessage = 'Account setup error. Please ensure you have enough SOL for transaction fees.';
                } else {
                    userFriendlyMessage = `Campaign creation failed: ${errorMessage}`;
                }
            }
            
            setErrorMessage(userFriendlyMessage);
            setShowFailedPopup(true);
            setIsSubmitted(false);
        }
    };

    return (
        <div className="flex flex-col w-full min-h-screen"> 

        <div className={styles['form-container']}>

            <form onSubmit={handleSubmit} className={styles.form}>
                <h2 className={`text-xl sm:text-5xl ${styles['gradient-text']} font-bold text-center mb-8 ${konkhmer.className}`}>New Fund Raising
                    Campaign</h2>

                <div className="mb-4">
                    <label className={`text-sm sm:text-lg text-white font-bold mb-8`}>Token Name <span
                        className="text-red-500">*</span></label>
                    <input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full py-1 sm:py-2 px-2 border-[2px] border-[#10b981] rounded-lg text-white bg:transparent dark:bg-transparent"
                        style={{
                            colorScheme: 'dark',
                        }}
                        required
                    />
                    {isSubmitted && formData.name.trim() === '' && (
                        <p className="text-red-500 text-sm mt-1">This field cannot be left blank</p>
                    )}
                </div>

                <div className="mb-4">
                    <label className={`text-sm sm:text-lg text-white font-bold mb-6`}>Token Symbol <span 
                        className="text-red-500">*</span></label>
                    <input
                        name="symbol"
                        type="text"
                        value={formData.symbol}
                        onChange={handleChange}
                        className="w-full py-1 sm:py-2 px-2 border-[2px] border-[#10b981] rounded-lg text-white bg:transparent dark:bg-transparent"
                        style={{
                            colorScheme: 'dark',
                        }}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className={`text-sm sm:text-lg text-white font-bold mb-4`}>Token Description</label>
                    <textarea
                        name="uri"
                        value={formData.uri}
                        onChange={handleChange}
                        className="w-full h-32 py-1 sm:py-2 px-2 border-[2px] border-[#10b981] rounded-lg text-white bg-transparent dark:bg-transparent"
                    />
                </div>

                <div className="mb-4">
                    <ImageUploadField
                        fieldName={
                            <>
                                <span
                                    className={`text-sm sm:text-lg text-white font-bold mb-4`}>Token Image</span>
                            </>
                        }
                        onChange={(file) => setUploadedImage(file)}
                    />
                </div>

                <div className="mb-4">
                    <FormFieldWithTooltip
                        label={
                            <>
                                <span
                                    className={`text-sm sm:text-lg text-white font-bold mb-4`}>Deposit Deadline <span
                                    className="text-red-500">*</span></span>
                            </>
                        }
                        tooltip="The final timestamp by which donators must contribute SOL for the fundraising campaign. Funds must be received before this deadline for the campaign to proceed"
                    />
                    <div className="date-input-container">
                    <input
                        type="date"
                        name="depositDeadline"
                        value={formData.depositDeadline}
                        onChange={handleChange}
                        className="w-full py-1 sm:py-2 px-2 border-[2px] border-[#10b981] rounded-lg text-white bg:transparent dark:bg-transparent"
                        style={{ colorScheme: 'dark' }}
                        required
                    />
                    </div>
                    {errors.depositDeadline && (
                        <p className="text-red-500 text-sm mt-1">{errors.depositDeadline}</p>
                    )}
                </div>

                <div className="mb-4">
                    <FormFieldWithTooltip
                        label={
                            <>
                                <span
                                    className={`text-sm sm:text-lg text-white font-bold mb-4`}>Trade Deadline <span
                                    className="text-red-500">*</span></span>
                            </>
                        }
                        tooltip="Timestamp unit that the token can only be sold after passing this time mark."
                    />
                    <input
                        name="tradeDeadline"
                        type="date"
                        value={formData.tradeDeadline}
                        onChange={handleChange}
                        className="w-full py-1 sm:py-2 px-2 border-[2px] border-[#10b981] rounded-lg text-white bg:transparent dark:bg-transparent"
                        style={{ colorScheme: 'dark' }}
                        required
                    />
                    {errors.tradeDeadline && (
                        <p className="text-red-500 text-sm mt-1">{errors.tradeDeadline}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label className={`text-sm sm:text-lg text-white font-bold mb-4`}>Donation Goal (SOL) <span
                        className="text-red-500">*</span></label>
                    <input
                        name="donationGoal"
                        type="number"
                        step="0.1"
                        value={formData.donationGoal}
                        onChange={handleChange}
                        className="w-full p-2 border-[2px] border-[#10b981] rounded-lg text-white bg:transparent dark:bg-transparent"
                        style={{ colorScheme: 'dark' }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-[50%] mx-auto bg-gradient-to-r from-[#065f46] to-[#10b981] text-white p-3 rounded-lg flex items-center justify-center"
                >
                    {isSubmitted && !showPopup && <Loader2 className="animate-spin inline-block mr-2" size={20} />}
                    Submit
                </button>
            </form>
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 text-black">Create Campaign Successful</h2>
                        {isClosing ? (
                            <div className="flex items-center gap-3 mb-4">
                                <Loader2 className="h-5 w-5 animate-spin text-black" />
                                <p className="text-black">Please wait a moment, you will be redirected to the homepage...</p>
                            </div>
                        ) : (
                            <p className="mb-4 text-black">Your campaign has been created</p>
                        )}
                        <button
                            onClick={handleClosePopup}
                            className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {showFailedPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4 text-red-600">Create Campaign Failed</h2>
                        <div className="mb-4">
                            <p className="text-gray-700 mb-2">An error occurred while creating your campaign:</p>
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                                <p className="text-red-800 text-sm break-words">{errorMessage}</p>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                Please check the browser console for more detailed error information.
                            </p>
                        </div>
                        <button
                            onClick={handleCloseFailedPopup}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default ExperimentForm;