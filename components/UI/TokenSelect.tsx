import { useContext } from "react";
import { Select, SelectItem } from "@nextui-org/select";

import TokenDetails from "./TokenDetails";
import TokenContext from "@/context/TokensContext/TokenDetailsContext";

const TokenSelect = ({
  selectedMint,
  selectMint,
  disableTokens = [],
  id
}: {
  selectedMint: string;
  selectMint: any;
  disableTokens: any[];
  id: string
}) => {
  const tokens: any = useContext(TokenContext);

  return (
    <main>
      <Select
        items={tokens}
        color="primary"
        variant="bordered"
        className="text-gray-950 mb-5"
        placeholder="Select an token"
        value={selectedMint}
        id={id}
        onChange={(ent) => {
          selectMint(ent.target.value);
        }}
        classNames={{
          label: "group-data-[filled=true]:-translate-y-5",
          trigger: "min-h-16 pt-3",
          listboxWrapper: "max-h-[400px]",
        }}
        listboxProps={{
          itemClasses: {
            base: [
              "rounded-md",
              "text-default-500",
              "transition-opacity",
              "data-[hover=true]:text-foreground",
              "data-[hover=true]:bg-default-100",
              "dark:data-[hover=true]:bg-default-50",
              "data-[selectable=true]:focus:bg-default-50",
              "data-[pressed=true]:opacity-70",
              "data-[focus-visible=true]:ring-default-500",
            ],
          },
        }}
        popoverProps={{
          classNames: {
            base: "before:bg-default-200",
            content: "p-0 border-small border-divider bg-background",
          },
        }}
        renderValue={(items) => {
          return items.map((token: any) => (
            <div className="flex gap-2 items-center" key={token.key}>
              <TokenDetails token={token.data}></TokenDetails>
            </div>
          ));
        }}
        disabledKeys={disableTokens}
      >
        {(token: any) => (
          <SelectItem
            key={token.mint}
            className="text-gray-900"
            textValue={token.name}
          >
            <div className="flex gap-2 items-center">
              <TokenDetails token={token}></TokenDetails>
            </div>
          </SelectItem>
        )}
      </Select>
    </main>
  );
};

export default TokenSelect;
