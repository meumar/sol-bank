import React, {
  useContext,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/table";

import { Chip } from "@nextui-org/chip";
import { Spinner } from "@nextui-org/spinner";

import TokenContext from "@/context/TokensContext/TokenDetailsContext";
import ProgramWalletContext from "@/context/ProgramWalletContext/ProgramWalletContext";

import { useConnection } from "@solana/wallet-adapter-react";

import TokenDetails from "./TokenDetails";
import { fromDecimals } from "@/utils";

const columns = [
  {
    label: "Token",
    key: "name",
  },
  {
    label: "Total Supply",
    key: "total_supply",
  },
  {
    label: "Pool Balance",
    key: "pool_balance",
  },
  {
    label: "Collateral Balance",
    key: "collateral_balance",
  },
];

const statusColorMap: any = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

const TokenTable = forwardRef((props, ref) => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const savedTokens: any = useContext(TokenContext);
  const programWalletDetails: any = useContext(ProgramWalletContext);

  const { connection } = useConnection();

  useEffect(() => {
    (async () => {
      fetchTokens();
    })();
  }, [savedTokens]);
  useImperativeHandle(ref, () => ({
    refreshTable() {
      fetchTokens(true);
    },
  }));

  const fetchTokens = async (refresh = false) => {
    if ((savedTokens.length && !tokens.length) || refresh) {
      setLoading(true);
      setTokens([]);
      const response = await fetch(`/api/supply`);
      const supplies = await response.json();
      let mappedTokens = await Promise.all(
        savedTokens.map(async (token: any) => {
          const programAta = programWalletDetails.token_pdas.find(
            (e: any) => e.token == token.mint
          );
          const programColAta = programWalletDetails.token_col_pdas.find(
            (e: any) => e.token == token.mint
          );

          const [programValue, programColValue] = await Promise.all([
            connection.getTokenAccountBalance(programAta.ata),
            connection.getTokenAccountBalance(programColAta.ata),
          ]);
          const totalSupplies = (supplies || []).filter(
            (sup: any) => sup.mint == token.mint
          );
          token.total_supplies = totalSupplies.filter(
            (e: any) => e.type == "SUPPLY"
          );
          token.total_supply = totalSupplies
            .filter((e: any) => e.type == "SUPPLY")
            .reduce((accumulator: any, s: any) => accumulator + s.amount, 0);

          token.collateral_balance = programColValue.value.amount;
          token.pool_balance = programValue.value.amount;
          return token;
        })
      );
      setTokens(mappedTokens);
      setLoading(false);
    }
  };

  const getDecimalValue = (n: number, d: number) => {
    return Number(n || 0).toFixed(d);
  };

  const renderCell = React.useCallback((token: any, columnKey: any) => {
    const cellValue = token[columnKey];

    switch (columnKey) {
      case "name":
        return <TokenDetails token={token}></TokenDetails>;
      case "your_balance":
        return (
          <div className="flex flex-col gap-1">
            <Chip
              color="success"
              className="text-bold text-sm capitalize"
              size="sm"
            >
              {token.your_supply > 0 ? "+" : ""}
              {getDecimalValue(
                fromDecimals(token.your_supply, token.decimals),
                token.decimals
              )}{" "}
              {token.symbol}
            </Chip>
            <Chip
              color="danger"
              className="text-bold text-sm capitalize"
              size="sm"
            >
              {token.your_loan > 0 ? "-" : ""}
              {getDecimalValue(
                fromDecimals(token.your_loan, token.decimals),
                token.decimals
              )}{" "}
              {token.symbol}
            </Chip>
          </div>
        );
      case "balance":
      case "pool_balance":
      case "collateral_balance":
      case "total_supply":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">
              {getDecimalValue(
                fromDecimals(cellValue, token.decimals),
                token.decimals
              )}{" "}
              {token.symbol}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[token.status]}
            size="sm"
            variant="flat"
          >
            {cellValue}
          </Chip>
        );
      default:
        return cellValue;
    }
  }, []);
  return (
    <main>
      <Table
        aria-label="Example table with custom cells"
        removeWrapper
        selectionMode="none"
        className="bg-slate-800 rounded-lg p-5"
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              align={column.key === "actions" ? "center" : "start"}
              className="bg-slate-900 text-gray-100 text-base"
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={tokens}
          isLoading={loading}
          loadingContent={
            <Spinner label="Loading..." color="primary" labelColor="primary" />
          }
        >
          {(item: any) => (
            <TableRow key={item.mint}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </main>
  );
});

TokenTable.displayName = "TokenTable";

export default TokenTable;
