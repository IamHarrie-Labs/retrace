"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { digestOf } from "@/components/providers";
import { Transaction } from "@mysten/sui/transactions";
import { useSession } from "@/components/session";
import { Button, Card, inputCls, Label, short } from "@/components/ui";

type Passport = { id: string; make: string; model: string; category: string; createdAtMs: number };
const PACKAGE_ID = process.env.NEXT_PUBLIC_RETRACE_PACKAGE_ID;

async function sha256(text: string): Promise<number[]> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text.trim().toUpperCase()));
  return [...new Uint8Array(buf)];
}

export default function Home() {
  const account = useCurrentAccount();
  const s = useSession();
  const signedIn = !!s.address && !s.needsSignIn;
  const [passports, setPassports] = useState<Passport[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/passports");
    const d = await r.json();
    if (d.error) setErr(d.error);
    else setPassports(d.passports);
  }, []);

  useEffect(() => {
    if (signedIn) load();
    else setPassports(null);
  }, [signedIn, load]);

  return (
    <div className="space-y-10">
      <section className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          <p className="mb-3 text-sm font-medium text-accent">Repair memory for second-hand laptops</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Know what&apos;s been tried
            <br />
            before you try it again.
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            Every repair teaches someone something. Retrace keeps that lesson with the device, changes the next
            diagnosis because of it, and hands it to the next owner when the device is sold.
          </p>
        </div>
        <Card>
          <Label>How it works</Label>
          <ol className="space-y-3 text-sm">
            <li><b className="text-ink">1 · Passport.</b> <span className="text-muted">The device gets a Sui object. Its ID never changes.</span></li>
            <li><b className="text-ink">2 · Memory.</b> <span className="text-muted">Symptoms, tests, repairs and outcomes are written to Walrus Memory, labelled by who said it and how.</span></li>
            <li><b className="text-ink">3 · Learning.</b> <span className="text-muted">A fix that didn&apos;t hold lowers confidence in that cause; the next recommendation changes.</span></li>
            <li><b className="text-ink">4 · Hand-over.</b> <span className="text-muted">Transfer the passport. Tatum reads the new owner from Sui; access moves with it.</span></li>
          </ol>
        </Card>
      </section>

      {!account && <Card><p className="text-sm text-muted">Connect a Sui wallet to see your devices.</p></Card>}
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
              <button onClick={load} className="text-xs text-muted hover:text-ink">Refresh</button>
            </div>
            {err && <p className="text-sm text-warn">{err}</p>}
            {!passports && !err && <p className="text-sm text-muted">Reading your passports from Sui via Tatum…</p>}
            {passports?.length === 0 && <p className="text-sm text-muted">No devices yet. Register one to start its memory.</p>}
            <ul className="divide-y divide-line">
              {passports?.map((p) => (
                <li key={p.id}>
                  <Link href={`/passport/${p.id}`} className="flex items-center justify-between py-3 hover:text-accent">
                    <span>
                      <span className="font-medium">{p.make} {p.model}</span>
                      <span className="ml-2 text-xs text-muted">{p.category}</span>
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
  const dAppKit = useDAppKit();
  const [isPending, setPending] = useState(false);
  const [make, setMake] = useState("Lenovo");
  const [model, setModel] = useState("ThinkPad T480");
  const [serial, setSerial] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  if (!PACKAGE_ID) {
    return <Card><Label>Register a device</Label><p className="text-sm text-warn">Set NEXT_PUBLIC_RETRACE_PACKAGE_ID after publishing the Move package.</p></Card>;
  }

  async function mint() {
    setMsg(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::passport::mint`,
        arguments: [
          tx.pure.string("laptop"),
          tx.pure.string(make.trim()),
          tx.pure.string(model.trim()),
          tx.pure.vector("u8", await sha256(serial)),
          tx.object.clock(),
        ],
      });
      setPending(true);
      const digest = digestOf(await dAppKit.signAndExecuteTransaction({ transaction: tx }));
      setMsg(`Passport minted (tx ${short(digest)}). It can take a few seconds to appear.`);
      setTimeout(onMinted, 2500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Mint failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <Label>Register a laptop</Label>
      <div className="space-y-3">
        <input className={inputCls} value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" />
        <input className={inputCls} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" />
        <input className={inputCls} value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Serial number (only its hash goes onchain)" />
        <Button onClick={mint} disabled={isPending || !make || !model || !serial} className="w-full">
          {isPending ? "Confirm in wallet…" : "Mint device passport"}
        </Button>
        {msg && <p className="text-xs text-muted">{msg}</p>}
      </div>
    </Card>
  );
}
