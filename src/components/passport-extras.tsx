"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { Button, Card, Ext, Label, Pill, short, walruscanBlob } from "./ui";
import { FAMILIES, type TimelinePoint } from "@/lib/diagnose";
import type { Family } from "@/lib/records";
import type { PublicSummary } from "@/lib/summary";
import { requestJson } from "@/lib/client-api";

/* ---------------- Public pre-purchase summary ---------------- */

const statusCopy: Record<PublicSummary["status"], { tone: "good" | "warn" | "muted" | "accent"; label: string; text: string }> = {
  resolved: { tone: "good", label: "Faults resolved", text: "Every recorded fault has a repair marked as resolved." },
  open: { tone: "warn", label: "Open fault", text: "At least one recorded fault has no resolved repair yet. Ask the seller about it." },
  clean: { tone: "accent", label: "No faults recorded", text: "There are records, and none of them needed a repair." },
  "no-history": { tone: "muted", label: "No history yet", text: "This passport has no repair records yet." },
};

export function SummaryCard({ summary, compact = false }: { summary: PublicSummary; compact?: boolean }) {
  const s = statusCopy[summary.status];
  const stats: [string, string | number][] = [
    ["Owners", summary.owners],
    ["Records", summary.records],
    ["Repairs", summary.repairs],
    ["Resolved", summary.resolvedRepairs],
    ["Fixes that failed", summary.failedRepairs],
    ["Shop-verified", summary.attested],
  ];
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Label>{compact ? "What a buyer sees" : "Check before you buy"}</Label>
        <Pill tone={s.tone}>{s.label}</Pill>
      </div>
      <p className="mb-4 text-sm">{s.text}</p>
      <dl className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-sm border border-line p-2">
            <dt className="text-[11px] text-muted">{k}</dt>
            <dd className="font-mono text-lg">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted">
        {summary.lastActivityAt ? `Last activity ${new Date(summary.lastActivityAt).toLocaleDateString()}. ` : ""}
        {summary.families.length ? `Fault areas: ${summary.families.join(", ")}. ` : ""}
        Counts only. Notes, costs and shops stay private to the holder{compact ? "." : " until they share a read-only link or hand the passport over."}
      </p>
    </Card>
  );
}

/* ---------------- QR code ---------------- */

export function Qr({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => { QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then(setSvg, () => setSvg(null)); }, [value]);
  if (!svg) return null;
  return <div role="img" aria-label={label} className="qr h-36 w-36 bg-white p-1" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function useOrigin() {
  return useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");
}

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/* ---------------- Share: sticker + read-only link ---------------- */

export function ShareCard({ id, make, model }: { id: string; make: string; model: string }) {
  const origin = useOrigin();
  const publicUrl = `${origin}/passport/${id}`;
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true); setMsg(null);
    try {
      const r = await requestJson<{ url: string; expiresAt: string }>(`/api/passport/${id}/share`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ days: 7 }) });
      const full = { url: origin + r.url, expiresAt: r.expiresAt };
      setLink(full); setMsg((await copy(full.url)) ? "Link copied." : null);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not create a link."); }
    finally { setBusy(false); }
  }

  function printSticker() {
    const w = window.open("", "_blank", "width=420,height=520");
    if (!w) return;
    QRCode.toString(publicUrl, { type: "svg", margin: 1 }).then((svg) => {
      w.document.write(`<!doctype html><title>Retrace sticker</title><body style="font-family:system-ui;text-align:center;padding:24px"><div style="border:1px solid #999;border-radius:8px;padding:16px;display:inline-block"><div style="width:180px;margin:auto">${svg}</div><p style="margin:8px 0 0;font-weight:600">${make.replace(/</g, "")} ${model.replace(/</g, "")}</p><p style="margin:4px 0 0;font-size:12px">Scan for this laptop's repair passport</p><p style="margin:4px 0 0;font-size:11px;color:#555">retrace · ${id.slice(0, 10)}…</p></div><script>setTimeout(()=>print(),300)</script></body>`);
      w.document.close();
    });
  }

  return (
    <Card>
      <Label>Share this passport</Label>
      <div className="flex gap-4">
        {origin && <Qr value={publicUrl} label="QR code linking to this passport's public summary" />}
        <div className="space-y-2 text-xs leading-5 text-muted">
          <p>Stick this under the laptop. Scanning it shows how many owners and repairs it has had, and whether any problem is still open.</p>
          <Button variant="ghost" onClick={printSticker}>Print sticker</Button>
        </div>
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 text-xs leading-5 text-muted">Selling it? Send a buyer a link to the full history. They can read it for 7 days, and the link stops working once the laptop changes hands.</p>
        <Button onClick={create} disabled={busy} className="w-full">{busy ? "Creating…" : link ? "Create a new link" : "Create read-only link"}</Button>
        {link && <p className="mt-2 break-all font-mono text-[11px]">{link.url}</p>}
        {link && <p className="text-[11px] text-muted">Expires {new Date(link.expiresAt).toLocaleDateString()}.</p>}
        {msg && <p className="mt-1 text-xs" role="status">{msg}</p>}
      </div>
    </Card>
  );
}

