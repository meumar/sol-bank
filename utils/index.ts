import {
  PublicKey,
  clusterApiUrl,
  Connection,
} from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";

import { BASE_INTEREST_RATE } from "./../constants";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export const validateSolAddress = (address: string) => {
  try {
    let pubkey = new PublicKey(address);
    let isSolana = PublicKey.isOnCurve(pubkey.toBuffer());
    return isSolana;
  } catch (error) {
    return false;
  }
};

export const newPublicKey = (address: string) => {
  return new PublicKey(address);
};

export const tokenMetadataDetails = borsh.struct([
  borsh.publicKey("owner"),
  borsh.publicKey("mint"),
  borsh.str("name"),
  borsh.str("symbol"),
  borsh.str("uri"),
]);

export const deserializeTokenMetadata = (account: any) => {
  const offset = 1;
  const { owner, mint, name, symbol, uri } = tokenMetadataDetails.decode(
    account.data.slice(offset, account.data.length)
  );

  return {
    owner,
    mint,
    name: name.replaceAll("\u0000", ""),
    symbol: symbol.replaceAll("\u0000", ""),
    uri: uri.replaceAll("\u0000", ""),
  };
};

export const fromDecimals = (amount: number, decimals: number) => {
  return amount / Math.pow(10, decimals);
};

export const toDecimals = (value: number, decimals: number) => {
  return Math.round(value * Math.pow(10, decimals));
};

export const getRandomString = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

export const poolSupplyDetails = borsh.struct([
  borsh.str("type"),
  borsh.publicKey("user"),
  borsh.publicKey("mint"),
  borsh.u64("amount"),
  borsh.u64("timestamp"),
]);

export const deserializePoolSupplyDetails = (account: any) => {
  const offset = 8;
  const { type, user, mint, amount, timestamp } = poolSupplyDetails.decode(
    account.data.slice(offset, account.data.length)
  );

  return {
    type,
    user: user.toBase58(),
    mint: mint.toBase58(),
    amount: amount.toNumber(),
    timestamp: new Date(timestamp.toNumber() * 1000).toLocaleString(),
    differenceDays: Math.floor(
      (Date.now() - timestamp.toNumber() * 1000) / (1000 * 60 * 60 * 24)
    ),
  };
};

export const poolBorrowDetails = borsh.struct([
  borsh.str("type"),
  borsh.publicKey("user"),
  borsh.publicKey("mint"),
  borsh.u64("amount"),
  borsh.u64("timestamp"),
  borsh.publicKey("coll_mint"),
  borsh.u64("coll_amount"),
  borsh.u8("status"),
  borsh.u8("interest_rate"),
]);

export const deserializePoolBorrowDetails = (account: any) => {
  const offset = 8;
  const {
    type,
    user,
    mint,
    amount,
    timestamp,
    coll_mint,
    coll_amount,
    status,
    interest_rate,
  } = poolBorrowDetails.decode(account.data.slice(offset, account.data.length));
  return {
    coll_mint: coll_mint.toBase58(),
    coll_amount: coll_amount.toNumber(),
    status,
    interest_rate,
  };
};

export const calculateTotalReturn = (
  amount: number,
  interestRate: number,
  days: number
) => {
  const monthlyInterest = amount * (interestRate / 100);
  const adjustedInterest = (days / 30) * monthlyInterest;

  return Math.round(amount + adjustedInterest);
};

export const lamportsToSol = (lamports: number) => {
  const LAMPORTS_PER_SOL = 1000000000;
  return lamports / LAMPORTS_PER_SOL;
};

export const calculateInterestRate = (total: number, current: number) => {
  if (total === 0 || total === 0) {
    return BASE_INTEREST_RATE;
  }

  const percentage = (current / total) * 100;
  console.log("percentage", percentage);

  if(percentage < 50){
    return BASE_INTEREST_RATE + 3
  }

  return BASE_INTEREST_RATE + 5
};
