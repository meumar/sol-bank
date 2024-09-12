import { Input } from "@nextui-org/input";

const AmountComponent = ({
  amount,
  enterAmount,
  isInvalid = false,
  amountMessage = "",
  disabled = false
}: {
  amount: any;
  enterAmount: any;
  isInvalid: boolean;
  amountMessage: string;
  disabled: boolean
}) => {
  return (
    <main>
      <Input
        type="number"
        variant="bordered"
        value={amount}
        onChange={(evt) => {
          enterAmount(Number(evt.target.value));
        }}
        className="text-gray-50"
        isInvalid={isInvalid}
        color={isInvalid ? "danger" : "primary"}
        placeholder="Amount"
        isClearable
        size="lg"
        onClear={() => enterAmount(0)}
        errorMessage={amountMessage}
        readOnly={disabled}
      />
    </main>
  );
};

export default AmountComponent;
