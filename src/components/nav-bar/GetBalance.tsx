import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";

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
          const balanceInSol = accountInfo.lamports / LAMPORTS_PER_SOL;
          setBalance(Number(balanceInSol.toFixed(4))); // Round to 4 decimal places
        } else {
          throw new Error("Account info not found");
        }

        const accountChangeListener = connection.onAccountChange(
          publicKey,
          (updatedAccountInfo) => {
            const balanceInSol = updatedAccountInfo.lamports / LAMPORTS_PER_SOL;
            setBalance(Number(balanceInSol.toFixed(4))); // Round to 4 decimal places
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
    <div className="flex gap-1 px-2.5 py-[0.25rem] sm:py-2 rounded-3xl cursor-pointer mt-2 justify-center items-center"
    style={{ background: 'linear-gradient(90deg, #065f46 0%, #10b981 100%)' }}>
      <span className="rotate-[-0.0029032474233238784rad]">
        {publicKey ? `${balance} SOL` : ""}
      </span>
    </div>
  );
};