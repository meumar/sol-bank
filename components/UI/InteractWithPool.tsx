import { useContext, useMemo } from "react";
import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { Button } from "@nextui-org/button";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalContent,
  useDisclosure,
} from "@nextui-org/modal";
import { IoAdd } from "react-icons/io5";
import { toast } from "react-toastify";

import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";

import TokenContext from "@/context/TokensContext/TokenDetailsContext";
import ProgramWalletContext from "@/context/ProgramWalletContext/ProgramWalletContext";

import { getWalletAta, useProgram } from "../../context/WalletContextProvider";

import { useState } from "react";
import {
  calculateInterestRate,
  fromDecimals,
  getRandomString,
  toDecimals,
} from "@/utils";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@/constants";
import TokenSelect from "./TokenSelect";
import AmountComponent from "./AmountComponents";

const InteractWithWallet = ({
  type,
  variant,
  reload,
}: {
  type: string;
  variant: any;
  reload: any;
}) => {
  //State variables
  const [amount, setAmount] = useState<any>(0);
  const [mint, setMint] = useState<string>("");

  const [collateral, setCollateral] = useState<number>(0);
  const [collateralMint, setCollateralMint] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const [amountMessage, setAmountMessage] = useState<string>("");
  const [isInvalid, setIsInvalid] = useState<boolean>(false);

  const [colAmountMessage, setColAmountMessage] = useState<string>("");

  //Constant variables
  const label = type == "SUPPLY" ? "Supply" : "Borrow";
  const modalTitle = type == "SUPPLY" ? "Add supply" : "Take borrow";
  const interestRate = 1.2;

  //Program variables and instances
  const { publicKey }: any = useWallet();
  const { connection } = useConnection();
  const program = useProgram();

  //Context
  const tokens: any = useContext(TokenContext);
  const programWalletDetails: any = useContext(ProgramWalletContext);

  //Modal
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  //Methods
  const action = () => {
    if (!publicKey) {
      toast.warning("Please connect your wallet!");
      return;
    }
    resetForm();
    onOpen();
  };

  const resetForm = () => {
    setAmount(0);
    setMint("");
    setCollateral(0);
    setCollateralMint("");
    setAmountMessage("");
    setIsInvalid(false);
    setLoading(false);
  };

  const checkData = useMemo(async () => {
    setAmountMessage("");
    setIsInvalid(false);
    setLoading(true);
    const selected_token = tokens.find((e: any) => e.mint == mint);
    const decimalAmount = fromDecimals(
      amount || 0,
      selected_token?.decimals || 0
    );
    setAmountMessage(`In decimals: ${decimalAmount}`);

    if (type == "SUPPLY" && mint) {
      const userAta = await getWalletAta(publicKey, new PublicKey(mint));
      const userValue = await connection.getTokenAccountBalance(userAta);

      if (!userValue || userValue?.value?.amount < amount) {
        setIsInvalid(true);
        setAmountMessage(`You don't have enough tokens`);
      }
    } else if (mint) {
      const programAta = programWalletDetails.token_pdas.find(
        (e: any) => e.token == mint
      );
      const programValue = await connection.getTokenAccountBalance(
        programAta.ata
      );

      if (!programValue || programValue?.value?.amount < amount) {
        setIsInvalid(true);
        setAmountMessage(`Pool don't have enough tokens`);
        setLoading(false);
        return;
      }
      if (collateralMint) {
        const [mintPriceResponse, collateralPriceResponse] = await Promise.all([
          fetch(`/api/price/${mint}`),
          fetch(`/api/price/${collateralMint}`),
        ]);
        const [mintPrice, collateralPrice] = await Promise.all([
          mintPriceResponse.json(),
          collateralPriceResponse.json(),
        ]);

        const calMintPrice = Math.round(decimalAmount * mintPrice);

        const calCollMintPrice = Math.round(calMintPrice / collateralPrice);

        const selected_token_col = tokens.find(
          (e: any) => e.mint == collateralMint
        );

        const calCollMintPriceInToDecimals =
          toDecimals(calCollMintPrice, selected_token_col.decimals) *
          interestRate;

        setCollateral(calCollMintPriceInToDecimals);
        const colDecimalAmount = fromDecimals(
          calCollMintPriceInToDecimals || 0,
          selected_token_col?.decimals || 0
        );
        setColAmountMessage(`In decimals: ${colDecimalAmount}`);
      }
    }
    setLoading(false);
  }, [amount, mint, collateralMint]);

  const onSubmit = async () => {
    const randomKey = getRandomString();
    const user_ata = await getWalletAta(publicKey, new PublicKey(mint));
    const program_ata = programWalletDetails.token_pdas.find(
      (e: any) => e.token == mint
    );
    if (!program_ata?.ata) {
      toast.warning("Pool doesn't have specifed token account");
      return;
    }
    const [program_wallet, wallet_bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("wallet")],
      new PublicKey(PROGRAM_ID)
    );

    if (type == "SUPPLY") {
      try {
        setLoading(true);
        const [supply_certificate, supply_account_bump] =
          PublicKey.findProgramAddressSync(
            [
              Buffer.from("supply"),
              publicKey.toBuffer(),
              new PublicKey(mint).toBuffer(),
              Buffer.from(randomKey),
            ],
            new PublicKey(PROGRAM_ID)
          );
        const sign = await program.methods
          .addSupply(randomKey, new anchor.BN(amount))
          .accounts({
            userAta: user_ata,
            programAta: new PublicKey(program_ata.ata),
            supplyCertificate: supply_certificate,
            mint: new PublicKey(mint),
            programWallet: program_wallet,
            signer: publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([])
          .rpc();
        setLoading(false);
        onClose();
        reload();
        toast.success("Thank you have added supply succefully");
      } catch (e) {
        console.log("Error", e);
        setLoading(false);
        toast.error("Something went wrong!");
      }
    } else {
      try {
        setLoading(true);
        const user_col_ata = await getWalletAta(
          publicKey,
          new PublicKey(collateralMint)
        );

        const program_col_ata = programWalletDetails.token_col_pdas.find(
          (e: any) => e.token == collateralMint
        );

        const [borrow_certificate, borrow_account_bump] =
          PublicKey.findProgramAddressSync(
            [
              Buffer.from("loan"),
              publicKey.toBuffer(),
              new PublicKey(mint).toBuffer(),
              Buffer.from(randomKey),
            ],
            new PublicKey(PROGRAM_ID)
          );
        const [program_col_wallet, wallet_col_bump] =
          PublicKey.findProgramAddressSync(
            [Buffer.from("collateral")],
            new PublicKey(PROGRAM_ID)
          );

        const [total, current] = await fetchTokenBalance(mint);
        const interest_rate = calculateInterestRate(total, current);

        const sign = await program.methods
          .borrowAmount(
            randomKey,
            new anchor.BN(amount),
            new anchor.BN(collateral),
            wallet_bump,
            new anchor.BN(interest_rate)
          )
          .accounts({
            userColAta: user_col_ata,
            programColAta: new PublicKey(program_col_ata.ata),
            userLoanAta: user_ata,
            programLoanAta: new PublicKey(program_ata.ata),
            borrowCertificate: borrow_certificate,
            mint: new PublicKey(mint),
            colMint: new PublicKey(collateralMint),
            programLoanWallet: program_wallet,
            programColWallet: program_col_wallet,
            signer: publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([])
          .rpc();
        setLoading(false);
        onClose();
        reload();
        toast.success("Congrats! you have borrowed succefully");
      } catch (e) {
        setLoading(false);
        console.log("Error", type, e);
        toast.error("Something went wrong!");
      }
    }
  };

  const fetchTokenBalance = async (mint: string) => {
    const response = await fetch(`/api/supply`);
    const supplies = await response.json();

    const programAta = programWalletDetails.token_pdas.find(
      (e: any) => e.token == mint
    );

    const totalSupplies = (supplies || []).filter(
      (sup: any) => sup.type == "SUPPLY" && sup.mint == mint
    );

    const totalBorrows = (supplies || []).filter(
      (sup: any) => sup.type == "LOAN" && sup.mint == mint
    );

    const totalSupply = totalSupplies
      .filter((e: any) => e.type == "SUPPLY")
      .reduce((accumulator: any, s: any) => accumulator + s.amount, 0);

    const totalLoan = totalBorrows
      .filter((e: any) => e.type == "SUPPLY")
      .reduce((accumulator: any, s: any) => accumulator + s.amount, 0);

    return [totalSupply, totalLoan];
  };

  return (
    <div className="text-center mb-3">
      <div role="status">
        <Button
          color="primary"
          variant={variant}
          startContent={<IoAdd />}
          size="lg"
          onClick={action}
        >
          {label}
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="opaque"
        className="bg-gray-900"
        classNames={{
          backdrop:
            "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-90",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-teal-400">
                {modalTitle}
              </ModalHeader>
              <ModalBody>
                <div className="text-gray-50">
                  <label htmlFor="token">{type !== "SUPPLY" && "Borrow " + "Token"}</label>
                  <TokenSelect
                    selectedMint={mint}
                    selectMint={setMint}
                    disableTokens={[collateralMint]}
                    id="token"
                  ></TokenSelect>
                  <label htmlFor="amount">{type !== "SUPPLY" && "Borrow " + "Amount"}</label>
                  <AmountComponent
                    amount={amount}
                    enterAmount={setAmount}
                    isInvalid={isInvalid}
                    amountMessage={amountMessage}
                    disabled={false}
                    id="amount"
                  ></AmountComponent>
                  <p className="text-default-500 text-small mb-5">
                    {amountMessage && amount && mint && !isInvalid
                      ? amountMessage
                      : ""}
                  </p>
                  {type !== "SUPPLY" && (
                    <>
                      <label htmlFor="col_token">Collateral Token</label>
                      <TokenSelect
                        selectedMint={collateralMint}
                        selectMint={setCollateralMint}
                        disableTokens={[mint]}
                        id="col_token"
                      ></TokenSelect>
                      <label htmlFor="col_amount">{`Collateral Amount Needed (${interestRate}%)`}</label>
                      <AmountComponent
                        amount={collateral}
                        enterAmount={setCollateral}
                        isInvalid={false}
                        amountMessage={colAmountMessage}
                        disabled={true}
                        id="col_amount"
                      ></AmountComponent>
                      <p className="text-default-500 text-small mb-5">
                        {colAmountMessage &&
                        amount &&
                        mint &&
                        collateralMint &&
                        collateral
                          ? colAmountMessage
                          : ""}
                      </p>
                    </>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={onSubmit}
                  isDisabled={isInvalid || !amount || !mint}
                  isLoading={loading}
                >
                  Proceed
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default InteractWithWallet;
