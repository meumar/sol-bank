import { useContext, useEffect, useState } from "react";

import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import { Chip } from "@nextui-org/chip";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";

import { toast } from "react-toastify";

import { PiEmptyThin } from "react-icons/pi";

import { ADMIN_ADDRESS, FUND_INTEREST_RATE, PROGRAM_ID } from "@/constants";
import { calculateTotalReturn, fromDecimals } from "@/utils";
import TokenDetails from "./TokenDetails";
import LoadingComponent from "../Loading";

import { useWallet } from "@solana/wallet-adapter-react";

import ProgramWalletContext from "@/context/ProgramWalletContext/ProgramWalletContext";
import { getWalletAta, useProgram } from "@/context/WalletContextProvider";
import TokenContext from "@/context/TokensContext/TokenDetailsContext";

const Supply = () => {
  //State variables
  const [supplies, setSupplies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  //Program variables
  const program = useProgram();
  const { publicKey }: any = useWallet();
  const savedTokens: any = useContext(TokenContext);

  //Context
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
    setLoading(true);
    const response = await fetch(`/api/supply?type=supply`);
    const supplies = await response.json();
    const tokens = tokenObject();
    prepareSupplies(supplies, tokens);
    setLoading(false);
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

  const prepareSupplies = (supplies: any, tokens: any) => {
    const mappedTokens = (supplies || []).map((token: any) => {
      token["mint_details"] = tokens[token.mint];
      token["payble_amount"] = calculateTotalReturn(
        token.amount,
        FUND_INTEREST_RATE,
        token.differenceDays
      );
      return token;
    });
    setSupplies(
      mappedTokens.filter((e: any) => e.user == publicKey?.toBase58())
    );
  };

  const withdrawAmount = async (tran: any) => {
    try {
      setLoading(true);
      const user_ata = await getWalletAta(publicKey, new PublicKey(tran.mint));
      const program_ata = programWalletDetails.token_pdas.find(
        (e: any) => e.token == tran.mint
      );

      const [program_wallet, wallet_bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("wallet")],
        new PublicKey(PROGRAM_ID)
      );

      const supply_certificate = new PublicKey(tran.address);

      const txHash = await program.methods
        .withdrawSupply(
          new anchor.BN(tran.differenceDays),
          new anchor.BN(FUND_INTEREST_RATE),
          wallet_bump
        )
        .accounts({
          userAta: user_ata,
          programAta: new PublicKey(program_ata.ata),
          supplyCertificate: supply_certificate,
          mint: new PublicKey(tran.mint),
          programWallet: program_wallet,
          signer: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          adminWallet: new PublicKey(ADMIN_ADDRESS),
        })
        .signers([])
        .rpc();
      setLoading(false);
      toast.success("Congrats! you have withdraw succefully");
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
              {[...(supplies || [])].map((tran: any) => (
                <div
                  key={tran.address}
                  className="flex flex-row gap-5 py-1 px-2 text-gray-100 "
                >
                  <div className="basis-1/4">
                    <TokenDetails token={tran.mint_details}></TokenDetails>
                  </div>
                  <div className="basis-1/4 text-right">
                    <Chip
                      color={tran.type == "SUPPLY" ? "success" : "danger"}
                      className="text-bold text-sm capitalize"
                      size="sm"
                    >
                      {tran.type == "SUPPLY" ? "+" : "-"}
                      {fromDecimals(
                        tran.amount,
                        tran.mint_details.decimals
                      )}{" "}
                      {tran.mint_details.symbol}
                    </Chip>
                  </div>
                  <div className="text-sm w-1/5">
                    <h3 className="font-light">Supplied on</h3>
                    <span className="font-extralight text-gray-500">
                      {tran.timestamp}
                    </span>
                  </div>
                  <div className="text-sm w-1/5">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={() => withdrawAmount(tran)}
                    >
                      Withdraw{" "}
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
          {!supplies.length && !loading && (
            <div className="text-center m-auto">
              <PiEmptyThin className="text-4xl ml-auto mr-auto" />
              {`You don't have any supplies`}
            </div>
          )}
        </CardBody>
      </Card>
    </main>
  );
};

export default Supply;
