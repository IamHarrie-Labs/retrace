"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { useRunTransaction, type Balance } from "@/components/use-transaction";
import { useSession } from "@/components/session";
import { Button, Card, inputCls, Label, short, Ext, suiscan } from "@/components/ui";
import { BrandMark } from "@/components/brand";
import { WalletConnect } from "@/components/wallet-connect";
import { requestJson } from "@/lib/client-api";
import { useBrowserStorage } from "@/lib/browser-storage";
import { LAPTOP_MODELS } from "@/lib/models";
import type { FollowupDue } from "@/lib/summary";

type Passport = { id: string; make: string; model: string; category: string; createdAtMs: number; records: number | null; followupsDue: FollowupDue[] };
const PACKAGE_ID = process.env.NEXT_PUBLIC_RETRACE_PACKAGE_ID;
const REGISTRY_ID = process.env.NEXT_PUBLIC_RETRACE_REGISTRY_ID;
const OTHER = "__other__";
const hexToBytes = (hex: string) => hex.match(/../g)!.map((b) => parseInt(b, 16));
function dueLabel(f: FollowupDue) {
  const days = Math.ceil((new Date(f.dueAt).getTime() - Date.now()) / 86_400_000);
  return f.overdue ? "Follow-up due now" : `Follow-up in ${days} ${days === 1 ? "day" : "days"}`;
}

export default function Devices() {
  const session = useSession();
  const account = useCurrentAccount();
  return <DevicesContent key={`${account?.address ?? "visitor"}:${session.address ?? "unsigned"}`} />;
}

