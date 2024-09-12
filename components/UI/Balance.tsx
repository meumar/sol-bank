import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

const Balance = () => {
  //State variables
  const [balance, setbalance] = useState<number>(0.0);
  const [loan, setLoan] = useState<number>(0.0);
  const [userWallet, setUserWallet] = useState<string>("");

  //Program variables
  const { publicKey }: any = useWallet();

  useEffect(() => {
    if (publicKey && publicKey.toBase58() !== userWallet) {
      setUserWallet(publicKey.toBase58());
      fetchBalance();
    }
  }, [publicKey]);

  //Methods
  const fetchBalance = async () => {
    const response = await fetch(`/api/balance/${publicKey.toBase58()}`);
    const { balance, borrow } = await response.json();

    setbalance(balance);
    setLoan(borrow);
  };

  return (
    <main className="mb-3">
      <div className="text-left">
        <p className="font-medium">Balance</p>
      </div>
      <div className="flex">
        <h1 className="text-3xl text-teal-400">{balance}</h1>
        <h1 className="text-3xl"> / </h1>
        <h1 className="text-3xl text-red-400">{loan}</h1>
      </div>
    </main>
  );
};

export default Balance;