/* ---------------- Walrus verification ---------------- */

type Verify = { namespace: string; ledgerRecords: number; walrusMemories: number; matched: number; missing: string[]; checkedAt: string };

export function VerifyBadge({ id, share }: { id: string; share?: string | null }) {
  const [v, setV] = useState<Verify | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true); setErr(null);
    try { setV(await requestJson<Verify>(`/api/passport/${id}/verify${share ? `?share=${encodeURIComponent(share)}` : ""}`, {}, 60_000)); }
    catch (e) { setErr(e instanceof Error ? e.message : "Verification failed."); }
    finally { setBusy(false); }
  }
  const ok = v && v.missing.length === 0;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button onClick={run} disabled={busy} className="text-link">{busy ? "Checking Walrus…" : v ? "Re-check" : "Verify against Walrus ↗"}</button>
      {v && <span className={ok ? "text-good" : "text-warn"} role="status">{ok ? `✓ All ${v.matched} records found in this device's Walrus Memory` : `${v.missing.length} of ${v.ledgerRecords} records not found on Walrus`}</span>}
      {err && <span className="text-warn">{err}</span>}
    </div>
  );
}

/* ---------------- Learning curve ---------------- */

const ROSE = "#2e8059", FELL = "#c0731c";

/** How confidence in each cause moved as records were added. Two highlighted lines: the cause that rose, the cause that fell. */
export function LearningChart({ family, points }: { family: Family; points: TimelinePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const labels = useMemo(() => Object.fromEntries(FAMILIES[family].hypotheses.map((h) => [h.key, h.label])), [family]);
  if (points.length < 2) return null;
  const first = points[0], last = points[points.length - 1];
  const keys = Object.keys(first.probabilities);
  const rose = last.top;
  const fell = first.top !== rose ? first.top : keys.reduce((a, b) => (last.probabilities[b] - first.probabilities[b] < last.probabilities[a] - first.probabilities[a] ? b : a));
  const W = 600, H = 220, L = 36, R = 170, T = 12, B = 28;
  const x = (i: number) => L + (i * (W - L - R)) / (points.length - 1);
  const y = (p: number) => T + (1 - p) * (H - T - B);
  const path = (k: string) => points.map((pt, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(pt.probabilities[k] ?? 0).toFixed(1)}`).join(" ");
  const pct = (p: number) => `${Math.round(p * 100)}%`;
  const ordered = [...keys.filter((k) => k !== rose && k !== fell), fell, rose];
  const color = (k: string) => (k === rose ? ROSE : k === fell ? FELL : "var(--line)");

  return (
    <div className="mt-6 border-t border-line pt-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">How this device&apos;s memory changed the answer</p>
          <p className="text-xs text-muted">Weight of each cause after every record, oldest to newest.</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><i className="inline-block h-0.5 w-4" style={{ background: ROSE }} />{labels[rose]}</span>
          {fell !== rose && <span className="flex items-center gap-1"><i className="inline-block h-0.5 w-4" style={{ background: FELL }} />{labels[fell]}</span>}
          <button className="text-link" onClick={() => setTable((t) => !t)}>{table ? "Chart" : "Table"}</button>
        </div>
      </div>
      {table ? (
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="text-left text-muted"><th className="py-1 pr-2">After</th>{keys.map((k) => <th key={k} className="px-1">{labels[k]}</th>)}</tr></thead>
          <tbody>{points.map((p) => <tr key={p.recordId} className="border-t border-line"><td className="max-w-48 truncate py-1 pr-2">{p.label}</td>{keys.map((k) => <td key={k} className="px-1 font-mono">{pct(p.probabilities[k])}</td>)}</tr>)}</tbody>
        </table></div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${labels[rose]} rose from ${pct(first.probabilities[rose])} to ${pct(last.probabilities[rose])}; ${labels[fell]} moved from ${pct(first.probabilities[fell])} to ${pct(last.probabilities[fell])}.`}
            onMouseLeave={() => setHover(null)}>
            {[0, 0.5, 1].map((g) => <g key={g}><line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth={1} strokeDasharray={g ? "2 4" : undefined} /><text x={L - 6} y={y(g) + 4} textAnchor="end" fontSize={10} fill="var(--muted)">{pct(g)}</text></g>)}
            {ordered.map((k) => <path key={k} d={path(k)} fill="none" stroke={color(k)} strokeWidth={k === rose || k === fell ? 2 : 1.25} strokeLinejoin="round" strokeLinecap="round" />)}
            {[rose, ...(fell !== rose ? [fell] : [])].map((k) => <g key={k}>
              <circle cx={x(points.length - 1)} cy={y(last.probabilities[k])} r={4} fill={color(k)} stroke="var(--panel)" strokeWidth={2} />
              <text x={x(points.length - 1) + 8} y={y(last.probabilities[k]) + 4} fontSize={11} fill="var(--ink)">{labels[k].split(" (")[0].replace("Loose or damaged ", "")} {pct(last.probabilities[k])}</text>
            </g>)}
            {hover != null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--muted)" strokeWidth={1} />}
            {points.map((_, i) => <rect key={i} x={x(i) - (W - L - R) / (points.length - 1) / 2} y={T} width={(W - L - R) / (points.length - 1)} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`Step ${i}`} />)}
            <text x={L} y={H - 8} fontSize={10} fill="var(--muted)">No history</text>
            <text x={W - R} y={H - 8} fontSize={10} fill="var(--muted)" textAnchor="end">Now</text>
          </svg>
          {hover != null && (
            <div className="pointer-events-none absolute top-0 z-10 w-56 rounded-sm border border-line bg-panel p-2 text-xs shadow-sm" style={{ left: `min(calc(${(x(hover) / W) * 100}% + 8px), calc(100% - 14rem))` }}>
              <p className="mb-1 line-clamp-2 font-medium">{hover === 0 ? "Before any history" : points[hover].label}</p>
              {keys.slice().sort((a, b) => points[hover].probabilities[b] - points[hover].probabilities[a]).map((k) => (
                <p key={k} className="flex justify-between gap-2"><span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: color(k) }} />{labels[k]}</span><span className="font-mono">{pct(points[hover].probabilities[k])}</span></p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Attestation request ---------------- */

export function AttestButton({ id, recordId }: { id: string; recordId: string }) {
  const origin = useOrigin();
  const [url, setUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function create() {
    try {
      const r = await requestJson<{ url: string }>(`/api/passport/${id}/attest-link`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recordId }) });
      const full = origin + r.url; setUrl(full); setMsg((await copy(full)) ? "Link copied. Send it to the shop." : "Send this link to the shop.");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not create the link."); }
  }
  return (
    <span className="block">
      {!url && <button onClick={create} className="text-[11px] text-link">Ask the shop to verify ↗</button>}
      {msg && <span className="block text-[11px] text-muted">{msg}</span>}
      {url && <span className="block break-all font-mono text-[10px] text-muted">{url}</span>}
    </span>
  );
}

export type AttestationView = { recordId: string; signer: string; shop: string; signedAt: string; blobId?: string };
export function AttestedBadge({ a }: { a: AttestationView }) {
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
      <Pill tone="good">✓ Verified by {a.shop}</Pill>
      <span className="text-muted">signed by {short(a.signer)}</span>
      {a.blobId && <Ext href={walruscanBlob(a.blobId)}>receipt</Ext>}
    </span>
  );
}
