import { User } from "@nextui-org/user";

const TokenDetails = ({ token }: { token: any }) => {
  return (
    <main className="">
      <User
        avatarProps={{ radius: "full", src: token.image }}
        description={token.description}
        name={token.name}
      >
        {token.name}
      </User>
    </main>
  );
};

export default TokenDetails;
