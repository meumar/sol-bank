import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { deserializeTokenMetadata } from "@/utils";

import { TOKENS } from "@/constants";

let connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const GET = async (request: Request) => {
  try {
    const tokenMetadata = await Promise.all(
        TOKENS.map(async (token) => {
        const tokenPublicKey = new PublicKey(token);

        const [[metadataPDA], mintInfo] = await Promise.all([
          PublicKey.findProgramAddress(
            [
              Buffer.from("metadata"),
              MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              tokenPublicKey.toBuffer(),
            ],
            MPL_TOKEN_METADATA_PROGRAM_ID
          ),
          getMint(connection, tokenPublicKey),
        ]);
        let accountInfo: any = deserializeTokenMetadata(
          await connection.getAccountInfo(metadataPDA)
        );
        if (accountInfo?.uri) {
          const res = await fetch(accountInfo.uri);
          accountInfo = {
            ...accountInfo,
            ...{
                decimals: mintInfo.decimals,
                supply: Number(mintInfo.supply)
            },
            ...(await res.json()),
          };
        }
        return accountInfo;
      })
    );
    return Response.json(tokenMetadata);
  } catch (e) {
    return Response.json([]);
  }
};

export { GET };
