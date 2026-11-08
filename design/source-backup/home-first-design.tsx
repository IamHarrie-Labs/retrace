import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Fingerprint, ArrowsClockwise, Notebook, Swap, Check, Minus } from "@phosphor-icons/react/dist/ssr";
import { MemoryPreview } from "@/components/memory-preview";
import { BrandMark } from "@/components/brand";
import { Reveal } from "@/components/reveal";

export default function Home() {
  return <div className="landing">
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow"><span className="small-rule" /> A living service book for your laptop</div>
        <h1 id="hero-title">A little history.<br /><em>A longer life.</em></h1>
        <p className="hero-description">The fix that failed. The lesson that helped.<br className="desktop-break" /> Give your laptop a memory that stays with it,<br className="desktop-break" /> even when it changes hands.</p>
        <div className="hero-actions"><Link href="/devices" className="action-button">Start a passport <ArrowUpRight size={20} /></Link><Link href="/demo" className="text-link">See it remember <ArrowUpRight size={19} /></Link></div>
        <div className="hero-note"><Fingerprint size={22} weight="light" /><span>One device. Every chapter.</span></div>
      </div>
      <div className="hero-art">
        <div className="art-meta"><span>A HISTORY WORTH KEEPING</span><ArrowDownRight size={19} /></div>
        <Image src="/images/retrace-device.png" alt="A silver laptop shown in layers, connected by a continuous green memory trace" fill sizes="(max-width: 760px) 100vw, 49vw" priority className="hero-device-image" />
        <div className="art-caption"><span>Designed to remember.<br />Built to be passed on.</span><BrandMark /></div>
      </div>
      <div className="hero-foot"><span>Remember the fault.</span><ArrowRight size={18} /><span>Learn from the fix.</span><ArrowRight size={18} /><span>Pass it forward.</span><Link href="/demo" aria-label="Explore the interactive repair story"><ArrowUpRight size={23} /></Link></div>
    </section>

    <section className="intro-section section-pad" id="the-idea">
      <Reveal><p className="eyebrow">The things we keep</p><h2>Your laptop has a past.<br /><em>It shouldn’t have to start over.</em></h2></Reveal>
      <Reveal className="intro-body"><p>A battery replaced twice. A charging fault that keeps coming back. A useful diagnosis lost in someone’s inbox.</p><p>Retrace brings those scattered moments together. Each repair becomes context for the next decision, so a new technician or owner can pick up where the last one left off.</p><Link href="/demo" className="text-link">Meet a laptop with a memory <ArrowUpRight size={18} /></Link></Reveal>
    </section>

    <section className="memory-section" id="memory" aria-labelledby="memory-heading">
      <div className="memory-heading"><div><p className="eyebrow">A little context changes everything</p><h2 id="memory-heading">Same laptop.<br /><em>A better next question.</em></h2></div><p>A failed repair should change what comes next.<br />Flip the switch and see the difference.</p></div>
      <MemoryPreview />
    </section>

    <section className="how-section section-pad" id="how-it-works">
      <Reveal className="how-header"><p className="eyebrow">From first fault to next owner</p><h2>Every chapter<br /><em>stays connected.</em></h2><p>Small records. Useful lessons.<br />One continuous device story.</p></Reveal>
      <div className="chapter-list">
        {[{n:"01", icon:Fingerprint, title:"Give it a passport.", text:"Register your laptop once. Its digital passport gives every repair a place to belong.",tone:"sage"}, {n:"02",icon:Notebook,title:"Keep the useful details.",text:"Record symptoms, tests, repairs and what happened afterward. Every entry shows who reported it and the evidence behind it.",tone:"butter"}, {n:"03",icon:ArrowsClockwise,title:"Let experience change the advice.",text:"When a fix doesn’t hold, Retrace reconsiders it. See which records changed the suggested next check.",tone:"pink"}, {n:"04",icon:Swap,title:"Pass the knowledge on.",text:"Transfer the passport when you sell the laptop. The next owner gets its service context through Retrace.",tone:"blue"}].map(({n,icon:Icon,title,text,tone}) => <Reveal key={n} className="chapter-row"><div className={`chapter-icon ${tone}`}><Icon size={32} weight="light" /></div><div><span className="chapter-number">{n}</span><h3>{title}</h3><p>{text}</p></div><ArrowUpRight className="chapter-arrow" size={22} weight="light" /></Reveal>)}
      </div>
    </section>

    <section className="trust-section section-pad" id="trust">
      <Reveal className="trust-heading"><p className="eyebrow">Evidence, with its edges showing</p><h2>A record is a record.<br /><em>Not a promise.</em></h2><p>Good repair decisions need clear sources.<br />We keep the distinction visible.</p><Link href="/proof" className="text-link">Explore the onchain proof <ArrowUpRight size={18} /></Link></Reveal>
      <div className="trust-list">
        <div><Check size={21} /><p><strong>Attributed, never anonymous.</strong><span>Owner reports and technician-attested tests carry different evidence labels.</span></p></div>
        <div><Check size={21} /><p><strong>A suggestion you can trace.</strong><span>See the outcomes behind the next check. A recommendation is not a confirmed diagnosis.</span></p></div>
        <div><Check size={21} /><p><strong>Access follows the passport.</strong><span>Retrace checks the current Sui passport holder before serving repair history.</span></p></div>
        <div><Minus size={21} /><p><strong>Clear about what we control.</strong><span>Memory sits in Retrace’s operator-managed account. Access is enforced by our app, and the operator can read stored records.</span></p></div>
      </div>
    </section>

    <section className="faq-section section-pad" aria-labelledby="faq-heading"><div><p className="eyebrow">Before the next chapter</p><h2 id="faq-heading">A few good<br /><em>questions.</em></h2></div><div className="faq-list">
      {[['Do I need a wallet to try it?',<>No. <Link href="/demo">The interactive example</Link> works without a wallet. Creating or transferring a real passport requires a Sui wallet and signing the relevant transaction.</>],['Does Retrace know what is wrong with my laptop?',<>It suggests diagnostic checks using recorded symptoms and outcomes. It does not inspect your hardware or establish a diagnosis. A qualified technician should assess the device.</>],['What happens when I sell my laptop?',<>You transfer its digital passport to the buyer’s wallet. Retrace checks the updated owner before giving access to the service history. This cannot erase records someone already downloaded.</>],['Where is the history stored?',<>Repair memories are stored on Walrus through Retrace’s operator-managed account. Storage has a retention period and needs renewal. Sui records the passport, and Tatum supplies the chain reads.</>]].map(([q,a],i)=><details key={i}><summary>{q}<span aria-hidden="true">+</span></summary><div className="faq-answer">{a}</div></details>)}
    </div></section>
  </div>;
}
