"use client";
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
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white md:dark:text-blue-500"
                aria-current="page"
              >
                <WalletButton />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
