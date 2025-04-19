/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { findMetadataPda, MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from "@metaplex-foundation/umi";
import { PrePump } from "./idl/pre_pump";
import { PumpFun } from "./idl/pump";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { calcOutTokenAmount } from "./calc-out-token-amount";
import { AdapterWallet } from "./create-campaign";
import { sign } from "crypto";

async function createCampaignToken(
  walletAdapter: any,
  campaignIndex: BN,
) {
  const devnet = true;
  const connection = new Connection(clusterApiUrl(devnet ? "devnet" : "mainnet-beta"), { commitment: 'confirmed' });
  const wallet = new AdapterWallet(walletAdapter);
  const provider = new AnchorProvider(connection, wallet);
  const IDL: PrePump = require("./idl/pre_pump.json");
  const PumpFunIDL: PumpFun = require("./idl/pump.json");
  const program = new Program(IDL, provider);
  const pumpFunProgram = new Program(PumpFunIDL, provider);

  const creatorAddress = wallet.publicKey;
  // const campaignIndex = new BN(4); // REPLACE WITH CAMPAIGN INDEX
  const slippage = 200;

  const pumpFunGlobal = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
  const pumpFunFeeRecipient = devnet
    ? new PublicKey("68yFSZxzLWJXkxxRGydZ63C6mHx1NLEDWmwN9Lb5yySg")
    : new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
  const pumpFunMintAuthority = new PublicKey("TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM")
  const pumpFunEventAuthority = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");

  const tx = new Transaction();

  const [config,] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [treasury,] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  const [campaign,] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), creatorAddress.toBuffer(), Buffer.from(campaignIndex.toArray("le", 8))],
    program.programId
  );

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  console.log("🚀 ~ createCampaignToken ~ mint:", mint.toBase58())
  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("bonding-curve"),
      mint.toBuffer()
    ],
    pumpFunProgram.programId
  );

  let associatedCampaign = getAssociatedTokenAddressSync(mint, campaign, true);
  let associatedSigner = getAssociatedTokenAddressSync(mint, wallet.publicKey);
  let associatedBondingCurve = getAssociatedTokenAddressSync(mint, bondingCurve, true);
  const umi = createUmi(devnet ? clusterApiUrl("devnet") : clusterApiUrl("mainnet-beta"));
  const [metadataString,] = findMetadataPda(umi, { mint: publicKey(mint.toBase58()) });
  const metadata = new PublicKey(metadataString);
  const createTokenAccounts = {
    operator: wallet.publicKey,
    config,
    treasury,
    creator: creatorAddress,
    campaignAccount: campaign,
    mint,
    pumpFunMintAuthority,
    pumpFunBondingCurve: bondingCurve,
    pumpFunAssociatedBondingCurve: associatedBondingCurve,
    pumpFunGlobal,
    pumpFunEventAuthority,
    pumpFunProgram: pumpFunProgram.programId,
    metadata,
    mplTokenMetadata: MPL_TOKEN_METADATA_PROGRAM_ID
  }
  tx.add(await program.methods.createToken(slippage).accounts(createTokenAccounts).instruction());

  // Buy on Pump.fun
  const campaignInfo = await connection.getAccountInfo(campaign);
  if (!campaignInfo) throw new Error('Campaign account not found');
  const campaignBalance = new BN(campaignInfo.lamports);
  const minimumRentExemption = new BN(await connection.getMinimumBalanceForRentExemption(campaignInfo.data.length));
  const availableBalance = campaignBalance.sub(minimumRentExemption);
  const configData = await program.account.config.fetch(config);
  const fee = availableBalance.mul(new BN(configData.protocolFeePercentage)).div(new BN(10000));
  let maxSolCost = availableBalance.sub(fee);
  console.log("🚀 ~ createCampaignToken ~ maxSolCost:", maxSolCost.toString())
  let tokenAmount = calcOutTokenAmount(maxSolCost, slippage);

  tx.add(
    createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      associatedSigner,
      wallet.publicKey,
      mint,
    )
  );
  const pumpFunBuyTokenAccounts = {
    global: pumpFunGlobal,
    feeRecipient: pumpFunFeeRecipient,
    mint: mint,
    bondingCurve: bondingCurve,
    associatedBondingCurve: associatedBondingCurve,
    associatedUser: associatedSigner,
    user: wallet.publicKey,
    eventAuthority: pumpFunEventAuthority,
    program: pumpFunProgram.programId,
  }
  tx.add(await pumpFunProgram.methods.buy(tokenAmount, maxSolCost).accounts(pumpFunBuyTokenAccounts).instruction());

  // Deposit token to campaign
  tx.add(
    createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      associatedCampaign,
      campaign,
      mint,
    )
  )
  tx.add(createTransferInstruction(
    associatedSigner,
    associatedCampaign,
    wallet.publicKey,
    BigInt(tokenAmount.toString()),
  ))

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  // recoverTx.partialSign(keyPair);
  recoverTx.partialSign(mintKeypair);
  const signedTx = await wallet.signTransaction(recoverTx);

  // const simulation = await connection.simulateTransaction(tx);
  // simulation.value.logs.forEach((log, index) => {
  //   console.log(`Log ${index}:`, log);
  // });
  // return;
  const txSignature = await connection.sendRawTransaction(signedTx.serialize({ requireAllSignatures: true }));
  console.log("🚀 ~ createCampaignAndBuyToken ~ txSignature:", txSignature)
  let latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txSignature,
  });
}

// createCampaignToken();
export default createCampaignToken;
