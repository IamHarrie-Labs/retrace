import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

const passes = [
  { role: "Owner", from: "NEW", fromSub: "unknown laptop", to: "KNOWN", toSub: "full history", title: "Give it a passport.", text: "Register your laptop once. From then on, each repair is saved to it, along with whether it worked.", items: ["Passport on Sui, repairs on Walrus", "Your serial number is never made public"], hello: "Registered!", href: "/devices", img: "/images/photos/thinkpad-studio.jpg", alt: "A Lenovo ThinkPad T470" },
  { role: "Buyer", from: "SELLER", fromSub: "their wallet", to: "YOU", toSub: "your wallet", title: "Check it before you buy.", text: "Scan the sticker to see how many owners and repairs it has had. Once you pay, the seller sends a link and the passport moves to you.", items: ["Public summary, no sign-in needed", "Full history on a 7-day link from the seller"], hello: "It's yours!", href: "/demo", img: "/images/photos/thinkpad-table.jpg", alt: "A ThinkPad on a wooden table" },
  { role: "Repair shop", from: "FIXED", fromSub: "the repair", to: "SIGNED", toSub: "shop verified", title: "Sign the repair you did.", text: "Open the record the owner sends you and sign it with your shop's wallet. Every later owner sees it marked as checked by you.", items: ["You only see the record you're asked to sign", "Your signature is saved with it on Walrus"], hello: "Verified!", href: "/demo", img: "/images/photos/thinkpad-cooling.jpg", alt: "A ThinkPad fan and heatsink removed for service" },
];

export function BoardingPasses() {
  return (
    <section className="bp" id="how" aria-labelledby="bp-title">
      <h2 className="bp-head" id="bp-title"><span>One laptop,</span><span>three people.</span></h2>
      <p className="bp-sub">The owner, the buyer and the repair shop each see the same history, from their own side. It belongs to the laptop, so whoever has the laptop next gets it.</p>
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
