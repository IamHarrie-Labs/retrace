import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Privacy and data" };

const sections: { tag: string; title: string; who: string; body: string[] }[] = [
  {
    tag: "Public · permanent",
    title: "The passport on Sui Mainnet",
    who: "Anyone can read it",
    body: [
      "Registering a laptop creates a passport object holding its category, make, model, the wallet that created it, the time it was created and its current owner. Transfers are public events.",
      "The serial number is never written on-chain. Retrace stores a keyed hash of it, made with a secret held on Retrace's server, so the serial cannot be guessed back from the hash.",
      "Blockchain data cannot be edited or deleted, by you or by Retrace.",
    ],
  },
  {
    tag: "Private to the holder",
    title: "Repair records",
    who: "The current owner, and anyone they share a link with",
    body: [
      "Symptoms, repairs, outcomes, and optional cost and shop name are stored in a Walrus Memory account that Retrace runs. Retrace keeps a working copy in its server database to track each storage receipt.",
      "Retrace shows the records only to the wallet that owns the passport right now, which it checks through Tatum, or to someone with that owner's share link. Retrace itself can also read them.",
      "Role and evidence are declared by the holder unless a repair shop has signed the record.",
    ],
  },
  {
    tag: "Opt-in",
    title: "Shared lessons",
    who: "Used to improve advice for everyone",
    body: [
      "When you save a resolved repair you can choose to share a tip for that model, such as which fix worked for a symptom on a ThinkPad T480. Device notes, costs and wallet details are left out.",
      "Leave the box unticked and nothing from your record is shared.",
    ],
  },
  {
    tag: "Expiring",
    title: "Links you send",
    who: "Whoever holds the link",
    body: [
      "Read-only share links last 1 to 30 days (7 by default) and stop working the moment the laptop changes hands.",
      "Handover links last 3 days. Shop verification links last 7 days and open only the one record you chose.",
      "A copy someone already viewed or downloaded can't be taken back.",
    ],
  },
  {
    tag: "Your session",
    title: "Signing in",
    who: "You",
    body: [
      "Signing in asks your wallet to sign a message. It costs nothing and moves no funds. Retrace then sets a session cookie that only the server can read, valid for 12 hours.",
      "Your browser keeps a few settings locally, such as the pause-motion switch and an unfinished transaction, so a reload does not lose them.",
      "There are no analytics, ads or tracking scripts, and fonts load from Retrace's own server.",
    ],
  },
  {
    tag: "Service providers",
    title: "Who else is involved",
    who: "Only to run the service",
    body: [
      "Tatum: Retrace sends passport IDs and wallet addresses to read ownership and network data from Sui.",
      "Walrus Memory: stores and recalls repair records and shared lessons.",
      "Enoki: handles Google sign-in and sponsored transactions when those are switched on.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="privacy-page">
      <div className="page-heading">
        <p className="eyebrow">Privacy and data</p>
        <h1>What we keep.<br /><em>Who can see it.</em></h1>
        <p>A plain-language summary of what Retrace stores, where it lives and who can read it. It explains how the app works today. It isn&rsquo;t a legal agreement.</p>
      </div>
      <div className="privacy-grid">
        {sections.map(s => (
          <section key={s.title} className="privacy-card">
            <span className="privacy-tag">{s.tag}</span>
            <h2>{s.title}</h2>
            <p className="privacy-who">{s.who}</p>
            <ul>{s.body.map(b => <li key={b.slice(0, 40)}>{b}</li>)}</ul>
          </section>
        ))}
      </div>
      <section className="privacy-note">
        <h2>A suggestion for a technician to confirm</h2>
        <p>Retrace ranks the next check from recorded symptoms and outcomes. It does not inspect your laptop. A qualified technician should assess the hardware before any repair, and Retrace is not responsible for repair decisions made from its suggestions.</p>
      </section>
      <div className="privacy-links">
        <Link href="/proof" className="text-link">See what is stored right now <ArrowUpRight size={17} /></Link>
        <Link href="/demo" className="text-link">Try it without a wallet <ArrowUpRight size={17} /></Link>
      </div>
    </div>
  );
}
