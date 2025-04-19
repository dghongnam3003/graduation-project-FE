/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { PrePump } from "./idl/pre_pump";
// import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { AdapterWallet } from "./create-campaign";

async function getCampaign(walletAdapter: any, campaignIndexarg: number) {
  const devnet = true;
  const connection = new Connection(
    devnet ? clusterApiUrl("devnet") : clusterApiUrl("mainnet-beta"), { commitment: 'confirmed' });
  const wallet = new AdapterWallet(walletAdapter);
  const provider = new AnchorProvider(connection, wallet);
  const IDL: PrePump = require("./idl/pre_pump.json");
  const program = new Program(IDL, provider);

  const creatorAddress = new PublicKey(wallet.publicKey);
  const campaignIndex = new BN(campaignIndexarg);
  const [campaign, _] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), creatorAddress.toBuffer(), Buffer.from(campaignIndex.toArray("le", 8))],
    program.programId
  );
  console.log("🚀 ~ campaign:", campaign)

  const campaignInfo = await connection.getAccountInfo(campaign);
  if (!campaignInfo) throw new Error('Campaign account not found');
  const minimumRentExemption = await connection.getMinimumBalanceForRentExemption(campaignInfo.data.length);
  let campaignData = await program.account.campaign.fetch(campaign);
  const result = {
    totalFundRaised: campaignInfo.lamports - minimumRentExemption,
    ...campaignData,
  }

  console.log(result);

  return result;
}

// getCampaign();
export default getCampaign;
