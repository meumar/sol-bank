import "@/styles/globals.css";

import { Metadata, Viewport } from "next";
import clsx from "clsx";
import React from "react";
import { ToastContainer } from "react-toastify";

import { Providers } from "@/app/providers";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

import Topbar from "@/components/Layout/Topbar";
import { WalletContextProvider } from "@/context/WalletContextProvider";
import TokenContextProvider from "@/context/TokensContext/TokenDetailsContextProvider";
import ProgramWalletContextProvider from "@/context/ProgramWalletContext/ProgramWalletContextProvider";

import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <WalletContextProvider>
            <TokenContextProvider>
              <ProgramWalletContextProvider>
                <div className="relative flex flex-col h-screen">
                  <ToastContainer />
                  <main className="container mx-auto max-w-6xl flex-grow p-2">
                    <Topbar />
                    {children}
                  </main>
                </div>
              </ProgramWalletContextProvider>
            </TokenContextProvider>
          </WalletContextProvider>
        </Providers>
      </body>
    </html>
  );
}
