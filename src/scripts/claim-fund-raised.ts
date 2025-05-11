/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { FinalProject } from "./idl/final_project";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { AdapterWallet } from "./create-campaign";

async function claimFundRaised(walletAdapter: any, campaignIndex: BN) {
  if (!campaignIndex) {
    throw new Error("Campaign index is required");
  }

  const devnet = true;
  const connection = new Connection(clusterApiUrl(devnet ? "devnet" : "mainnet-beta"), { commitment: 'confirmed' });
  const wallet = new AdapterWallet(walletAdapter);
  const provider = new AnchorProvider(connection, wallet);
  const IDL: FinalProject = require("./idl/final_project.json");
  const program = new Program(IDL, provider);

  const tx = new Transaction();
  // const campaignIndex = new BN(argcampaignIndex); // REPLACE WITH CAMPAIGN INDEX

  const [campaign, _] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), wallet.publicKey.toBuffer(), Buffer.from(campaignIndex.toArray("le", 8))],
    program.programId
  );

  tx.add(await program.methods.claimFund().accounts({
    creator: wallet.publicKey,
    campaignAccount: campaign,
  }).instruction());

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  const signedTx = await wallet.signTransaction(recoverTx);

  const txSignature = await connection.sendRawTransaction(signedTx.serialize({ requireAllSignatures: true }));
  console.log("🚀 ~ claimFundRaised ~ txSignature:", txSignature)
  let latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txSignature,
  });
}

// claimFundRaised();
export default claimFundRaised;