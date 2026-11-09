"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { useRunTransaction, type Balance } from "@/components/use-transaction";
import { AttestButton, AttestedBadge, LearningChart, Qr, ShareCard, SummaryCard, VerifyBadge, type AttestationView } from "@/components/passport-extras";
import type { PublicSummary, FollowupDue } from "@/lib/summary";
import type { TimelinePoint } from "@/lib/diagnose";
import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";
import { useSession } from "@/components/session";
import { requestJson } from "@/lib/client-api";
import { useBrowserStorage } from "@/lib/browser-storage";
import { Button, Card, Ext, inputCls, Label, Pill, short, suiscan, walruscanBlob } from "@/components/ui";
import { FAMILIES, type Diagnosis } from "@/lib/diagnose";
import type { Evidence, Family, Kind, Outcome, RepairRecord, Role } from "@/lib/records";

type ChainEvent = { kind: "minted" | "transferred"; from?: string; to: string; timestampMs: number; txDigest: string };
type Data = {
  passport: { id: string; owner: string | null; make: string; model: string; category: string; createdAtMs: number };
  events: ChainEvent[];
  viewer: string | null;
  authorized: boolean;
  shared: boolean;
  wasOwner: boolean;
  summary: PublicSummary;
  records: RepairRecord[] | null;
  attestations: AttestationView[] | null;
  followupsDue: FollowupDue[] | null;
};

const readShare = () => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("share"));
const readFollowup = () => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("followup"));

const PACKAGE_ID = process.env.NEXT_PUBLIC_RETRACE_PACKAGE_ID;

export default function PassportPage() {
  const { id } = useParams<{ id: string }>();
  const s = useSession();
  return <PassportContent key={`${id}:${s.address ?? "visitor"}`} id={id} />;
}

