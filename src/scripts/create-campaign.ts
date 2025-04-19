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
  const devnet = true;
  const connection = new Connection(clusterApiUrl(devnet ? "devnet" : "mainnet-beta"), { commitment: 'confirmed' });

  const wallet = new AdapterWallet(params.walletAdapter);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const IDL: FinalProject = require("./idl/final_project.json");
  const program = new Program(IDL, provider);

  const tx = new Transaction();
  let lastCampaignIndex = new BN(0);
  const [creator, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator"), params.publicKey.toBuffer()],
    program.programId
  );
  const creatorAccountInfo = await connection.getAccountInfo(creator);
  if (!creatorAccountInfo) {
    tx.add(await program.methods.initializeCreator(
      bump,
    ).accounts({
      creator: params.publicKey,
    }).instruction());
  } else {
    lastCampaignIndex = (await program.account.creator.fetch(creator)).lastCampaignIndex;
  }

  const [campaign, campaignBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), params.publicKey.toBuffer(), Buffer.from(lastCampaignIndex.toArray("le", 8))],
    program.programId
  );

  const campaignTokenName = params.campaignTokenName;
  const campaignTokenSymbol = params.campaignTokenSymbol;
  const campaignTokenUri = params.uri;
  const depositDeadline = new BN(params.depositDeadline);
  const tradeDeadline = new BN(params.tradeDeadline);
  const donationGoal = new BN(params.donationGoal);
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

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = params.publicKey;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  const signedTx = await wallet.signTransaction(recoverTx);

  const txSignature = await connection.sendRawTransaction(signedTx.serialize({ requireAllSignatures: true }));
  console.log("🚀 ~ createCampaign ~ txSignature:", txSignature)
  let latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txSignature,
  });

  // After confirming the transaction
  const creatorAccount = await program.account.creator.fetch(creator);
  const campaignIndex = creatorAccount.lastCampaignIndex;
  console.log("Campaign Index:", campaignIndex.toString());

  return campaignIndex;
}

// createCampaign();

export default createCampaign;
