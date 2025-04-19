/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { FinalProject } from "./idl/final_project";
// import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { AdapterWallet } from "./create-campaign";
// import { sign } from "crypto";

async function donateFund(walletAdapter: any, campaignIndexArg: number, amountArg: number, creatorAddress: string) {
  const devnet = true;
  const connection = new Connection(clusterApiUrl(devnet ? "devnet" : "mainnet-beta"), { commitment: 'confirmed' });
  const wallet = new AdapterWallet(walletAdapter);
  const provider = new AnchorProvider(connection, wallet);
  const IDL: FinalProject = require("./idl/final_project.json");
  const program = new Program(IDL, provider);

  const tx = new Transaction();
  // const creatorAddress = new PublicKey(wallet.publicKey); // REPLACE WITH CREATOR ADDRESS
  const creatorPK = new PublicKey(creatorAddress);
  const campaignIndex = new BN(campaignIndexArg); // REPLACE WITH CAMPAIGN INDEX
  const amount = new BN(amountArg * LAMPORTS_PER_SOL); // 1 SOL

  tx.add(await program.methods.donate(
    creatorPK,
    campaignIndex,
    amount,
  ).accounts({
    signer: wallet.publicKey,
  }).instruction());

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  const signedTx = await wallet.signTransaction(recoverTx);

  const txSignature = await connection.sendRawTransaction(signedTx.serialize({ requireAllSignatures: true }));
  console.log("🚀 ~ donate ~ txSignature:", txSignature)
  const latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txSignature,
  });
}

// donateFund();

export default donateFund;