function DevicesContent() {
  const account = useCurrentAccount();
  const s = useSession();
  const signedIn = !!account && !!s.address && !s.needsSignIn && !s.loading;
  const [passports, setPassports] = useState<Passport[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const requestVersion = useRef({ version: 0 });
  const load = useCallback(() => {
    const version = ++requestVersion.current.version;
    return requestJson<{passports: Passport[]}>("/api/passports").then(data => {
      if (version === requestVersion.current.version) { setPassports(data.passports); setErr(null); }
    }, error => {
      if (version === requestVersion.current.version) setErr(error instanceof Error ? error.message : "Unable to load devices. Please try again.");
    });
  }, []);
  useEffect(() => {
    const tracker = requestVersion.current;
    if (signedIn) void load();
    return () => { tracker.version++; };
  }, [signedIn, s.address, load]);

  const overdue = !!passports?.some((p) => p.followupsDue.some((f) => f.overdue));

  return (
    <div className="product-page space-y-10">
      <section className="device-page-heading">
        <div className="page-heading"><h1>Your laptops<br /><em>and their history.</em></h1><p>Open a passport to see what has happened to a laptop,<br className="desktop-break" /> or register a new one.</p></div>
        <Link href="/demo" className="text-link">Explore a sample device ↗</Link>
      </section>

      {!account && <div className="signin-panel"><div className="signin-panel-copy"><h2>Sign in to see<br />your laptops.</h2><p className="mb-6 text-sm leading-7 text-muted">Connect a Sui wallet to register a laptop or open one you already own. You can use Google instead if the button is there. Then you sign a short message, which proves the account is yours and costs nothing.</p><WalletConnect /><p className="mt-5 text-xs text-muted">Just looking? <Link href="/demo" className="underline underline-offset-4">See the example, no wallet needed.</Link></p></div><div className="signin-panel-art"><BrandMark /></div></div>}
      {account && !signedIn && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Sign a message to prove this wallet is yours. It is free and moves no funds.</p>
          <Button onClick={s.signIn} disabled={s.signingIn}>{s.signingIn ? "Check your wallet…" : "Sign in"}</Button>
        </Card>
      )}

      {signedIn && (
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <Label>Your devices</Label>
              <button onClick={() => { setErr(null); void load(); }} className="text-xs text-muted hover:text-ink">Refresh</button>
            </div>
            {err && <div role="alert"><p className="text-sm text-warn">{err}</p><Button className="mt-3" variant="ghost" onClick={() => { setErr(null); void load(); }}>Try again</Button></div>}
            {!passports && !err && <div role="status" aria-label="Loading your devices"><div className="skeleton" /><div className="skeleton short" /><p className="text-sm text-muted">Reading your device passports…</p></div>}
            {passports?.length === 0 && <p className="text-sm text-muted">No laptops yet. Register one below to start its history.</p>}
            {overdue && <p className="mb-2 rounded-sm border border-warn/40 bg-warn/5 p-3 text-sm">One of your repairs is due a check-in. Did the fix hold? Your answer improves the advice for everyone with this model.</p>}
            <ul className="divide-y divide-line">
              {passports?.map((p) => (
                <li key={p.id}>
                  <Link href={p.followupsDue[0] ? `/passport/${p.id}?followup=${p.followupsDue[0].recordId}#add-record` : `/passport/${p.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                    <span>
                      <span className="font-medium">{p.make} {p.model}</span>
                      <span className="ml-2 text-xs text-muted">{p.records == null ? p.category : `${p.records} ${p.records === 1 ? "record" : "records"}`}</span>
                      {p.followupsDue[0] && <span className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${p.followupsDue[0].overdue ? "border-warn/50 text-warn" : "border-line text-muted"}`} title={`How did "${p.followupsDue[0].action}" hold up?`}>{dueLabel(p.followupsDue[0])}</span>}
                    </span>
                    <span className="font-mono text-xs text-muted">{short(p.id, 8)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <MintCard onMinted={load} />
        </div>
      )}
    </div>
  );
}

function MintCard({ onMinted }: { onMinted: () => void }) {
  const account = useCurrentAccount();
  const storageKey = `retrace:pending-mint:${account?.address || "disconnected"}`;
  const dAppKit = useDAppKit();
  const runTx = useRunTransaction();
  const [isPending, setPending] = useState(false);
  const [make, setMake] = useState("Lenovo");
  const [model, setModel] = useState("ThinkPad T480");
  const [customModel, setCustomModel] = useState("");
  const [serial, setSerial] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<string | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pendingDigest, setSubmittedDigest] = useBrowserStorage(storageKey);
  const submittedDigest = pendingDigest && /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(pendingDigest) ? pendingDigest : null;
  const finalModel = model === OTHER ? customModel.trim() : model;

  useEffect(() => { requestJson<Balance>("/api/balance").then(setBalance, () => setBalance(null)); }, []);

  if (!PACKAGE_ID || !REGISTRY_ID) {
    return <Card><Label>Register a device</Label><p className="text-sm text-muted">Device registration is temporarily unavailable. Please try again later.</p></Card>;
  }

  async function mint() {
    if (isPending) return;
    setMsg(null); setDuplicate(null); setPending(true);
    let digest = submittedDigest;
    try {
      if (!digest) {
        if (!make.trim() || !finalModel || !serial.trim() || finalModel.length > 120) throw new Error("Choose a manufacturer and model, and enter the serial number.");
        setMsg("Checking the Sui registry for this serial number…");
        const { hash, registered } = await requestJson<{ hash: string; registered: string | null }>("/api/serial", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ make: make.trim(), serial }),
        });
        if (registered) { setDuplicate(registered); setMsg(null); return; }
        const tx = new Transaction();
        tx.moveCall({ target: `${PACKAGE_ID}::passport::mint`, arguments: [tx.object(REGISTRY_ID!), tx.pure.string("laptop"), tx.pure.string(make.trim()), tx.pure.string(finalModel), tx.pure.vector("u8", hexToBytes(hash)), tx.object.clock()] });
        setMsg(balance?.sponsored ? "Approve in your wallet. Retrace pays the network fee." : "Approve the transaction in your wallet…");
        digest = await runTx(tx, !!balance?.sponsored); setSubmittedDigest(digest);
      }
      setMsg(`Submitted ${short(digest)}. Waiting for Tatum to confirm the passport…`);
      const confirmed = await dAppKit.getClient().core.waitForTransaction({ digest, timeout: 45_000 });
      if (confirmed.$kind === "FailedTransaction") { setSubmittedDigest(null); throw new Error("The registration failed onchain. This serial may already be registered."); }
      setMsg(`Passport confirmed. Transaction: ${short(digest)}.`); setSubmittedDigest(null); setSerial(""); onMinted();
    } catch (error) { setMsg(`${error instanceof Error ? error.message : "Could not register the passport."}${digest ? " A transaction was submitted. Check its confirmation before registering again." : ""}`); }
    finally { setPending(false); }
  }

  const locked = isPending || !!submittedDigest;
  return (
    <Card>
      <Label>Register a laptop</Label>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void mint(); }}>
        <div><label htmlFor="device-make">Manufacturer</label>
          <select id="device-make" disabled={locked} className={inputCls} value={make} onChange={(e) => { setMake(e.target.value); setModel(LAPTOP_MODELS[e.target.value]?.[0] ?? OTHER); }}>
            {Object.keys(LAPTOP_MODELS).map((m) => <option key={m}>{m}</option>)}
          </select></div>
        <div><label htmlFor="device-model">Model</label>
          <select id="device-model" disabled={locked} className={inputCls} value={model} onChange={(e) => setModel(e.target.value)}>
            {(LAPTOP_MODELS[make] ?? []).map((m) => <option key={m}>{m}</option>)}
            <option value={OTHER}>Another model…</option>
          </select>
          {model === OTHER && <input aria-label="Model name" maxLength={120} disabled={locked} className={`${inputCls} mt-2`} value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Model as printed on the device" />}
          {model === OTHER && <p className="mt-1 text-xs text-muted">If your model isn&apos;t listed, it still gets its own history. It just won&apos;t swap tips with other owners of the same model yet.</p>}
        </div>
        <div><label htmlFor="device-serial">Serial number</label><input id="device-serial" maxLength={120} disabled={locked} className={inputCls} value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="On the label underneath, e.g. PF-1ABC23" autoComplete="off" required />
          <p className="mt-1 text-xs text-muted">The serial number never goes on the blockchain. Retrace stores a scrambled fingerprint of it instead, and each serial can only be registered once.</p></div>
        {balance && <p className="text-xs text-muted">{balance.sponsored ? "Network fees are covered by Retrace." : <>Wallet balance {balance.sui.toFixed(3)} SUI (read via Tatum){!balance.enough && <span className="text-warn">. You need about 0.01 SUI for the network fee.</span>}</>}</p>}
        <Button type="submit" disabled={isPending || (!submittedDigest && (!make.trim() || !finalModel || !serial.trim()))} className="w-full">
          {isPending ? "Registering…" : submittedDigest ? "Check confirmation" : "Create the passport"}
        </Button>
        {duplicate && <div role="alert" className="rounded-sm border border-warn/40 p-3 text-sm">This laptop already has a passport. Its history stays with it, so ask the current holder to hand it over to you. <Link className="underline" href={`/passport/${duplicate}`}>View its public summary</Link></div>}
        {submittedDigest && <p className="text-xs">A registration is awaiting confirmation. <Ext href={suiscan.tx(submittedDigest)}>Inspect the submitted transaction</Ext></p>}
        {msg && <p className="save-status" role="status">{msg}</p>}
      </form>
    </Card>
  );
}
