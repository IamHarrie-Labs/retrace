"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { WalletConnect } from "@/components/wallet-connect";
import { Button, Card, Ext, inputCls, Label, Pill, short, walruscanBlob } from "@/components/ui";
import { requestJson } from "@/lib/client-api";
import { FAMILIES } from "@/lib/diagnose";
import type { RepairRecord } from "@/lib/records";

type View = { device: string; passportId: string; record: Omit<RepairRecord, "author">; attested: { shop: string; signer: string; signedAt: string } | null };

/** The repair shop co-signs one record with its own wallet. It sees only that record. */
export default function AttestPage() {
  const { token } = useParams<{ token: string }>();
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [data, setData] = useState<View | null>(null);
  const [shop, setShop] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);

  const load = useCallback(() => requestJson<View>(`/api/attest?token=${encodeURIComponent(token)}`).then((v) => { setData(v); if (v.record.by) setShop((s) => s || v.record.by!); }, (e) => setErr(e instanceof Error ? e.message : "This link could not be opened.")), [token]);
  useEffect(() => { void load(); }, [load]);

  async function sign() {
    if (!account) return;
    setBusy(true); setErr(null);
    try {
      const base = { token, shop: shop.trim(), address: account.address };
      const { message } = await requestJson<{ message: string }>("/api/attest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...base, prepare: true }) });
      const { signature } = await dAppKit.signPersonalMessage({ message: new TextEncoder().encode(message) });
      const r = await requestJson<{ blobId: string }>("/api/attest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...base, signature }) }, 120_000);
      setReceipt(r.blobId); void load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not record the verification."); }
    finally { setBusy(false); }
  }

  const r = data?.record;
  const cause = r?.hypothesis ? FAMILIES[r.family].hypotheses.find((h) => h.key === r.hypothesis)?.label : null;
  return (
    <div className="product-page mx-auto max-w-2xl space-y-6">
      <div>
        <Label>Shop verification</Label>
        <h1 className="text-3xl font-semibold tracking-tight">Verify a repair record</h1>
        <p className="mt-1 text-sm text-muted">The owner of this {data?.device ?? "device"} asked you to confirm a record of your work. You see only this record. Signing is free and moves no funds.</p>
      </div>
      {err && <Card><p role="alert" className="text-sm text-warn">{err}</p></Card>}
      {r && (
        <Card>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="uppercase tracking-wider">{r.kind}</span><span>{new Date(r.createdAt).toLocaleDateString()}</span>
            <Pill>{r.outcome.replace("_", " ")}</Pill><Pill>{r.role} · {r.evidence}</Pill>
          </div>
          <p className="mt-2">{r.action}</p>
          <p className="mt-1 text-xs text-muted">{cause && <>About: {cause} · </>}{r.costUsd != null && <>${r.costUsd} · </>}{r.by && <>Recorded shop: {r.by}</>}</p>
        </Card>
      )}
      {data?.attested ? (
        <Card className="border-good/40">
          <p className="text-sm"><Pill tone="good">✓ Verified</Pill> by <b>{data.attested.shop}</b> ({short(data.attested.signer)}) on {new Date(data.attested.signedAt).toLocaleDateString()}.</p>
          {receipt && <p className="mt-2 text-xs">Stored on Walrus: <Ext href={walruscanBlob(receipt)}>{short(receipt, 10)}</Ext></p>}
        </Card>
      ) : data && (
        <Card>
          <label htmlFor="shop-name" className="text-sm">Your shop&apos;s name</label>
          <input id="shop-name" className={`${inputCls} mt-1`} value={shop} onChange={(e) => setShop(e.target.value)} maxLength={80} placeholder="e.g. Ikeja Laptop Clinic" />
          <p className="mt-2 text-xs text-muted">Your wallet signs a message containing this record&apos;s fingerprint. The device owner can&apos;t sign for you, and the record can&apos;t be changed later without breaking the signature.</p>
          <div className="mt-4">{!account ? <WalletConnect /> : <Button onClick={sign} disabled={busy || shop.trim().length < 2}>{busy ? "Signing and storing on Walrus…" : "Sign as the shop"}</Button>}</div>
        </Card>
      )}
    </div>
  );
}