function PassportContent({ id }: { id: string }) {
  const s = useSession();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // Only read after data loads (client-side), so the lazy initial value can't cause a hydration mismatch.
  const [followupFocus, setFollowupFocus] = useState<string | null>(readFollowup);

  const requestVersion = useRef({ version: 0 });
  const load = useCallback((fresh = false) => {
    const version = ++requestVersion.current.version;
    const share = readShare();
    const qs = new URLSearchParams({ ...(fresh ? { fresh: "1" } : {}), ...(share ? { share } : {}) }).toString();
    return requestJson<Data>(`/api/passport/${id}${qs ? `?${qs}` : ""}`).then(next => {
      if (version === requestVersion.current.version) { setData(next); setErr(null); }
    }, error => {
      if (version === requestVersion.current.version) { setData(null); setErr(error instanceof Error ? error.message : "Could not load this passport."); }
    });
  }, [id]);
  useEffect(() => { const tracker = requestVersion.current; void load(); return () => { tracker.version++; }; }, [load]);
  if (err) return <div className="product-page"><Card><h1 className="mb-4 text-3xl">We couldn’t open this passport.</h1><p role="alert" className="text-warn">{err}</p><div className="mt-5 flex flex-wrap items-center gap-5"><Button onClick={() => { setErr(null); void load(true); }}>Try again</Button><Link href="/devices" className="text-link">Back to my devices ↗</Link></div></Card></div>;
  if (!data) return <div className="product-page" role="status"><div className="skeleton short" /><div className="skeleton" /><p className="text-sm text-muted">Reading the device passport…</p></div>;

  const p = data.passport;
  const owner = data.authorized && !!s.address;
  const full = owner || data.shared;
  const due = owner ? data.followupsDue?.[0] : undefined;
  return (
    <div className="product-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Device passport</Label>
          <h1 className="text-3xl font-semibold tracking-tight">{p.make} {p.model}</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            <Ext href={suiscan.object(p.id)}>{short(p.id, 10)}</Ext> · owner{" "}
            {p.owner ? <Ext href={suiscan.account(p.owner)}>{short(p.owner)}</Ext> : "—"} (read via Tatum)
          </p>
        </div>
        {owner ? <Pill tone="good">You hold this passport</Pill> : data.shared ? <Pill tone="accent">Read-only link from the holder</Pill> : <Pill>Public summary</Pill>}
      </div>

      {!full && <SummaryCard summary={data.summary} />}

      {!full && (
        <Card>
          <p className="text-sm">
            {data.wasOwner
              ? "You've handed this laptop on, so its full history is now with the new owner."
              : readShare()
                ? "This read-only link has expired, or the device has changed hands since it was created. Ask the holder for a new link."
                : !data.viewer || !s.address
                  ? "Thinking of buying this laptop? Ask the seller for a read-only link to see the full history. If you hold this passport, connect and sign in."
                  : "Only the passport's current owner, or someone with their read-only link, can open the full repair history."}
          </p>
          <p className="mt-2 text-xs text-muted">
            Access is enforced by Retrace: your signed-in wallet must match the owner Tatum reports for this object on Sui
            Mainnet. The memory itself sits in Retrace&apos;s Walrus Memory account.
          </p>
        </Card>
      )}

      {full && data.records && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <VerifyBadge id={p.id} share={data.shared ? readShare() : null} />
            {owner && <a className="text-link" href={`/api/passport/${p.id}/export`}>Export service book ↗</a>}
          </div>
          {due && (
            <Card className="border-warn/40">
              <p className="text-sm"><b>Did the fix hold?</b> &ldquo;{due.action}&rdquo; has no outcome yet{due.overdue ? "" : `. Check back around ${new Date(due.dueAt).toLocaleDateString()}`}. Recording it is how Retrace learns, for this device and for every other {p.model}.</p>
              <a href={`?followup=${due.recordId}#add-record`} onClick={(e) => { e.preventDefault(); history.replaceState(null, "", `?followup=${due.recordId}#add-record`); setFollowupFocus(due.recordId); document.getElementById("add-record")?.scrollIntoView({ behavior: "smooth" }); }} className="text-link mt-2 inline-block">Record the follow-up ↓</a>
            </Card>
          )}
          <DiagnosePanel key={data.records.map(record => record.id).join(":")} id={p.id} share={data.shared ? readShare() : null} />
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Timeline records={data.records} attestations={data.attestations ?? []} passportId={owner ? p.id : null} />
            <div className="space-y-6">
              {owner && <AddRecord key={followupFocus ?? "add"} id={p.id} records={data.records} initialFollowup={followupFocus} onSaved={() => load(true)} />}
              {owner && <HandoverCard id={p.id} onDone={() => { setData(null); void load(true); }} />}
              {owner && <ShareCard id={p.id} make={p.make} model={p.model} />}
              {owner && <SummaryCard summary={data.summary} compact />}
            </div>
          </div>
        </>
      )}

      <Card>
        <Label>Ownership changes on Sui, read through Tatum</Label>
        <ul className="space-y-2 text-sm">
          {data.events.map((e) => (
            <li key={e.txDigest + e.kind} className="flex flex-wrap gap-x-2 text-muted">
              <span className="text-ink">{e.kind === "minted" ? "Registered by" : `Transferred ${short(e.from)} →`}</span>
              <span className="font-mono">{short(e.to)}</span>
              <span>· {e.timestampMs ? new Date(e.timestampMs).toLocaleString() : ""}</span>
              <Ext href={suiscan.tx(e.txDigest)}>tx</Ext>
            </li>
          ))}
          {!data.events.length && <li className="text-muted">No events found yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

/* ---------------- Diagnosis: the learning, made visible ---------------- */

function DiagnosePanel({ id, share }: { id: string; share?: string | null }) {
  const [symptom, setSymptom] = useState("Charges intermittently; stops charging when the cable moves");
  const [result, setResult] = useState<{ family: Family; warning?: string; withoutMemory: Diagnosis; withMemory: Diagnosis; timeline?: TimelinePoint[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true); setErr(null); setResult(null);
    try {
      const next = await requestJson<{family: Family; warning?: string; withoutMemory: Diagnosis; withMemory: Diagnosis; timeline?: TimelinePoint[]}>(`/api/passport/${id}/diagnose`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ symptom, ...(share ? { share } : {}) }),
      }, 90_000);
      setResult(next);
    } catch(error) { setErr(error instanceof Error ? error.message : "Could not compare the suggestions."); }
    finally { setBusy(false); }
  }


  return (
    <Card>
      <Label>What should the technician check next?</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input aria-label="Describe the current fault" className={inputCls} value={symptom} onChange={(e) => setSymptom(e.target.value)} maxLength={500} placeholder="Describe the fault" />
        <Button onClick={run} disabled={busy || symptom.trim().length < 3}>{busy ? "Loading context…" : "Compare suggestions"}</Button>
      </div>
      {!result && !busy && !err && <p className="mt-3 text-xs text-muted">Describe the current fault, then compare the next checks with and without this device’s history.</p>}
      {err && <p role="alert" className="mt-2 text-sm text-warn">{err}</p>}
      {result?.warning && <p className="mt-3 text-xs text-muted">{result.warning}</p>}
      {result && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <DiagnosisView d={result.withoutMemory} title="Without memory" />
          <DiagnosisView d={result.withMemory} title="With this device's memory" />
        </div>
      )}
      {result?.timeline && <LearningChart family={result.family} points={result.timeline} />}
    </Card>
  );
}

