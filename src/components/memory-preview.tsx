"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ArrowRight, BatteryLow, Plug, Check, ArrowCounterClockwise } from "@phosphor-icons/react";

export function MemoryPreview() {
  const [memory, setMemory] = useState(true);
  return <div className="memory-preview">
    <div className="sample-ledger"><div className="ledger-top"><span className="eyebrow">ThinkPad T480</span><span className="example-label">Illustrative history</span></div><p className="sample-symptom">“It still won’t charge.”</p><div className="small-timeline"><div><span className="timeline-symbol"><Check size={16} /></span><p><strong>Battery replaced</strong><span>Technician-attested · 12 October</span></p></div><div><span className="timeline-symbol returned"><ArrowCounterClockwise size={16} /></span><p><strong>The fault came back</strong><span>Owner-reported · 2 November</span></p></div></div><p className="sample-disclaimer">Sample records, not Mainnet activity.</p></div>
    <div className={`preview-advice ${memory ? "has-memory" : "no-memory"}`}><div className="advice-top"><span className="eyebrow">The next suggested check</span><button className="memory-switch-control" onClick={()=>setMemory(!memory)} role="switch" aria-checked={memory} aria-label="Use repair memory"><span>Memory {memory ? "on" : "off"}</span><span className="memory-switch"><span /></span></button></div><div className="advice-content" key={String(memory)}><div className="advice-icon">{memory ? <Plug size={35} weight="light" /> : <BatteryLow size={35} weight="light" />}</div><h3>{memory ? "Look beyond the battery." : "Start with the battery."}</h3><p>{memory ? "The replacement didn’t resolve the fault. Ask a technician to inspect the charging connection before buying another battery." : "Without the repair history, a battery health check remains an initial possibility. The previous unsuccessful replacement is missing from this view."}</p><span className="advice-reason"><ArrowRight size={16} />{memory ? "Changed by the recorded repair outcome" : "Based on the symptom alone"}</span></div><Link href="/demo" className="text-link">Explore the full story <ArrowUpRight size={17} /></Link></div>
  </div>;
}
