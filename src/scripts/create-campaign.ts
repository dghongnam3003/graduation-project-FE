/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { WalletContextState } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { WalletAdapter } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import { FinalProject } from "./idl/final_project";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export class AdapterWallet implements Wallet {
  readonly payer = new Keypair();
  constructor(private adapter: WalletContextState) {}

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (!this.adapter.signTransaction) {
      throw new Error('Wallet does not support transaction signing!');
    }
    return this.adapter.signTransaction(tx);
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    if (!this.adapter.signAllTransactions) {
      throw new Error('Wallet does not support signing multiple transactions!');
    }
    return this.adapter.signAllTransactions(txs);
  }

  get publicKey(): PublicKey {
    if (!this.adapter.publicKey) {
      throw new Error('Wallet not connected');
    }
    return this.adapter.publicKey;
  }
}

interface CreateCampaignParams {
  campaignTokenName: string;
  campaignTokenSymbol: string;
  uri: string;
  depositDeadline: number;
  tradeDeadline: number;
  donationGoal: number;
  walletAdapter: any; // You can use WalletAdapter type from @solana/wallet-adapter-base
  publicKey: PublicKey;
}

async function createCampaign(params: CreateCampaignParams): Promise<BN> {
  try {
    console.log('🚀 Starting createCampaign with params:', {
      campaignTokenName: params.campaignTokenName,
      campaignTokenSymbol: params.campaignTokenSymbol,
      depositDeadline: params.depositDeadline,
      tradeDeadline: params.tradeDeadline,
      donationGoal: params.donationGoal,
      publicKey: params.publicKey.toString(),
      walletAdapter: params.walletAdapter?.name || 'unknown'
    });

    const devnet = true;
    const connection = new Connection(clusterApiUrl(devnet ? "devnet" : "mainnet-beta"), { commitment: 'confirmed' });

    // Check wallet balance first
    console.log('💰 Checking wallet balance for:', params.publicKey.toString());
    const balance = await connection.getBalance(params.publicKey);
    console.log('💰 Wallet balance:', balance / LAMPORTS_PER_SOL, 'SOL');
    
    if (balance < 0.01 * LAMPORTS_PER_SOL) {
      const errorMsg = `Insufficient SOL balance. Current: ${balance / LAMPORTS_PER_SOL} SOL, Required: at least 0.01 SOL for transaction fees.`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('🔗 Creating wallet adapter...');
    const wallet = new AdapterWallet(params.walletAdapter);
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const IDL: FinalProject = require("./idl/final_project.json");
    const program = new Program(IDL, provider);

    console.log('📋 Program ID:', program.programId.toString());

  const tx = new Transaction();
  let lastCampaignIndex = new BN(0);
  
  console.log('🔍 Finding creator PDA...');
  const [creator, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator"), params.publicKey.toBuffer()],
    program.programId
  );
  console.log('👤 Creator PDA:', creator.toString());
  
  const creatorAccountInfo = await connection.getAccountInfo(creator);
  console.log('📝 Creator account exists:', !!creatorAccountInfo);
  
  if (!creatorAccountInfo) {
    console.log('🆕 Creating new creator account...');
    tx.add(await program.methods.initializeCreator(
      bump,
    ).accounts({
      creator: params.publicKey,
    }).instruction());
  } else {
    console.log('📊 Fetching existing creator data...');
    const creatorData = await program.account.creator.fetch(creator);
    lastCampaignIndex = creatorData.lastCampaignIndex;
    console.log('📈 Last campaign index:', lastCampaignIndex.toString());
  }

  console.log('🎯 Finding campaign PDA...');
  
  // Campaign index should be the NEXT index (lastCampaignIndex + 1)
  const nextCampaignIndex = lastCampaignIndex.add(new BN(1));
  console.log('📈 Next campaign index to use:', nextCampaignIndex.toString());
  
  const [campaign, campaignBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), params.publicKey.toBuffer(), Buffer.from(nextCampaignIndex.toArray("le", 8))],
    program.programId
  );
  console.log('🏛️ Campaign PDA:', campaign.toString());
  console.log('🔢 Campaign seeds debug:', {
    seed1: "campaign",
    seed2: params.publicKey.toString(),
    seed3: nextCampaignIndex.toString(),
    seed3_bytes: Array.from(nextCampaignIndex.toArray("le", 8))
  });

  const campaignTokenName = params.campaignTokenName;
  const campaignTokenSymbol = params.campaignTokenSymbol;
  const campaignTokenUri = params.uri;
  const depositDeadline = new BN(params.depositDeadline);
  const tradeDeadline = new BN(params.tradeDeadline);
  const donationGoal = new BN(params.donationGoal);
  
  console.log('📋 Adding create campaign instruction...');
  console.log('Campaign parameters:', {
    campaignBump,
    campaignTokenName,
    campaignTokenSymbol,
    campaignTokenUri,
    depositDeadline: depositDeadline.toString(),
    tradeDeadline: tradeDeadline.toString(),
    donationGoal: donationGoal.toString(),
  });
  
  tx.add(await program.methods.createCampaign(
    campaignBump,
    campaignTokenName,
    campaignTokenSymbol,
    campaignTokenUri,
    depositDeadline,
    tradeDeadline,
    donationGoal,
  ).accounts({
    creator: params.publicKey,
    campaignAccount: campaign,
  }).instruction());

  console.log('🔐 Setting transaction parameters...');
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = params.publicKey;
  
  console.log('✍️ Signing transaction...');
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  const signedTx = await wallet.signTransaction(recoverTx);

  console.log('📤 Sending transaction...');
  const txSignature = await connection.sendRawTransaction(signedTx.serialize({ requireAllSignatures: true }));
  console.log("🚀 Transaction signature:", txSignature)
  
  console.log('⏳ Confirming transaction...');
  let latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txSignature,
  });
  console.log('✅ Transaction confirmed!');

  // After confirming the transaction
  console.log('📊 Fetching final creator data...');
  const creatorAccount = await program.account.creator.fetch(creator);
  const campaignIndex = creatorAccount.lastCampaignIndex;
  console.log("🎯 Final Campaign Index:", campaignIndex.toString());

  return campaignIndex;
  } catch (error: unknown) {
    const errorObj = error as Record<string, unknown>;
    console.error('❌ Create campaign error details:', {
      message: (error as Error)?.message,
      code: errorObj?.code,
      logs: errorObj?.logs,
      stack: (error as Error)?.stack,
      error: error
    });
    
    // Re-throw with more context
    const errorMessage = (error as Error)?.message || 'Unknown error';
    if (errorMessage.includes('Insufficient SOL')) {
      throw new Error(`Insufficient funds: ${errorMessage}`);
    } else if (errorMessage.includes('0x1')) {
      throw new Error('Account not found or insufficient rent. Please ensure you have enough SOL for transaction fees.');
    } else if (errorMessage.includes('signature verification failed')) {
      throw new Error('Transaction signing failed. Please try again.');
    } else {
      throw new Error(`Campaign creation failed: ${errorMessage}`);
    }
  }
}

export default createCampaign;
