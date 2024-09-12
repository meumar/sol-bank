"use client";
import React, { useEffect, useState } from "react";

import TokenContext from "./TokenDetailsContext";


const TokenContextProvider = ({ children }: any) => {
    const [tokens, setTokens] = useState<any[]>([]);

    const getTokens = async () => {
        const response = await fetch("/api/tokens");
        const responseTokens = await response.json();
        setTokens(responseTokens);
    }

    useEffect(() => {
        getTokens();
    }, [])

    return (
        <TokenContext.Provider value={tokens}>
            {children}
        </TokenContext.Provider>
    )
};

export default TokenContextProvider;