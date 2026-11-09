"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useSession } from "@/components/session";
import { WalletConnect } from "@/components/wallet-connect";
import { SummaryCard } from "@/components/passport-extras";
import { Button, Card, Label, short } from "@/components/ui";
import { requestJson } from "@/lib/client-api";
import type { PublicSummary } from "@/lib/summary";

type Preview = { passport: { id: string; make: string; model: string; owner: string }; summary: PublicSummary; claimedBy: string | null; viewer: string | null };

/** Buyer side of a handover: open the link, sign in, claim. The seller then transfers in one click. */
export default function ClaimPage() {
  const { token } = useParams<{ token: string }>();
  const account = useCurrentAccount();
  const s = useSession();
  const [data, setData] = useState<Preview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(() => requestJson<Preview>(`/api/handover?token=${encodeURIComponent(token)}`).then(setData, (e) => setErr(e instanceof Error ? e.message : "This link could not be opened.")), [token]);
  useEffect(() => { void load(); }, [load, s.address]);

  async function claim() {
    setBusy(true); setErr(null);
    try {
      await requestJson("/api/handover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      setDone(true); void load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not claim this device."); }
    finally { setBusy(false); }
  }

  const mine = !!data && !!s.address && data.claimedBy === s.address;
  return (
    <div className="product-page mx-auto max-w-2xl space-y-6">
      <div>
        <Label>Device handover</Label>
        <h1 className="text-3xl font-semibold tracking-tight">{data ? `${data.passport.make} ${data.passport.model}` : err ? "This link can’t be opened." : "Opening the handover…"}</h1>
        {data && <p className="mt-1 text-sm text-muted">Offered by <span className="font-mono">{short(data.passport.owner)}</span>. When the seller confirms, this laptop&apos;s full repair history moves to you.</p>}
      </div>
      {err && <Card><p role="alert" className="text-sm text-warn">{err}</p></Card>}
      {data && <SummaryCard summary={data.summary} />}
      {data && (
        <Card>
          <ol className="space-y-3 text-sm">
            <li className={account ? "text-muted line-through" : ""}>1. Connect a wallet{" "}(or sign in with Google, if offered).</li>
            <li className={s.address ? "text-muted line-through" : ""}>2. Sign a free message to prove the account is yours.</li>
            <li className={mine ? "text-muted line-through" : ""}>3. Claim the device. The seller sees your account and confirms the transfer.</li>
          </ol>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!account && <WalletConnect />}
            {account && s.needsSignIn && <Button onClick={s.signIn} disabled={s.signingIn}>{s.signingIn ? "Check your wallet…" : "Sign in"}</Button>}
            {s.address && !mine && !data.claimedBy && <Button onClick={claim} disabled={busy}>{busy ? "Claiming…" : "Claim this device"}</Button>}
          </div>
          {data.claimedBy && !mine && <p className="mt-3 text-sm text-warn">Another account has already claimed this link. Ask the seller for a new one if that wasn&apos;t you.</p>}
          {(mine || done) && (
            <div className="mt-4 rounded-sm border border-good/40 bg-good/5 p-3 text-sm">
              <b>You&apos;re on the list.</b> The seller now sees your account and can transfer the passport. Once it confirms, the full history and advice open for you under <Link href="/devices" className="underline">My devices</Link>.
              <div className="mt-2"><Link className="text-link" href={`/passport/${data.passport.id}`}>Open the passport →</Link></div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
