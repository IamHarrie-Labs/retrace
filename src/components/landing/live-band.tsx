"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";

type Proof = { memory: { total: number; devices: number; relayerStatus: string }; tatum: { latestCheckpoint: string | number } };

// Live numbers from /api/proof, the same source as the Proof page. Nothing is shown until real data arrives.
export function LiveBand() {
  const [p, setP] = useState<Proof | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let on = true;
    fetch("/api/proof").then(r => (r.ok ? r.json() : Promise.reject())).then(d => on && setP(d), () => on && setFailed(true));
    return () => { on = false; };
  }, []);
  const fmt = (n: string | number) => Number(n).toLocaleString("en-US");
  return (
    <section className="lb" aria-label="Live on Sui Mainnet">
      <span className="lb-live"><i aria-hidden="true" />Live on Sui Mainnet</span>
      <dl>
        <div><dt>Repair records on Walrus</dt><dd>{p ? fmt(p.memory.total) : failed ? "—" : <span className="lb-sk" />}</dd></div>
        <div><dt>Laptops with a history</dt><dd>{p ? fmt(p.memory.devices) : failed ? "—" : <span className="lb-sk" />}</dd></div>
        <div><dt>Sui checkpoint via Tatum</dt><dd>{p ? fmt(p.tatum.latestCheckpoint) : failed ? "—" : <span className="lb-sk" />}</dd></div>
      </dl>
      <Link href="/proof" className="lb-link">Check the proof <ArrowUpRight size={16} /></Link>
    </section>
  );
}
