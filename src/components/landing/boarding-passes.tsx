import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

const passes = [
  { role: "Owner", from: "NEW", fromSub: "unknown laptop", to: "KNOWN", toSub: "full history", title: "Give it a passport.", text: "Register a laptop once. Every symptom, repair and outcome stays tied to it.", items: ["Device passport on Sui", "Records on Walrus Memory", "Serial stored as a keyed hash"], hello: "Registered!", href: "/devices", img: "/images/photos/thinkpad-studio.jpg", alt: "A Lenovo ThinkPad T470" },
  { role: "Buyer", from: "SELLER", fromSub: "their wallet", to: "YOU", toSub: "your wallet", title: "Check it, then claim it.", text: "Scan the sticker before you pay. Claim the passport with one link when you do.", items: ["Public check-before-you-buy summary", "7-day read-only history link", "One-click claim handover"], hello: "It's yours!", href: "/demo", img: "/images/photos/thinkpad-table.jpg", alt: "A ThinkPad on a wooden table" },
  { role: "Repair shop", from: "FIXED", fromSub: "the repair", to: "SIGNED", toSub: "shop verified", title: "Sign the repair you did.", text: "Open one record, sign it with the shop's wallet, and it shows as verified for every future owner.", items: ["Sees only that one record", "Signature stored on Walrus", "Lessons help the next tech"], hello: "Verified!", href: "/demo", img: "/images/photos/thinkpad-cooling.jpg", alt: "A ThinkPad fan and heatsink removed for service" },
];

export function BoardingPasses() {
  return (
    <section className="bp" id="how" aria-labelledby="bp-title">
      <h2 className="bp-head" id="bp-title"><span>Three people.</span><span>One history.</span></h2>
      <p className="bp-sub">Each person who touches the laptop gets the pass they need. The history travels with the device, not with whoever owned it last.</p>
      <div className="bp-grid">
        {passes.map(p => (
          <Link key={p.role} href={p.href} className="bp-card" aria-label={`${p.role}: ${p.title}`}>
            <div className="bp-photo"><Image src={p.img} alt={p.alt} fill sizes="(max-width:960px) 82vw, 31vw" /></div>
            <div className="bp-wrap">
              <div className="bp-pass">
                <div className="bp-eye"><span>Boarding pass ·</span><span>{p.role}</span></div>
                <div className="bp-route"><span>{p.from}<small>{p.fromSub}</small></span><i aria-hidden="true" /><span style={{ textAlign: "right" }}>{p.to}<small>{p.toSub}</small></span></div>
                <h3 className="bp-title">{p.title}</h3>
                <p className="bp-desc">{p.text}</p>
                <div className="bp-inc"><span>Included</span><ul>{p.items.map(x => <li key={x}>{x}</li>)}</ul></div>
                <div className="bp-foot"><span>{p.hello}</span><span className="go" aria-hidden="true"><ArrowRight size={20} weight="bold" /></span></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
