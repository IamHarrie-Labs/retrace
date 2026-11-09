"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ArrowCounterClockwise, Fingerprint, Plug, Notebook, Swap, LockSimple, BatteryLow } from "@phosphor-icons/react";
import { diagnose } from "@/lib/diagnose";
import type { RepairRecord } from "@/lib/records";

const batteryRecord: RepairRecord = { v:1, id:"sample-repair",passportId:"sample-passport",kind:"repair",family:"charging",hypothesis:"battery",action:"Battery replaced; the charging fault returned after 21 days.",outcome:"returned",daysUntilReturn:21,author:"sample-technician",role:"technician",evidence:"tested",createdAt:"2026-10-12T12:00:00Z" };
const chargerTest: RepairRecord = { v:1,id:"sample-test",passportId:"sample-passport",kind:"test",family:"charging",hypothesis:"charger",action:"A technician tried a known-good charger. The same fault remained.",outcome:"ruled_out",author:"sample-technician",role:"technician",evidence:"tested",createdAt:"2026-11-02T12:00:00Z" };
const LIVE_PASSPORT = process.env.NEXT_PUBLIC_DEMO_PASSPORT_ID;
const chapters = ["Meet the device", "Learn from a repair", "Pass it forward"];

export default function DemoPage() {
  const [chapter,setChapter] = useState(0);
  const [memory,setMemory] = useState(true);
  const [outcomeAdded,setOutcomeAdded] = useState(false);
  const [transferred,setTransferred] = useState(false);
  const [viewer,setViewer] = useState<"original"|"new">("original");
  const records = useMemo(()=> outcomeAdded ? [batteryRecord,chargerTest] : [],[outcomeAdded]);
  const result = useMemo(()=>diagnose({family:"charging",records,memory,symptom:"Charges intermittently"}),[records,memory]);
  const allowed = !transferred || viewer === "new";
  function chooseChapter(index:number) { setChapter(index); if(index > 0) setOutcomeAdded(true); }
  function reset() { setChapter(0);setMemory(true);setOutcomeAdded(false);setTransferred(false);setViewer("original"); }
  return <div className="demo-page">
    <div className="demo-topbar"><p><strong>This is an example.</strong> The records are made up, and nothing here touches your wallet or the blockchain.</p><button className="text-link" onClick={reset}>Reset example <ArrowCounterClockwise size={15} /></button></div>
    <div className="demo-title-row"><div><h1>Meet this MacBook.</h1><p>MacBook Pro 13 (2020) · Charges on and off · Sample passport RT–001</p></div><Link href="/devices" className="action-button">Start a passport <ArrowUpRight size={18} /></Link></div>
    <nav className="demo-stepper" aria-label="Example chapters">{chapters.map((name,i)=><button key={name} onClick={()=>chooseChapter(i)} aria-current={chapter===i?"step":undefined}><span>{String(i+1).padStart(2,"0")}</span>{name}</button>)}</nav>
    <div className="demo-grid"><section className="demo-device" aria-label="Sample device passport"><div className="eyebrow"><Fingerprint size={17} /> Device passport</div><div className="demo-device-img"><Image src="/images/photos/macbook-pro-plant.jpg" alt="A MacBook Pro on a desk next to a plant" fill sizes="(max-width:760px) 90vw, 42vw" priority /></div><div className="demo-passport-meta"><div><span>Device</span><strong>Apple MacBook Pro 13 (2020)</strong></div><div><span>Passport holder</span><strong>{transferred ? "Owner B (example)" : "Owner A (example)"}</strong></div><div><span>Sample records</span><strong>{records.length + 1}</strong></div><div><span>Storage</span><strong>Local example only</strong></div></div></section>
    <section className="demo-diagnosis" aria-labelledby="diagnosis-heading"><div className="advice-top"><span className="eyebrow">{allowed?"A better next check":"Passport access"}</span><button className="memory-switch-control" role="switch" aria-checked={memory} aria-label="Use repair memory" disabled={!allowed} onClick={()=>setMemory(!memory)}><span>Memory {memory?"on":"off"}</span><span className="memory-switch"><span /></span></button></div>
      <div aria-live="polite" aria-atomic="true">{allowed ? <><h2 id="diagnosis-heading">{outcomeAdded&&memory ? "A different place to look." : "The history is missing."}</h2><p className="text-sm leading-7 text-muted">{outcomeAdded&&memory ? "The new battery didn’t fix it, and neither did a charger that’s known to work. So the battery drops down the list and the charging port moves up." : "Without the repair history, Retrace only has the symptom to go on, so it suggests the most common cause. It has no idea a battery was already tried."}</p><div className="demo-next">{outcomeAdded&&memory ? <Plug size={24} weight="light" /> : <BatteryLow size={24} weight="light" />}<div><strong>Suggested next check</strong><p>{result.recommendation.text}</p></div></div><p className="sample-disclaimer">This is a suggestion for what to check first. A technician should look at the laptop before anything gets replaced.</p></> : <><LockSimple size={36} weight="light" className="mt-8" /><h2 id="diagnosis-heading">This chapter belongs<br />to the next owner.</h2><p className="text-sm leading-7 text-muted">Owner A sold the laptop, so Retrace stopped showing them its history. Switch to Owner B to see what the buyer gets.</p></>}</div>
      {!outcomeAdded && <button className="action-button" onClick={()=>{setOutcomeAdded(true);setChapter(1);}}>Add the repair results <ArrowRight size={18} /></button>}
      {outcomeAdded && chapter<2 && <button className="action-button" onClick={()=>setChapter(2)}>Next: sell the laptop <ArrowRight size={18} /></button>}
      {chapter===2 && !transferred && <button className="action-button" onClick={()=>{setTransferred(true);setViewer("original");}}>Transfer it to Owner B <Swap size={18} /></button>}
      {transferred && <div className="mt-6 flex flex-wrap gap-3"><button className={`action-button ${viewer==="original"?"":"opacity-60"}`} aria-pressed={viewer==="original"} onClick={()=>setViewer("original")}>View as Owner A</button><button className={`action-button ${viewer==="new"?"":"opacity-60"}`} aria-pressed={viewer==="new"} onClick={()=>setViewer("new")}>View as Owner B</button></div>}
    </section></div>
    <div className="demo-bottom"><section className="demo-history"><h2>What’s in the record?</h2>{!allowed ? <p className="text-sm text-muted">Owner A can’t see the history anymore.</p> : <ol><li><Notebook size={19} /><div><strong>Charging problem reported</strong><p>“It only charges some of the time.”</p><span>OWNER-REPORTED · SAMPLE</span></div></li>{outcomeAdded && <><li><ArrowCounterClockwise size={19} /><div><strong>Battery replaced. Fault returned.</strong><p>A technician put in a new battery. The same problem was back 21 days later.</p><span>TESTED BY A TECHNICIAN · SAMPLE</span></div></li><li><Check size={19} /><div><strong>Tried a charger that works</strong><p>Same problem, so the charger probably isn’t the cause.</p><span>TESTED BY A TECHNICIAN · SAMPLE</span></div></li></>}</ol>}</section><section className="demo-story"><h2>What was learned<br />stays with the laptop.</h2><p>Each result you record changes what Retrace suggests next. When the laptop is sold, the buyer gets all of it.</p><p className="demo-state-note">In this example the switch between owners happens in your browser. For a real laptop, Retrace asks Sui who owns it, through Tatum, before showing any history. The records themselves come from Walrus Memory.</p><Link href="/devices" className="text-link">Register a real laptop <ArrowUpRight size={17} /></Link>{LIVE_PASSPORT && <p className="mt-3"><Link href={`/passport/${LIVE_PASSPORT}`} className="text-link">See a real passport on Sui Mainnet, for a ThinkPad T480 <ArrowUpRight size={17} /></Link></p>}</section></div>
  </div>;
}

