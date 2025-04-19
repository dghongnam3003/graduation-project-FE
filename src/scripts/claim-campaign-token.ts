/* eslint-disable @typescript-eslint/no-require-imports */
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { FinalProject } from "./idl/final_project";
import dotenv from "dotenv";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { AdapterWallet } from "./create-campaign";

async function claimCampaignToken(walletAdapter: any, campaignIndex: BN) {
  const devnet = true;
  const connection = new Connection(clusterApiUrl(devnet ? "devnet" : "mainnet-beta"), { commitment: 'confirmed' });
  const wallet = new AdapterWallet(walletAdapter);
  const provider = new AnchorProvider(connection, wallet);
  const IDL: FinalProject = require("./idl/final_project.json");
  const program = new Program(IDL, provider);

  const tx = new Transaction();
  const creatorAddress = wallet.publicKey;

  const [treasury,] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );
  const [campaign,] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), creatorAddress.toBuffer(), Buffer.from(campaignIndex.toArray("le", 8))],
    program.programId
  );

  const campaignData = await program.account.campaign.fetch(campaign);

  const associatedTreasury = getAssociatedTokenAddressSync(campaignData.mint, treasury, true);
  const associatedCreator = getAssociatedTokenAddressSync(campaignData.mint, campaignData.creator);
  const [associatedTreasuryInfo, associatedCreatorInfo] = await connection.getMultipleAccountsInfo([
    associatedTreasury,
    associatedCreator
  ]);
  if (!associatedTreasuryInfo) {
    tx.add(createAssociatedTokenAccountInstruction(
      creatorAddress,
      associatedTreasury,
      treasury,
      campaignData.mint
    ));
  }
  if (!associatedCreatorInfo) {
    tx.add(createAssociatedTokenAccountInstruction(
      creatorAddress,
      associatedCreator,
      campaignData.creator,
      campaignData.mint
    ));

  tx.add(await program.methods.claimToken().accounts({
    creator: creatorAddress,
    campaignAccount: campaign,
  }).instruction());

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = creatorAddress;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  const signedTx = await wallet.signTransaction(recoverTx);

  // const simulation = await connection.simulateTransaction(tx);
  // simulation.value.logs.forEach((log, index) => {
  //   console.log(`Log ${index}:`, log);
  // });
  // return;

  const txSignature = await connection.sendRawTransaction(signedTx.serialize({ requireAllSignatures: true }));
  console.log("🚀 ~ claimCampaignToken ~ txSignature:", txSignature)
  let latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txSignature,
  });
}
}

export default claimCampaignToken;
