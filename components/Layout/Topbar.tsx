"use client";
import Link from "next/link";
import WalletButton from "../walletButton";

export default function Topbar() {
  return (
    <nav className="border-gray-200 dark:bg-black h-100%">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <a
            href="/"
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-teal-400">
              SOL-BANK
            </span>
          </a>
        </div>
        <div className="flex gap-3">
          <ul className="font-medium flex p-4 flex-row md:space-x-8 bg-black">
            <li>
              <Link href="/" className="block py-2 text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="block py-2 text-white">
                About
              </Link>
            </li>
            <li>
              <div
                className="cursor-pointer block py-2 px-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white md:dark:text-blue-500"
                aria-current="page"
              >
                <WalletButton />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
