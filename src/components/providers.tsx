"use client";

import { createDAppKit, DAppKitProvider } from "@mysten/dapp-kit-react";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { enokiWalletsInitializer } from "@mysten/enoki";
import { useState } from "react";

// Sui retired JSON-RPC on Mainnet. The wallet's client talks GraphQL to our
// /api/graphql proxy, which forwards to Tatum's Sui gateway.
const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
export const googleSignInEnabled = !!(ENOKI_API_KEY && GOOGLE_CLIENT_ID);

function makeDAppKit() {
  return createDAppKit({
    networks: ["mainnet"],
    defaultNetwork: "mainnet",
    autoConnect: true,
    // "Sign in with Google" (zkLogin via Enoki): a Sui address without installing a wallet.
    // Enabled only when both public keys are configured.
    walletInitializers: ENOKI_API_KEY && GOOGLE_CLIENT_ID
      ? [enokiWalletsInitializer({ apiKey: ENOKI_API_KEY, providers: { google: { clientId: GOOGLE_CLIENT_ID } } })]
      : [],
    // Dev-only test wallet (never in production builds): lets us exercise sign-in and access checks without an extension.
    enableBurnerWallet: process.env.NODE_ENV === "development",
    createClient: () =>
      new SuiGraphQLClient({
        url: typeof window === "undefined" ? "http://localhost/api/graphql" : `${window.location.origin}/api/graphql`,
        network: "mainnet",
      }),
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [dAppKit] = useState(makeDAppKit);
  return <DAppKitProvider dAppKit={dAppKit}>{children}</DAppKitProvider>;
}

/** Throws if the wallet reports a failed execution; returns the digest. */
export function digestOf(res: { $kind: string; Transaction?: { digest: string }; FailedTransaction?: { digest: string } }) {
  if (res.$kind === "FailedTransaction") throw new Error(`Transaction failed onchain (${res.FailedTransaction?.digest ?? "no digest"})`);
  return res.Transaction!.digest;
}
