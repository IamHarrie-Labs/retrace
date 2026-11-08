"use client";
import { useCallback } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";
import { digestOf } from "./providers";
import { requestJson } from "@/lib/client-api";

/**
 * Run a Retrace transaction. When the server has gas sponsorship (Enoki) enabled,
 * the app pays the gas and the user only signs; otherwise the wallet pays as usual.
 */
export function useRunTransaction() {
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  return useCallback(async (tx: Transaction, sponsored: boolean): Promise<string> => {
    if (sponsored && account) {
      tx.setSenderIfNotSet(account.address);
      const kind = await tx.build({ client: dAppKit.getClient(), onlyTransactionKind: true });
      const { bytes, digest } = await requestJson<{ bytes: string; digest: string }>("/api/sponsor", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ transactionKindBytes: toBase64(kind) }),
      });
      const { signature } = await dAppKit.signTransaction({ transaction: Transaction.from(bytes) });
      await requestJson("/api/sponsor/execute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ digest, signature }) });
      return digest;
    }
    return digestOf(await dAppKit.signAndExecuteTransaction({ transaction: tx }));
  }, [dAppKit, account]);
}

export type Balance = { sui: number; enough: boolean; sponsored: boolean };
