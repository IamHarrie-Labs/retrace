"use client";

import dynamic from "next/dynamic";

// The wallet UI registers browser-only custom elements at import time.
// Keep it behind a client-only boundary so server rendering never touches window.
export const WalletConnect = dynamic(
  () => import("@mysten/dapp-kit-react/ui").then(mod => mod.ConnectButton),
  { ssr: false, loading: () => <button className="header-cta" disabled aria-busy="true">Loading wallet…</button> },
);
