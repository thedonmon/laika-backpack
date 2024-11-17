"use client";

import { useMemo } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet styles
import "@solana/wallet-adapter-react-ui/styles.css";

export default function BackpackWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = process.env.NEXT_PUBLIC_NETWORK as WalletAdapterNetwork || WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl(network),
    [network]
  );

  // The wallet standard adapters will automatically detect available wallets
  const wallets = useMemo(
    () => [],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 