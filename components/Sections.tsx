import React from "react";
import { Tabs, Tab } from "@nextui-org/tabs";
import Supply from "./UI/Supply";
import Borrow from "./UI/Borrow";

export default function SectionsTabs() {
  return (
    <main className="flex w-full flex-col mt-5">
      <Tabs
        aria-label="Options"
        color="primary"
        variant="underlined"
        className="self-center"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-teal-400",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-teal-400",
        }}
      >
        <Tab key="loan" title="Your borrow">
          <Borrow />
        </Tab>
        <Tab key="supply" title="Your supply">
          <Supply />
        </Tab>
      </Tabs>
    </main>
  );
}
