import {
  PublicKey,
  Connection,
  clusterApiUrl,
  GetProgramAccountsConfig,
} from "@solana/web3.js";
import { PROGRAM_ID } from "@/constants";
import {
  deserializePoolBorrowDetails,
  deserializePoolSupplyDetails,
} from "@/utils";

let connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const filterWallets = async (filterWallets: any, accountType: any) => {
  try {
    let accounts: any = [];
    await Promise.all(
      filterWallets.map(async ({ pubkey, account }: any) => {
        try {
          const { type, user, mint, amount, timestamp, differenceDays } =
            deserializePoolSupplyDetails(account);
          let data: any = {
            type,
            user,
            mint,
            amount,
            timestamp,
            differenceDays,
            address: pubkey.toBase58(),
          };
          if (type == "LOAN") {
            const { coll_mint, coll_amount, status, interest_rate } =
              deserializePoolBorrowDetails(account);
            data["coll_mint"] = coll_mint;
            data["coll_amount"] = coll_amount;
            data["status"] = status;
            data["interest_rate"] = interest_rate;
          }

          if (!accountType || accountType.toUpperCase() == type) {
            accounts.push(data);
          }
        } catch (e) {}
        return pubkey;
      })
    );
    return accounts;
  } catch (error) {
    return [];
  }
};

const GET = async (request: Request) => {
  try {
    const type = request.url.split("type=")[1];

    const config: GetProgramAccountsConfig = {
      filters: [
        // {
        //   memcmp: {
        //     offset: 0,
        //     bytes: params.wallet_address,
        //   },
        // },
      ],
    };
    let accounts = await connection.getProgramAccounts(
      new PublicKey(PROGRAM_ID),
      config
    );
    let filteredAccounts = await filterWallets(accounts, type);
    return Response.json(filteredAccounts);
  } catch (e) {
    return Response.json([]);
  }
};

export { GET };
