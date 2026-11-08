"use client";

import Link from "next/link";
import { useState } from "react";
import { TraceField } from "./trace-field";

const inks = ["#26211e", "#DC942F", "#71C7B7", "#455330", "#517BB3", "#A24250"];
const names = ["Ink", "Ochre", "Sea glass", "Olive", "Cobalt", "Cranberry"];
export function SourceHeroArt() {
  const [ink, setInk] = useState(0);
  return <>
    <aside className="hand js-line-displacement" aria-label="Interactive contour illustration of a laptop">
      <TraceField color={inks[ink]} />
      <span className="trace-caption">Every line carries a little history.</span>
    </aside>
    <div className="source-ink-controls" role="group" aria-label="Change illustration ink">
      {inks.map((color, index) => <button key={color} aria-label={`${names[index]} illustration ink`} aria-pressed={index === ink} onClick={() => setInk(index)} style={{ "--swatch": color } as React.CSSProperties}><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 11h16v9H15v9h16" stroke="currentColor" strokeWidth="2.5"/><circle cx="9" cy="11" r="3" fill="currentColor"/><circle cx="31" cy="29" r="3" fill="currentColor"/></svg></button>)}
    </div>
  </>;
}

export function SourceMemory() {
  const [remember, setRemember] = useState(true);
  return <div className="source-memory" aria-label="Illustrative repair memory comparison">
    <div className="source-memory-top"><span>RT—001 / ThinkPad T480</span><span className="source-sample">Sample</span></div>
    <p className="source-memory-symptom">“It still won’t charge.”</p>
    <ol><li><span className="source-history-dot"/><span>Battery replaced<small>Technician-attested · example</small></span></li><li><span className="source-history-dot returned"/><span>Fault returned after 21 days<small>Owner-reported · example</small></span></li></ol>
    <div className="source-next-check"><div><span>Use repair memory</span><button role="switch" aria-checked={remember} aria-label="Use repair memory" onClick={() => setRemember(!remember)}><span/></button></div><p aria-live="polite">{remember ? "Inspect the charging connection before replacing the battery again." : "Start by checking battery health and cycle count."}</p><small>{remember ? "The failed repair changes the next check." : "Without history, the suggestion starts from its initial assumptions."}</small></div>
  </div>;
}

const paths = [
  { title: "I own a laptop.", text: "I want to keep its history together and avoid repeating the same repair.", color: "var(--color-blue)", cta: "Start its next chapter", routes: [{ title: "Give it a passport.", text: "Connect a wallet and register your laptop.", href: "/devices", cta: "My devices" }, { title: "See one in action.", text: "Explore a complete sample before connecting.", href: "/demo", cta: "Try the example" }] },
  { title: "I repair laptops.", text: "I want to see what was tried before I decide what comes next.", color: "var(--color-orange)", cta: "Follow the evidence", routes: [{ title: "Start with the context.", text: "See how repair outcomes change the next check.", href: "/demo", cta: "Explore the repair story" }, { title: "Open a service book.", text: "Sign in with the current holder’s wallet.", href: "/devices", cta: "Open my devices" }] },
  { title: "I’m buying used.", text: "I want a useful service history to come with the laptop.", color: "var(--color-green)", cta: "Understand the handover", routes: [{ title: "Keep the useful history.", text: "Explore a simulated transfer from owner A to B.", href: "/demo", cta: "See the handover" }, { title: "Inspect the proof.", text: "View the live storage account and network reads.", href: "/proof", cta: "Open onchain proof" }] },
  { title: "I’m just exploring.", text: "I’d like to understand the idea without connecting a wallet.", color: "var(--color-red)", cta: "Take a look around", routes: [{ title: "A three-minute story.", text: "One device, a failed fix and a better next check.", href: "/demo", cta: "Try the sample" }, { title: "A little more detail.", text: "See what the records prove, and what they don’t.", href: "/proof", cta: "Inspect the evidence" }] },
];

export function SourceOnboarding() {
  const [active, setActive] = useState<number | null>(null);
  return <div className="source-slice-onboarding"><section className="onboarding" aria-labelledby="intro-selection-title">
    <header className="header"><small className="eyebrow">Enough about the idea.</small><div className="title-head"><div className="title"><h2 id="intro-selection-title">Where does your story start?</h2></div>{active !== null && <button className="reset visible" onClick={() => setActive(null)} aria-label="Close all choices">×</button>}</div><div className="description"><p>A first repair, a stubborn fault or a new owner. Choose the chapter that sounds like yours.</p></div></header>
    <ul className="tiles">{paths.map((path, index) => <li key={path.title} className={`tile ${active === index ? "open" : ""}`} style={{ "--tile-color": path.color } as React.CSSProperties}>
      <div className="tile-face"><button type="button" className="card-trigger" aria-expanded={active === index} aria-controls={`source-choices-${index}`} aria-label={`${active === index ? "Close" : "Explore"} ${path.title}`} onClick={() => setActive(active === index ? null : index)}><span className="tile-collapsed" aria-hidden={active === index}><span className="tile-collapsed-body"><span className="tile-title"><h3>{path.title}</h3></span><span className="tile-description">{path.text}</span></span><span className="cta tile-cta">{path.cta}</span></span><span className="card-view" aria-hidden={active !== index}><span className="split-desc">{path.title}<small>Choose a next step below.<br/>Click this tile to close.</small></span></span></button></div>
      <div id={`source-choices-${index}`} className="source-choices" inert={active !== index} aria-hidden={active !== index}>{path.routes.map((route, routeIndex) => <Link href={route.href} key={route.href} className={`split ${routeIndex === 0 ? "split-a" : "split-b"} source-route-card`}><h3>{route.title}</h3><p>{route.text}</p><span className="cta">{route.cta}</span></Link>)}</div>
      <div className="ghost" aria-hidden="true"/>
    </li>)}</ul>
    <Link href="/devices" className="tile-contact-cta cta-host">Good things deserve another chapter.<span className="cta cta--inverted">Start a device passport</span></Link>
  </section></div>;
}