function DiagnosisView({ d, title }: { d: Diagnosis; title: string }) {
  const changed = d.memory && (d.avoid.length > 0 || d.lessonsUsed.length > 0);
  return (
    <div className={`rounded-lg border p-4 ${d.memory ? "border-accent/40 bg-accent/5" : "border-line bg-bg"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        {d.memory ? <Pill tone="accent">Walrus Memory</Pill> : <Pill>symptom only</Pill>}
      </div>
      <p className="text-sm">{d.headline}</p>
      <div className={`mt-3 rounded-md p-3 text-sm ${changed ? "bg-accent/10 text-ink" : "bg-raised text-ink"}`}>
        <b>{d.recommendation.action === "fix" ? "Fix: " : "Next: "}</b>
        {d.recommendation.text}
      </div>
      {d.avoid.map((a) => (
        <p key={a.hypothesis.key} className="mt-2 text-xs text-warn">⚠ {a.text}</p>
      ))}
      <p className="mt-4 text-[11px] text-muted">The bars show how strongly Retrace leans toward each cause. They are estimates, so a technician should still check the laptop.</p>
      <ul className="mt-3 space-y-2">
        {d.ranked.map((h) => (
          <li key={h.key}>
            <div className="flex justify-between text-xs">
              <span>{h.label}</span>
              <span className="font-mono text-muted">{Math.round(h.probability * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-raised">
              <div className={`h-1.5 rounded ${d.memory ? "bg-accent" : "bg-muted"}`} style={{ width: `${Math.max(2, h.probability * 100)}%` }} />
            </div>
            {h.evidence.map((e) => (
              <p key={e.recordId} className="mt-1 text-[11px] text-muted">
                ×{e.factor} · {e.summary} {e.strength === "weak" && <span className="text-muted/70">(weak evidence)</span>}{" "}
                {e.blobId && <Ext href={walruscanBlob(e.blobId)}>blob</Ext>}
              </p>
            ))}
          </li>
        ))}
      </ul>
      {d.lessonsUsed.length > 0 && (
        <div className="mt-3 border-t border-line pt-3 text-[11px] text-muted">
          <b className="text-ink">Learned from other {d.lessonsUsed[0].model} owners</b> (one vote per wallet, capped at ×1.35):
          {d.lessonsUsed.map((l) => (
            <p key={l.blobId ?? l.createdAt}>
              {l.failed.length ? `${l.failed.map((f) => FAMILIES[d.family].hypotheses.find((h) => h.key === f)?.label ?? f).join(", ")} didn't hold; ` : ""}fixed by {FAMILIES[d.family].hypotheses.find((h) => h.key === l.fixedBy)?.label ?? l.fixedBy}
              {l.attested && " · shop-verified"} · ×{l.boost} from {l.independentReports} {l.independentReports === 1 ? "owner" : "owners"}{" "}
              {l.blobId && <Ext href={walruscanBlob(l.blobId)}>blob</Ext>}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Timeline ---------------- */

const outcomeTone: Record<Outcome, "good" | "warn" | "muted" | "accent"> = {
  resolved: "good",
  confirmed: "accent",
  returned: "warn",
  ruled_out: "muted",
  pending: "muted",
};

function Timeline({ records, attestations, passportId }: { records: RepairRecord[]; attestations: AttestationView[]; passportId: string | null }) {
  const followups = useMemo(() => records.filter((r) => r.kind === "followup"), [records]);
  const attestedBy = useMemo(() => new Map(attestations.map((a) => [a.recordId, a])), [attestations]);
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <Label>Repair memory · {records.length} entries on Walrus</Label>
      </div>
      <p className="mb-5 text-[11px] leading-5 text-muted">The owner fills in who did each repair and how they know. Records signed by a repair shop say so.</p>
      {!records.length && <p className="text-sm text-muted">Nothing recorded yet. Start with the symptom.</p>}
      <ol className="relative space-y-4 border-l border-line pl-5">
        {records
          .filter((r) => r.kind !== "followup")
          .map((r) => {
            const latest = [...followups].sort((a,b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).find((f) => f.ref === r.id);
            const hyp = r.hypothesis ? FAMILIES[r.family].hypotheses.find((h) => h.key === r.hypothesis)?.label : null;
            return (
              <li key={r.id} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="uppercase tracking-wider">{r.kind}</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  <Pill tone={outcomeTone[latest?.outcome ?? r.outcome]}>{(latest?.outcome ?? r.outcome).replace("_", " ")}</Pill>
                  <Pill>{r.role} · {r.evidence}</Pill>
                </div>
                <p className="mt-1 text-sm">{r.action}</p>
                <p className="text-xs text-muted">
                  {hyp && <>About: {hyp} · </>}
                  {r.by && <>{r.by} · </>}
                  <span title={r.author}>Added by {short(r.author)}</span> · 
                  {r.costUsd != null && <>${r.costUsd} · </>}
                  {(latest ? latest.daysUntilReturn : r.daysUntilReturn) != null && <>returned after {latest ? latest.daysUntilReturn : r.daysUntilReturn} days · </>}
                  {r.blobId && <Ext href={walruscanBlob(r.blobId)}>Walrus blob</Ext>}
                </p>
                {attestedBy.get(r.id) ? <AttestedBadge a={attestedBy.get(r.id)!} /> : passportId && r.kind !== "symptom" && <AttestButton id={passportId} recordId={r.id} />}
                {latest && <div className="timeline-followup"><p>Latest follow-up: {latest.action}</p><p>{latest.role} · {latest.evidence} · {new Date(latest.createdAt).toLocaleDateString()} {latest.blobId && <Ext href={walruscanBlob(latest.blobId)}>View follow-up receipt</Ext>}</p></div>}
              </li>
            );
          })}
      </ol>
    </Card>
  );
}

/* ---------------- Add record ---------------- */

function AddRecord({ id, records, onSaved, initialFollowup }: { id: string; records: RepairRecord[]; onSaved: () => void; initialFollowup?: string | null }) {
  const followupTarget = initialFollowup ? records.find((r) => r.id === initialFollowup && r.kind === "repair") : undefined;
  const [kind, setKind] = useState<Kind>(followupTarget ? "followup" : "repair");
  const [family, setFamily] = useState<Family>(followupTarget?.family ?? "charging");
  const [hypothesis, setHypothesis] = useState("battery");
  const [action, setAction] = useState("");
  const [outcome, setOutcome] = useState<Outcome>(followupTarget ? "resolved" : "returned");
  const [ref, setRef] = useState(followupTarget?.id ?? "");
  const [days, setDays] = useState("");
  const [cost, setCost] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [evidence, setEvidence] = useState<Evidence>("reported");
  const [by, setBy] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const outcomes: Record<Kind, Outcome[]> = {
    symptom: ["pending"],
    test: ["confirmed", "ruled_out", "pending"],
    repair: ["resolved", "returned", "pending"],
    followup: ["resolved", "returned"],
  };
  const repairs = records.filter((r) => r.kind === "repair" && r.family === family);
  const requestKey = useRef<{ payload: string; key: string } | null>(null);
  const [shareLesson, setShareLesson] = useState(false);

  async function save() {
    if (busy) return;
    setBusy(true); setMsg("Writing to Walrus Memory. Waiting for the storage receipt…");
    const selectedOutcome = outcomes[kind].includes(outcome) ? outcome : outcomes[kind][0];
    const payload = JSON.stringify({
      kind, family,
      hypothesis: kind === "symptom" ? undefined : kind === "followup" ? repairs.find(r => r.id === ref)?.hypothesis : hypothesis,
      action, outcome: selectedOutcome, ref: kind === "followup" ? ref : undefined,
      daysUntilReturn: selectedOutcome === "returned" && days ? Number(days) : undefined,
      costUsd: kind === "repair" && cost ? Number(cost) : undefined, role, evidence, by: by || undefined, shareLesson,
    });
    if (requestKey.current?.payload !== payload) requestKey.current = { payload, key: crypto.randomUUID() };
    try {
      const saved = await requestJson<{record: RepairRecord; lesson?: unknown; warning?: string}>(`/api/passport/${id}/records`, {
        method: "POST", headers: { "content-type": "application/json", "idempotency-key": requestKey.current.key }, body: payload,
      }, 180_000);
      setMsg(saved.warning || `Saved to Walrus. Receipt: ${saved.record.blobId || "confirmed"}.${saved.lesson ? " A tip for this model was also shared." : ""}`);
      requestKey.current = null; setAction(""); setDays(""); setCost(""); onSaved();
    } catch(error) { setMsg(error instanceof Error ? error.message : "Save failed. Retry with the same details."); }
    finally { setBusy(false); }
  }

  return <div id="add-record" className="scroll-mt-24"><Card>
    <Label>Add to this laptop’s history</Label>
    <form onSubmit={event=>{event.preventDefault();void save();}}>
      <fieldset disabled={busy} className="record-fields">
        <legend className="sr-only">Repair record details</legend>
        <div className="field"><label htmlFor="record-kind">What are you recording?</label><select id="record-kind" className={inputCls} value={kind} onChange={event=>{const next=event.target.value as Kind;setKind(next);setOutcome(outcomes[next][0]);setRef("");}}><option value="symptom">A symptom</option><option value="test">A diagnostic test</option><option value="repair">A repair</option><option value="followup">A repair follow-up</option></select></div>
        <div className="field"><label htmlFor="record-family">Fault category</label><select id="record-family" className={inputCls} value={family} onChange={event=>{const next=event.target.value as Family;setFamily(next);setHypothesis(FAMILIES[next].hypotheses[0].key);setRef("");}}>{Object.entries(FAMILIES).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></div>
        {(kind==="test"||kind==="repair")&&<div className="field field-wide"><label htmlFor="record-cause">What do you think the cause is?</label><select id="record-cause" className={inputCls} value={hypothesis} onChange={event=>setHypothesis(event.target.value)}>{FAMILIES[family].hypotheses.map(cause=><option key={cause.key} value={cause.key}>{cause.label}</option>)}</select></div>}
        {kind==="followup"&&<div className="field field-wide"><label htmlFor="record-reference">Which repair is this about?</label><select id="record-reference" className={inputCls} value={ref} onChange={event=>setRef(event.target.value)} required><option value="">{repairs.length?"Choose a repair":"No repairs in this category yet"}</option>{repairs.map(repair=><option key={repair.id} value={repair.id}>{new Date(repair.createdAt).toLocaleDateString()} · {repair.action.slice(0,65)}</option>)}</select>{!repairs.length&&<p className="field-hint">Choose the repair’s fault category, or record the repair first.</p>}</div>}
        <div className="field field-wide"><label htmlFor="record-description">{kind==="symptom"?"What happens?":"What was done or observed?"}</label><textarea id="record-description" className={inputCls} rows={3} value={action} onChange={event=>setAction(event.target.value)} minLength={3} maxLength={400} required placeholder={kind==="symptom"?"For example, charging stops when the cable moves.":"Describe the test, repair or follow-up in plain words."}/><p className="field-hint">{action.length}/400 characters. Keep passwords and personal details out of service notes.</p></div>
        {kind!=="symptom"&&<div className="field"><label htmlFor="record-outcome">Outcome</label><select id="record-outcome" className={inputCls} value={outcome} onChange={event=>setOutcome(event.target.value as Outcome)}>{outcomes[kind].map(value=><option key={value} value={value}>{({resolved:"Fault resolved",returned:"Fault returned",confirmed:"Cause confirmed",ruled_out:"Cause ruled out",pending:"Not known yet"})[value]}</option>)}</select></div>}
        {outcome==="returned"&&kind!=="symptom"&&<div className="field"><label htmlFor="record-return-days">Returned after how many days?</label><input id="record-return-days" className={inputCls} type="number" inputMode="numeric" min={0} max={3650} step={1} value={days} onChange={event=>setDays(event.target.value)} placeholder="Optional"/></div>}
        {kind==="repair"&&<div className="field"><label htmlFor="record-cost">Repair cost (USD)</label><input id="record-cost" className={inputCls} type="number" inputMode="decimal" min={0} max={100000} step="0.01" value={cost} onChange={event=>setCost(event.target.value)} placeholder="Optional"/></div>}
        <div className="field"><label htmlFor="record-role">Who did this?</label><select id="record-role" className={inputCls} value={role} onChange={event=>setRole(event.target.value as Role)}><option value="owner">Owner</option><option value="technician">Technician</option></select></div>
        <div className="field"><label htmlFor="record-evidence">How do you know?</label><select id="record-evidence" className={inputCls} value={evidence} onChange={event=>setEvidence(event.target.value as Evidence)}><option value="reported">I remember it, or was told</option><option value="tested">Tested or measured</option><option value="receipt">I have a receipt</option></select></div>
        <div className="field field-wide"><label htmlFor="record-shop">Shop or technician name</label><input id="record-shop" className={inputCls} value={by} onChange={event=>setBy(event.target.value)} maxLength={80} placeholder="Optional" autoComplete="organization"/></div>
        <label className="consent-field field-wide"><input type="checkbox" checked={shareLesson} onChange={event=>setShareLesson(event.target.checked)}/><span>If this fixed it, share a tip with other owners of this model. Your notes, costs and wallet stay private.</span></label>
      </fieldset>
      <Button type="submit" disabled={busy||action.trim().length<3||(kind==="followup"&&!ref)} className="mt-5 w-full">{busy?"Waiting for the storage receipt…":"Save repair record"}</Button>
      <p className="mt-3 text-[11px] leading-5 text-muted">Only a repair shop&apos;s signature checks these answers. A receipt shows the work was paid for. It can&apos;t show that the repair worked.</p>
      {msg&&<p className="save-status" role="status" aria-live="polite">{msg}</p>}
    </form>
  </Card></div>;
}

/* ---------------- Handover (claim link) ---------------- */

type HandoverState = { buyer: string | null; claimedAt: number | null; expiresAt: number } | null;

function HandoverCard({ id, onDone }: { id: string; onDone: () => void }) {
  const dAppKit = useDAppKit();
  const runTx = useRunTransaction();
  const session = useSession();
  const [isPending, setPending] = useState(false);
  const [to, setTo] = useState("");
  const [manual, setManual] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [handover, setHandover] = useState<HandoverState>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const storageKey = `retrace:pending-transfer:${id}:${session.address || "disconnected"}`;
  const [storedTransfer, setStoredTransfer] = useBrowserStorage(storageKey);
  const pending = useMemo(() => {
    try {
      const value = JSON.parse(storedTransfer ?? "null") as {digest?: unknown; to?: unknown} | null;
      return value && typeof value.digest === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(value.digest) && typeof value.to === "string" && /^0x[0-9a-fA-F]{64}$/.test(value.to) ? {digest:value.digest, to:value.to} : null;
    } catch { return null; }
  }, [storedTransfer]);
  const submittedDigest = pending?.digest ?? null;
  const buyer = handover?.buyer ?? null;
  const recipient = pending?.to ?? (manual ? to.trim() : buyer ?? "");
  const valid = /^0x[0-9a-fA-F]{64}$/.test(recipient) && isValidSuiAddress(recipient) && normalizeSuiAddress(recipient) !== session.address;

  const refresh = useCallback(() => requestJson<{ handover: HandoverState }>(`/api/passport/${id}/handover`).then((r) => setHandover(r.handover), () => {}), [id]);
  useEffect(() => { void refresh(); requestJson<Balance>("/api/balance").then(setBalance, () => {}); }, [refresh]);
  // While a link is waiting for the buyer, check every few seconds.
  useEffect(() => {
    if (!handover || handover.buyer) return;
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [handover, refresh]);

  async function createLink() {
    setMsg(null);
    try {
      const r = await requestJson<{ url: string }>(`/api/passport/${id}/handover`, { method: "POST", headers: { "content-type": "application/json" } });
      const full = window.location.origin + r.url; setLink(full); void refresh();
      try { await navigator.clipboard.writeText(full); setMsg("Claim link copied. Send it to the buyer, or let them scan the code."); } catch { setMsg("Send this link to the buyer, or let them scan the code."); }
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not create a claim link."); }
  }
  async function cancelLink() {
    await requestJson(`/api/passport/${id}/handover`, { method: "DELETE" }).catch(() => {});
    setLink(null); setHandover(null);
  }

  async function transfer() {
    if (isPending) return;
    if (!PACKAGE_ID) return setMsg("Transfers are temporarily unavailable.");
    setPending(true); setMsg(null);
    let digest = submittedDigest;
    try {
      if (!digest) {
        if (!valid) throw new Error("The next holder's address is missing or matches your own.");
        const tx = new Transaction();
        tx.moveCall({ target: `${PACKAGE_ID}::passport::transfer_passport`, arguments: [tx.object(id), tx.pure.address(normalizeSuiAddress(recipient))] });
        digest = await runTx(tx, !!balance?.sponsored);
        setStoredTransfer(JSON.stringify({ digest, to: normalizeSuiAddress(recipient) }));
      }
      setMsg(`Submitted ${short(digest)}. Waiting for confirmation through Tatum…`);
      const confirmed = await dAppKit.getClient().core.waitForTransaction({ digest, timeout: 45_000 });
      setStoredTransfer(null);
      if (confirmed.$kind === "FailedTransaction") throw new Error("The transfer failed onchain.");
      setMsg("Transfer confirmed. Refreshing passport access…"); onDone();
    } catch (error) {
      setMsg(`${error instanceof Error ? error.message : "Transfer could not be confirmed."}${digest ? " A transaction was already submitted. Check its status before sending another." : ""}`);
    } finally { setPending(false); }
  }

  return <Card><Label>Sell or hand over</Label>
    <p className="mb-3 text-xs leading-6 text-muted">The next holder gets the full history and the learned diagnosis. Your access ends once the transfer confirms.{balance?.sponsored ? " Retrace pays the network fee." : ""}</p>
    {submittedDigest ? (
      <>
        <Button onClick={transfer} disabled={isPending} className="w-full">{isPending ? "Checking confirmation…" : "Check transfer status"}</Button>
        <p className="mt-3 text-xs"><Ext href={suiscan.tx(submittedDigest)}>Inspect the submitted transaction</Ext></p>
      </>
    ) : buyer && !manual ? (
      <div className="rounded-sm border border-good/40 bg-good/5 p-3">
        <p className="text-sm"><b>The buyer is ready.</b> Wallet <span className="font-mono">{short(buyer, 8)}</span> signed in and claimed this device{handover?.claimedAt ? ` at ${new Date(handover.claimedAt).toLocaleTimeString()}` : ""}.</p>
        <p className="mt-1 text-[11px] text-muted">Check this matches the buyer before you continue.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => dialog.current?.showModal()} disabled={isPending}>Transfer to buyer</Button>
          <Button variant="ghost" onClick={cancelLink}>Cancel</Button>
        </div>
      </div>
    ) : !manual ? (
      <>
        {!handover && <Button onClick={createLink} className="w-full">Create claim link</Button>}
        {handover && (
          <div className="flex gap-4">
            {link && <Qr value={link} label="QR code with the claim link for the buyer" />}
            <div className="space-y-2 text-xs text-muted">
              <p role="status">Waiting for the buyer to open the link and sign in… This updates by itself.</p>
              {link && <p className="break-all font-mono text-[10px]">{link}</p>}
              <p>Expires {new Date(handover.expiresAt).toLocaleDateString()}.</p>
              <div className="flex gap-3"><button className="text-link" onClick={createLink}>New link</button><button className="text-link" onClick={cancelLink}>Cancel</button></div>
            </div>
          </div>
        )}
        <button className="mt-3 text-[11px] text-muted underline" onClick={() => setManual(true)}>I have the buyer&apos;s Sui address instead</button>
      </>
    ) : (
      <>
        <label className="mb-2 block text-xs text-muted" htmlFor="transfer-recipient">Next holder&apos;s full Sui address</label>
        <input id="transfer-recipient" disabled={isPending} autoComplete="off" spellCheck={false} className={inputCls} value={to} onChange={event=>setTo(event.target.value)} placeholder="0x… (64 hexadecimal characters)" />
        <Button variant="danger" onClick={() => dialog.current?.showModal()} disabled={isPending || !valid} className="mt-3 w-full">Review transfer</Button>
        <button className="mt-3 text-[11px] text-muted underline" onClick={() => setManual(false)}>Use a claim link instead</button>
      </>
    )}
    {msg && <p className="mt-3 text-xs leading-6 text-muted" role="status">{msg}</p>}
    <dialog ref={dialog} className="transfer-dialog" aria-labelledby="transfer-title"><h2 id="transfer-title">Pass on this passport?</h2><p>The next holder will be able to open this device’s repair history through Retrace. You will lose access through the app.{balance?.sponsored ? " Retrace pays the network fee." : " Your wallet will ask you to approve the transaction and gas fee."}</p><code>{recipient}</code><div className="mt-6 flex flex-wrap gap-3"><Button variant="ghost" onClick={()=>dialog.current?.close()}>Cancel</Button><Button onClick={()=>{dialog.current?.close();void transfer();}}>Continue to wallet</Button></div></dialog>
  </Card>;
}
