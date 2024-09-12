import { useContext, useEffect, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { Chip } from "@nextui-org/chip";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";

import { calculateTotalReturn, fromDecimals } from "@/utils";
import TokenDetails from "./TokenDetails";
import TokenContext from "@/context/TokensContext/TokenDetailsContext";
import ProgramWalletContext from "@/context/ProgramWalletContext/ProgramWalletContext";

import { useWallet } from "@solana/wallet-adapter-react";
import LoadingComponent from "../Loading";

import { MdCurrencyExchange } from "react-icons/md";
import { getWalletAta, useProgram } from "@/context/WalletContextProvider";
import { ADMIN_ADDRESS, PROGRAM_ID } from "@/constants";
import { toast } from "react-toastify";

import { PiEmptyThin } from "react-icons/pi";

const Borrow = () => {
  //State variables
  const [borrows, setBorrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  //Program variables
  const { publicKey }: any = useWallet();
  const savedTokens: any = useContext(TokenContext);
  const program = useProgram();

  //Context
  const tokens: any = useContext(TokenContext);
  const programWalletDetails: any = useContext(ProgramWalletContext);

  useEffect(() => {
    (async () => {
      if (savedTokens.length) {
        fetchSupplies();
      }
    })();
  }, [publicKey, savedTokens]);

  //Methods
  const fetchSupplies = async () => {
    const response = await fetch(`/api/supply?type=loan`);
    const borrows = await response.json();
    const tokens = tokenObject();
    prepareSupplies(borrows, tokens);
  };

  const tokenObject = () => {
    let obj: any = {};
    savedTokens.forEach((t: any) => {
      obj[t.mint] = {
        name: t.name,
        image: t.image,
        decimals: t.decimals,
        symbol: t.symbol,
        animation_url: t.animation_url,
        description: t.description,
      };
    });
    return obj;
  };

  const prepareSupplies = (borrows: any, tokens: any) => {
    const mappedTokens = (borrows || []).map((token: any) => {
      token["mint_details"] = tokens[token.mint];
      token["col_mint_details"] = tokens[token.coll_mint];

      token["payble_amount"] = calculateTotalReturn(
        token.amount,
        token.interest_rate,
        token.differenceDays
      );
      return token;
    });
    setBorrows(mappedTokens);
  };

  const repayLoanAmount = async (tran: any) => {
    try {
      setLoading(true);
      const user_ata = await getWalletAta(publicKey, new PublicKey(tran.mint));
      const program_ata = programWalletDetails.token_pdas.find(
        (e: any) => e.token == tran.mint
      );

      const user_col_ata = await getWalletAta(
        publicKey,
        new PublicKey(tran.coll_mint)
      );
      const program_col_ata = programWalletDetails.token_col_pdas.find(
        (e: any) => e.token == tran.coll_mint
      );

      const [program_wallet, wallet_bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("wallet")],
        new PublicKey(PROGRAM_ID)
      );
      const [program_col_wallet, wallet_col_bump] =
        PublicKey.findProgramAddressSync(
          [Buffer.from("collateral")],
          new PublicKey(PROGRAM_ID)
        );

      const borrow_certificate = new PublicKey(tran.address);

      const txHash = await program.methods
        .repaymentAmount(
          new anchor.BN(tran.payble_amount),
          new anchor.BN(tran.coll_amount),
          new anchor.BN(tran.differenceDays),
          wallet_col_bump
        )
        .accounts({
          userColAta: user_col_ata,
          programColAta: new PublicKey(program_col_ata.ata),
          userLoanAta: user_ata,
          programLoanAta: new PublicKey(program_ata.ata),
          borrowCertificate: borrow_certificate,
          mint: new PublicKey(tran.mint),
          colMint: new PublicKey(tran.coll_mint),
          programLoanWallet: program_wallet,
          programColWallet: program_col_wallet,
          signer: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          adminWallet: new PublicKey(ADMIN_ADDRESS),
        })
        .signers([])
        .rpc();
      setLoading(false);
      toast.success("Congrats! you have borrowed succefully");
      fetchSupplies();
    } catch (e) {
      console.log("gg", e);
      setLoading(false);
      toast.error("Something went wrong!");
    }
  };

  return (
    <main>
      <Card className="bg-slate-800 text-gray-100 p-4">
        <CardBody className="w-full">
          {loading && <LoadingComponent />}
          {!loading && (
            <div className="text-base">
              {[...(borrows || [])]
                .filter((e: any) => e.user == publicKey?.toBase58())
                .map((tran: any) => (
                  <div
                    key={tran.address}
                    className="flex flex-row px-2 text-gray-100 items-center gap-5"
                  >
                    <div className="flex gap-5 border rounded-xl border-slate-600 p-3 w-2/5">
                      <TokenDetails token={tran.mint_details}></TokenDetails>
                      <Chip
                        color={"success"}
                        className="text-bold text-sm capitalize mt-3"
                        size="sm"
                      >
                        {"+"}
                        {fromDecimals(
                          tran.amount,
                          tran.mint_details.decimals
                        )}{" "}
                        {tran.mint_details.symbol}
                      </Chip>
                    </div>
                    <div className="w-28">
                      <MdCurrencyExchange className="text-3xl ml-4" />
                      <span className="text-sm text-red-400">
                        {tran.interest_rate}% montly
                      </span>
                    </div>
                    <div className="flex gap-5 border rounded-xl border-slate-600 p-3 w-2/5">
                      <TokenDetails
                        token={tran.col_mint_details}
                      ></TokenDetails>
                      <Chip
                        color={"danger"}
                        className="text-bold text-sm capitalize mt-3"
                        size="sm"
                      >
                        {"-"}
                        {fromDecimals(
                          tran.coll_amount,
                          tran.col_mint_details.decimals
                        )}{" "}
                        {tran.col_mint_details.symbol}
                      </Chip>
                    </div>
                    <div className="text-sm w-1/5">
                      <h3 className="font-light">Borrowed on</h3>
                      <span className="font-extralight text-gray-500">
                        {tran.timestamp}
                      </span>
                    </div>
                    <div className="text-sm w-1/5">
                      <Button
                        color="primary"
                        size="lg"
                        onClick={() => repayLoanAmount(tran)}
                      >
                        Pay{" "}
                        {fromDecimals(
                          tran.payble_amount,
                          tran.mint_details.decimals
                        )}{" "}
                        {tran.mint_details.symbol}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!borrows.length && !loading && (
            <div className="text-center m-auto">
              <PiEmptyThin className="text-4xl ml-auto mr-auto" />
              {`You don't have any borrows`}
            </div>
          )}
        </CardBody>
      </Card>
    </main>
  );
};

export default Borrow;
