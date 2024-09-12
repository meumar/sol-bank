"use client";
import { useRef } from "react";

import Balance from "@/components/UI/Balance";
import InteractWithWallet from "@/components/UI/InteractWithPool";
import TokenTableComponent from "@/components/UI/TokenTable";
import SectionsTabs from "@/components/Sections";

export default function Home() {
  const ref: any = useRef();

  const reload = () => {
    ref.current.refreshTable();
  };
  return (
    <section className="mt-5">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Balance />
        </div>
        <div className="flex gap-3">
          <InteractWithWallet
            type="BORROW"
            variant="bordered"
            reload={reload}
          />
          <InteractWithWallet type="SUPPLY" variant="solid" reload={reload} />
        </div>
      </div>
      <div className="my-5">
        <TokenTableComponent ref={ref} />
      </div>
      <div>
        <SectionsTabs></SectionsTabs>
      </div>
    </section>
  );
}
