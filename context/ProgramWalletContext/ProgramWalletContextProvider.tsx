"use client";
import React, { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";

import ProgramContext from "./ProgramWalletContext";
import { PROGRAM_ID, TOKENS } from "@/constants";
const ProgramWalletContextProvider = ({ children }: any) => {
  const [detais, setDetais] = useState<any>({});

  const getProgramDetails = async () => {
    const [bankWallet, wallet_bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("wallet")],
      new PublicKey(PROGRAM_ID)
    );

    const [bankCollateral, bank_collateral_bump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("collateral")],
        new PublicKey(PROGRAM_ID)
      );

    const tokenPda = await Promise.all(
      TOKENS.map(async (token) => {
        const [program_token_account, token_bump] =
          PublicKey.findProgramAddressSync(
            [new PublicKey(token).toBuffer()],
            new PublicKey(PROGRAM_ID)
          );
        return {
          token: token,
          ata: program_token_account,
          bump: token_bump,
        };
      })
    );

    const tokenColPda = await Promise.all(
      TOKENS.map(async (token) => {
        const [program_token_account, token_bump] =
          PublicKey.findProgramAddressSync(
            [new PublicKey(token).toBuffer(), bankCollateral.toBuffer()],
            new PublicKey(PROGRAM_ID)
          );
        return {
          token: token,
          ata: program_token_account,
          bump: token_bump,
        };
      })
    );
    setDetais({
      bank_wallet: bankWallet,
      bank_collateral_wallet: bankCollateral,
      token_pdas: tokenPda,
      token_col_pdas: tokenColPda,
    });
  };

  useEffect(() => {
    getProgramDetails();
  }, []);

  return (
    <ProgramContext.Provider value={detais}>{children}</ProgramContext.Provider>
  );
};

export default ProgramWalletContextProvider;
