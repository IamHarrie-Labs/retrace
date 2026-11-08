"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowClockwise, ArrowUpRight, Database, Fingerprint, Stack } from "@phosphor-icons/react";
import { Card, Ext, Label, Button, suiscan } from "@/components/ui";
import { requestJson } from "@/lib/client-api";

type Proof = { memory: {accountId:string;relayer:string;relayerStatus:string;total:number;devices:number;namespaces:{name:string;memory_count:number}[]};tatum:{network:string;latestCheckpoint:string} };

export default function ProofPage() {
  const [proof,setProof] = useState<Proof|null>(null);
  const [error,setError] = useState<string|null>(null);
  const [loading,setLoading] = useState(true);
  const load = useCallback(() => requestJson<Proof>("/api/proof", {}, 60_000).then(data => {
    setProof(data); setError(null); setLoading(false);
  }, error => {
    setError(error instanceof Error ? error.message : "The proof service is unavailable."); setLoading(false);
  }), []);
  useEffect(()=>{load();},[load]);
  return <div className="proof-page"><div className="page-heading"><h1>The proof behind<br /><em>the story.</em></h1><p>Live storage-account information from Walrus Memory, and Sui network data read through Tatum. Individual repair receipts appear in each device’s history.</p></div>
    <Button variant="ghost" onClick={()=>{setLoading(true);setError(null);setProof(null);void load();}} disabled={loading}><ArrowClockwise size={17} />{loading?"Checking records…":"Refresh proof"}</Button>
    {error&&<div className="mt-6" role="alert"><Card><h2 className="text-2xl">We couldn’t load the proof.</h2><p className="text-sm text-muted">{error}</p><Button className="mt-4" onClick={()=>{setLoading(true);setError(null);setProof(null);void load();}}>Try again</Button></Card></div>}
    {!proof&&loading&&<div className="proof-grid mt-6" role="status" aria-label="Loading live storage information">{[1,2,3].map(n=><Card key={n}><div className="skeleton short"/><div className="skeleton"/><div className="skeleton short"/></Card>)}</div>}
    {proof&&<div className="proof-grid mt-6"><section><Database size={25} weight="light" /><Label>Memories stored</Label><p className="proof-number">{proof.memory.total}</p><p className="mt-2 text-xs text-muted">Reported by Walrus Memory</p></section><section><Fingerprint size={25} weight="light"/><Label>Device namespaces</Label><p className="proof-number">{proof.memory.devices}</p><p className="mt-2 text-xs text-muted">Devices with recorded memory</p></section><section><Stack size={25} weight="light"/><Label>Sui checkpoint</Label><p className="proof-number break-all">{proof.tatum.latestCheckpoint}</p><p className="mt-2 text-xs text-muted">Read live through Tatum</p></section><section className="proof-account"><Label>Walrus Memory account</Label><p className="break-all font-mono text-xs"><Ext href={suiscan.object(proof.memory.accountId)}>{proof.memory.accountId} <ArrowUpRight size={14} className="inline" /></Ext></p><p className="mt-3 text-xs text-muted">Relayer status: {proof.memory.relayerStatus}. An account object proves the account exists; individual write receipts provide evidence for stored records.</p><h2 className="mt-8 text-3xl">Memory spaces</h2>{proof.memory.namespaces.length?<ul className="mt-4 divide-y divide-line">{proof.memory.namespaces.map(n=><li key={n.name} className="flex flex-wrap justify-between gap-3 py-4 text-xs"><code className="break-all">{n.name}</code><span className="text-muted">{n.memory_count} {n.memory_count === 1 ? "memory" : "memories"}</span></li>)}</ul>:<p className="text-sm text-muted">No memory spaces have been reported yet.</p>}</section></div>}
  </div>;
}
