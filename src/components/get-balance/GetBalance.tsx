import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";
import styles from "./GetBalance.module.css";
 
export const BalanceDisplay: FC = () => {
  const [balance, setBalance] = useState(0);
  const { connection } = useConnection();
  const { publicKey } = useWallet();
 
  useEffect(() => {
    if (!publicKey) {
      setBalance(0);
      return;
    }

    const updateBalance = async () => {
      try {
        const accountInfo = await connection.getAccountInfo(publicKey);
        if (accountInfo) {
          setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
        } else {
          throw new Error("Account info not found");
        }

        const accountChangeListener = connection.onAccountChange(
          publicKey,
          (updatedAccountInfo) => {
            setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
          },
          "confirmed"
        );

        return () => {
          connection.removeAccountChangeListener(accountChangeListener);
        };
      } catch (error) {
        console.error("Failed to retrieve account info:", error);
      }
    };
 
    let cleanupFunction: (() => void) | undefined;
    updateBalance().then((cleanup) => {
      cleanupFunction = cleanup;
    });
    return () => {
      if (cleanupFunction) cleanupFunction();
    };
  }, [connection, publicKey]);
 
  return (
    <div className={styles['balance-container']}>
      <p className={styles['balance-display']}>{publicKey ? `${balance} SOL` : ""}</p>
    </div>
  );
};